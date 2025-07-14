import OpenAI from 'openai';
import { OpenAIResponse, AEOSuggestion, CompetitiveAnalysis, CompetitorMention, MultiProviderQuestion } from './types';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Helper function to clean JSON content from markdown blocks
function cleanJsonContent(content: string): string {
  let cleanContent = content.trim();
  
  // Remove markdown code blocks if they exist
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  return cleanContent;
}

// Helper function to attempt JSON repair for incomplete responses
function tryParseIncompleteJson(content: string): any {
  try {
    return JSON.parse(content);
  } catch (error) {
    // Try to fix common JSON truncation issues
    let fixedContent = content;
    
    // If the content ends abruptly, try to close common structures
    if (!fixedContent.endsWith('}')) {
      // Count open braces vs closed braces
      const openBraces = (fixedContent.match(/\{/g) || []).length;
      const closeBraces = (fixedContent.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;
      
      // Try to close missing braces
      if (missingBraces > 0) {
        // Add missing closing brackets and braces
        if (fixedContent.endsWith(',')) {
          fixedContent = fixedContent.slice(0, -1); // Remove trailing comma
        }
        fixedContent += '}'.repeat(missingBraces);
      }
    }
    
    // Try to parse the fixed content
    try {
      return JSON.parse(fixedContent);
    } catch (secondError) {
      // If still fails, throw the original error
      throw error;
    }
  }
}

// Función auxiliar para crear análisis detallado de competidores
function createDetailedCompetitorAnalysis(
  multiProviderResults: MultiProviderQuestion[], 
  domain: string
): { competitorMap: Map<string, any>, totalResponses: number } {
  const competitorMap = new Map<string, any>();
  let totalResponses = 0;
  
  multiProviderResults.forEach(mpq => {
    mpq.results.forEach(result => {
      totalResponses++;
      
      // Buscar menciones de competidores en cada respuesta
      const response = result.response.toLowerCase();
      const words = response.split(/\s+/);
      
      // Buscar patrones de empresas (nombres propios, dominios, etc.)
      const companyPatterns = [
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g, // Nombres propios
        /\b([a-z]+\.(?:com|cl|net|org|io))\b/g, // Dominios
        /\b([A-Z]{2,})\b/g // Acrónimos
      ];
      
      companyPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(result.response)) !== null) {
          const companyName = match[1];
          
          // Filtrar nombres muy genéricos o irrelevantes
          if (companyName.length > 2 && 
              !['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THIS', 'THAT'].includes(companyName.toUpperCase()) &&
              companyName.toLowerCase() !== domain.toLowerCase()) {
            
            if (!competitorMap.has(companyName)) {
              competitorMap.set(companyName, {
                name: companyName,
                mentions: 0,
                providers: new Set(),
                questions: new Set(),
                sentiments: [],
                contexts: []
              });
            }
            
            const competitor = competitorMap.get(companyName);
            competitor.mentions++;
            competitor.providers.add(result.provider);
            competitor.questions.add(mpq.question);
            competitor.sentiments.push(result.sentiment);
            competitor.contexts.push(result.response.substring(0, 200));
          }
        }
      });
    });
  });
  
  return { competitorMap, totalResponses };
}

export async function generateQuestions(domain: string, sector: string, keywords?: string, customQuestions?: string[]): Promise<string[]> {
  try {
    // Si se proporcionan preguntas personalizadas, usarlas directamente
    if (customQuestions && customQuestions.length > 0) {
      console.log(`Usando ${customQuestions.length} preguntas personalizadas`);
      return customQuestions;
    }

    // Generar preguntas automáticamente si no hay preguntas personalizadas
    const client = getOpenAIClient();
    const keywordsPart = keywords ? ` Palabras clave adicionales para considerar: ${keywords}.` : '';
    
    const prompt = `Actúa como experto en comportamiento del consumidor y búsquedas de usuarios. Necesito que generes preguntas que un cliente potencial haría cuando busca específicamente ENCONTRAR, ELEGIR o CONTRATAR servicios/productos del sector "${sector}".${keywordsPart}

IMPORTANTE: Las preguntas deben tener INTENCIÓN DE BÚSQUEDA ESPECÍFICA, del tipo que naturalmente llevaría a recomendaciones de marcas o empresas concretas.

Tipos de preguntas que necesito:
- "¿Dónde encuentro la mejor [servicio del sector]?"
- "¿Cuál es la mejor empresa de [sector]?"
- "¿Qué [servicio del sector] me recomiendan?"
- "¿Dónde contratar [servicio del sector] de calidad?"
- "¿Cuál es el mejor proveedor de [sector]?"
- "¿Qué empresa de [sector] es más confiable?"
- "¿Dónde encuentro [servicio del sector] más económico?"

Las preguntas deben:
- Buscar recomendaciones concretas de empresas/marcas
- Usar términos como "mejor", "dónde encontrar", "cuál elegir", "me recomiendan"
- Ser del tipo que cualquier persona haría al buscar un proveedor
- NO mencionar marcas específicas en la pregunta
- Representar intención real de contratación/compra

Genera exactamente 5 preguntas de este tipo para el sector "${sector}".

Responde ÚNICAMENTE con un array JSON de strings, sin explicaciones adicionales.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en intención de búsqueda y comportamiento del consumidor. Genera preguntas que busquen recomendaciones específicas de proveedores, sin mencionar marcas concretas en las preguntas.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No se pudo generar las preguntas - respuesta vacía de OpenAI');
    }

    try {
      const cleanContent = cleanJsonContent(content);
      const questions = JSON.parse(cleanContent);
      if (!Array.isArray(questions)) {
        throw new Error('La respuesta no es un array válido');
      }
      return questions;
    } catch (parseError) {
      console.error('Error parsing questions:', content);
      throw new Error('Error al parsear las preguntas generadas');
    }
  } catch (error) {
    console.error('Error in generateQuestions:', error);
    throw error;
  }
}

export async function analyzeQuestionResponse(
  question: string, 
  domain: string, 
  sector: string, 
  keywords?: string
): Promise<OpenAIResponse> {
  const client = getOpenAIClient();
  
  // PASO 1: Generar respuesta completamente natural sin contexto de marca
  const responsePrompt = `${question}`;
  
  const responseGeneration = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente de IA útil. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.'
      },
      {
        role: 'user',
        content: responsePrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  });

  const chatgptResponse = responseGeneration.choices[0]?.message?.content || '';

  // PASO 2: Analizar la respuesta con contexto completo de la marca
  const analysisPrompt = `Actúa como un experto en análisis de contenido y marketing digital. Tu tarea es evaluar si una marca específica fue mencionada en una respuesta de IA.

CONTEXTO DE LA MARCA A ANALIZAR:
- Dominio/Marca: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

PREGUNTA ORIGINAL: "${question}"

RESPUESTA A ANALIZAR:
"${chatgptResponse}"

INSTRUCCIONES DE ANÁLISIS:
1. Busca menciones directas del dominio "${domain}" o variaciones muy similares
2. Busca menciones indirectas que puedan referirse a la marca (nombres similares, referencias contextuales)
3. Evalúa la relevancia de la marca en el contexto de la pregunta
4. Determina la posición aproximada de la mención (1-10, donde 1 es al principio)
5. Evalúa el sentimiento de la mención (positivo, negativo, neutral)

CONSIDERA:
- Solo marca como "mencionada" si hay una referencia clara y directa
- Las menciones genéricas del sector NO cuentan como menciones de la marca
- La posición debe reflejar dónde aparece la mención más prominente
- El sentimiento debe basarse en el contexto de la mención

Responde en formato JSON con esta estructura exacta:
{
  "question": "la pregunta original",
  "response": "la respuesta completa analizada",
  "mentioned": boolean,
  "position": number o null,
  "sentiment": "positive" | "negative" | "neutral",
  "analysis_notes": "breve explicación del análisis realizado"
}`;

  const analysisResponse = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en análisis de contenido y marketing digital. Responde únicamente con el JSON solicitado, sin explicaciones adicionales.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ],
    temperature: 0.2,
    max_tokens: 800
  });

  const analysisContent = analysisResponse.choices[0]?.message?.content;
  if (!analysisContent) {
    throw new Error('No se pudo analizar la respuesta');
  }

  try {
    const cleanContent = cleanJsonContent(analysisContent);
    const result = JSON.parse(cleanContent);
    
    // Validar estructura de respuesta
    if (!result.hasOwnProperty('mentioned') || !result.hasOwnProperty('sentiment')) {
      throw new Error('Estructura de respuesta inválida');
    }
    
    return {
      question,
      response: chatgptResponse,
      mentioned: result.mentioned,
      position: result.mentioned ? result.position : null,
      sentiment: result.sentiment,
      analysis_notes: result.analysis_notes || ''
    };
  } catch (error) {
    console.error('Error parsing analysis:', analysisContent);
    throw new Error('Error al parsear el análisis de la respuesta');
  }
}

export async function generateSuggestions(
  results: OpenAIResponse[], 
  domain: string, 
  sector: string, 
  keywords?: string
): Promise<AEOSuggestion[]> {
  const client = getOpenAIClient();
  
  // Calcular métricas de visibilidad
  const totalQuestions = results.length;
  const mentionedCount = results.filter(r => r.mentioned).length;
  const visibilityRate = (mentionedCount / totalQuestions) * 100;
  
  // Categorizar preguntas por resultado
  const mentionedQuestions = results.filter(r => r.mentioned);
  const notMentionedQuestions = results.filter(r => !r.mentioned);
  
  const resultsJson = JSON.stringify(results, null, 2);
  
  const prompt = `Actúa como un experto en marketing digital y optimización AEO (Answer Engine Optimization). Analiza estos resultados de visibilidad de marca en respuestas de IA para la marca "${domain}" del sector "${sector}".

DATOS DE LA MARCA:
- Dominio: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

MÉTRICAS DE VISIBILIDAD:
- Total de preguntas analizadas: ${totalQuestions}
- Menciones obtenidas: ${mentionedCount}
- Tasa de visibilidad: ${visibilityRate.toFixed(1)}%

RESULTADOS DETALLADOS:
${resultsJson}

ANÁLISIS REQUERIDO:
Con base en estos datos, genera exactamente 4 sugerencias específicas y accionables para mejorar la visibilidad AEO de la marca. Cada sugerencia debe:

1. Ser específica y práctica
2. Basarse en los gaps identificados en el análisis
3. Ser implementable con recursos razonables
4. Tener impacto medible en la visibilidad

ESTRUCTURA REQUERIDA:
Cada sugerencia debe tener:
- title: Título claro y específico
- description: Descripción detallada de la acción (mínimo 50 palabras)
- priority: "Alta", "Media" o "Baja" (basado en impacto vs esfuerzo)
- category: "Contenido", "Técnico", "Estrategia" o "Optimización"
- impact: Descripción del impacto esperado

CONSIDERACIONES ESPECIALES:
- Si la visibilidad es baja (<30%), prioriza estrategias de contenido y autoridad
- Si la visibilidad es media (30-70%), enfócate en optimización y posicionamiento
- Si la visibilidad es alta (>70%), sugiere estrategias de mantener y expandir
- Considera las preguntas donde NO aparece la marca como oportunidades principales

Responde ÚNICAMENTE con un array JSON de objetos, sin explicaciones adicionales.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en marketing digital y AEO. Responde únicamente con el JSON solicitado.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No se pudieron generar las sugerencias');
  }

  try {
    const cleanContent = cleanJsonContent(content);
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error parsing suggestions:', content);
    throw new Error('Error al parsear las sugerencias generadas');
  }
} 

export async function analyzeCompetition(
  results: OpenAIResponse[], 
  domain: string, 
  sector: string, 
  keywords?: string,
  multiProviderResults?: MultiProviderQuestion[]
): Promise<CompetitiveAnalysis> {
  const client = getOpenAIClient();
  
  // Combinar todas las respuestas para análisis
  let allResponses = results.map(r => r.response).join('\n\n');
  
  // Si tenemos resultados de múltiples proveedores, incluirlos también
  if (multiProviderResults && multiProviderResults.length > 0) {
    const multiProviderResponses = multiProviderResults.flatMap(mpq => 
      mpq.results.map(result => result.response)
    ).join('\n\n');
    
    allResponses = allResponses + '\n\n' + multiProviderResponses;
    
    // Crear análisis detallado con múltiples proveedores
    const { competitorMap, totalResponses } = createDetailedCompetitorAnalysis(multiProviderResults, domain);
    
    // Agregar información sobre la cobertura de proveedores al prompt
    const providerCoverage = Array.from(competitorMap.values())
      .map(comp => `${comp.name}: ${comp.mentions} menciones en ${comp.providers.size} proveedores`)
      .join('\n');
    
    allResponses += `\n\nRESUMEN DE COBERTURA POR PROVEEDOR:\n${providerCoverage}`;
  }
  
  const prompt = `Actúa como un experto en análisis competitivo y marketing digital. Analiza las siguientes respuestas de IA para identificar y evaluar la competencia mencionada.

CONTEXTO:
- Marca objetivo: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

RESPUESTAS A ANALIZAR (de múltiples proveedores de IA):
${allResponses}

INSTRUCCIONES:
1. Identifica TODAS las empresas, marcas o proveedores mencionados en las respuestas
2. Excluye herramientas genéricas (como "Google", "Microsoft" a menos que sean específicamente relevantes al sector)
3. Cuenta cuántas veces aparece cada competidor ACROSS ALL PROVIDERS (OpenAI, Claude, Gemini, Perplexity)
4. Evalúa el sentimiento general hacia cada competidor
5. Identifica gaps de mercado donde no se mencionan competidores específicos
6. Prioriza competidores que aparecen en múltiples proveedores (mayor consenso)
7. Considera la consistencia de las menciones entre diferentes proveedores de IA

Responde en formato JSON con esta estructura exacta:
{
  "competitors": [
    {
      "name": "Nombre de la empresa",
      "mentions": número_de_menciones,
      "sentiment": "positive" | "negative" | "neutral",
      "description": "Breve descripción de cómo se presenta la empresa",
      "provider_consensus": número_de_proveedores_que_la_mencionan
    }
  ],
  "market_gaps": [
    "Área específica donde no se mencionan competidores claros"
  ],
  "competitive_strength": "low" | "medium" | "high",
  "key_insights": [
    "Insight importante sobre la competencia"
  ]
}

IMPORTANTE: 
- Responde únicamente con el JSON válido y completo
- No agregues explicaciones antes o después del JSON
- Asegúrate de cerrar todas las llaves y corchetes
- Limita la descripción de cada competidor a máximo 100 caracteres
- Si hay muchos competidores, incluye solo los 20 más relevantes`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en análisis competitivo. Responde únicamente con el JSON solicitado.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2500
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No se pudo generar el análisis competitivo');
  }

  try {
    const cleanContent = cleanJsonContent(content);
    console.log('Cleaned content for parsing:', cleanContent);
    
    const competitiveData = tryParseIncompleteJson(cleanContent);
    
    // Validar estructura básica
    if (!competitiveData.competitors || !Array.isArray(competitiveData.competitors)) {
      throw new Error('Invalid competitors data structure');
    }
    
    // Procesar datos para el formato final
    const totalQuestions = results.length;
    const topCompetitors: CompetitorMention[] = competitiveData.competitors.map((comp: any) => ({
      name: comp.name || 'Unknown',
      count: comp.mentions || 0,
      positions: [], // Se podría calcular si es necesario
      sentiment: comp.sentiment || 'neutral',
      questions: [], // Se podría mapear si es necesario
      marketShare: totalQuestions > 0 ? ((comp.mentions || 0) / totalQuestions) * 100 : 0,
      providerConsensus: comp.provider_consensus || 1 // Nuevo campo para mostrar consenso
    }));

    const competitiveAnalysis: CompetitiveAnalysis = {
      totalCompetitors: competitiveData.competitors.length,
      topCompetitors: topCompetitors.sort((a, b) => {
        // Priorizar por consenso de proveedores, luego por número de menciones
        const consensusDiff = (b.providerConsensus || 1) - (a.providerConsensus || 1);
        return consensusDiff !== 0 ? consensusDiff : b.count - a.count;
      }).slice(0, 10),
      marketGaps: competitiveData.market_gaps || [],
      competitiveStrength: competitiveData.competitive_strength || 'medium',
      recommendations: competitiveData.key_insights || []
    };

    return competitiveAnalysis;
  } catch (error) {
    console.error('Error parsing competitive analysis:', {
      error: error.message,
      content: content,
      contentLength: content?.length
    });
    
    // Fallback: return basic structure if parsing fails
    return {
      totalCompetitors: 0,
      topCompetitors: [],
      marketGaps: ['Error al procesar análisis competitivo'],
      competitiveStrength: 'medium' as const,
      recommendations: ['Se requiere análisis manual debido a error en procesamiento']
    };
  }
} 