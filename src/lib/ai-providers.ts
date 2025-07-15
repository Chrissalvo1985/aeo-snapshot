import OpenAI from 'openai';
import { AIProvider, ProviderResult } from './types';

// Configuración de clientes
let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Helper para limpiar contenido JSON
function cleanJsonContent(content: string): string {
  let cleanContent = content.trim();
  
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

// Helper function to clean response content from metadata
function cleanResponseContent(content: string): string {
  let cleanContent = content;
  
  // Remove "FUENTES CONSULTADAS:" section and everything after it (case insensitive)
  cleanContent = cleanContent.replace(/\*\*FUENTES CONSULTADAS:\*\*[\s\S]*$/i, '');
  cleanContent = cleanContent.replace(/FUENTES CONSULTADAS:[\s\S]*$/i, '');
  
  // Remove "Fuentes:" section and everything after it
  cleanContent = cleanContent.replace(/\*\*Fuentes:\*\*[\s\S]*$/i, '');
  cleanContent = cleanContent.replace(/Fuentes:[\s\S]*$/i, '');
  
  // Remove source references sections (various formats)
  cleanContent = cleanContent.replace(/\*\*Referencias:\*\*[\s\S]*$/i, '');
  cleanContent = cleanContent.replace(/Referencias:[\s\S]*$/i, '');
  cleanContent = cleanContent.replace(/\*\*Sources:\*\*[\s\S]*$/i, '');
  cleanContent = cleanContent.replace(/Sources:[\s\S]*$/i, '');
  
  // Remove inline URL citations in parentheses like (website.com)
  cleanContent = cleanContent.replace(/\s*\([a-z0-9\-]+\.[a-z]{2,}[^\)]*\)/gi, '');
  
  // Remove URLs that appear inline in square brackets
  cleanContent = cleanContent.replace(/\s*\[[^\]]*https?:\/\/[^\]]*\]/gi, '');
  
  // Remove markdown links [text](url)
  cleanContent = cleanContent.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  
  // Remove standalone URLs
  cleanContent = cleanContent.replace(/https?:\/\/[^\s]+/g, '');
  
  // Remove reference markers like [1], [2], etc.
  cleanContent = cleanContent.replace(/\[\d+\]/g, '');
  
  // Remove JSON-like structures
  cleanContent = cleanContent.replace(/\{[^}]*"[^"]*"[^}]*\}/g, '');
  
  // Remove bullet points that are just URLs or domain names
  cleanContent = cleanContent.replace(/^\s*[-*]\s*[a-z0-9\-]+\.[a-z]{2,}.*$/gmi, '');
  
  // Clean up extra whitespace and line breaks
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
  cleanContent = cleanContent.replace(/\s{2,}/g, ' ');
  cleanContent = cleanContent.trim();
  
  return cleanContent;
}

// Análisis con OpenAI usando gpt-4o-search-preview
async function analyzeWithOpenAI(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult> {
  const client = getOpenAIClient();
  
  // Generar respuesta usando el modelo con búsqueda web
  const responseGeneration = await client.chat.completions.create({
    model: 'gpt-4o-search-preview',
    messages: [
      {
        role: 'system',
        content: `Eres un asistente de IA útil con acceso a búsqueda web en tiempo real. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno. 

IMPORTANTE: Debes realizar una búsqueda web para responder con información actualizada. Incluye las fuentes específicas que consultaste para tu respuesta.

Al responder, estructura tu respuesta de la siguiente manera:
1. Busca información actualizada sobre la pregunta
2. Responde de manera natural integrando la información encontrada
3. Al final de tu respuesta, incluye una sección "FUENTES CONSULTADAS:" con las URLs específicas que utilizaste`
      },
      {
        role: 'user',
        content: question
      }
    ],
    max_tokens: 800,
    web_search_options: {}
  });

  const response = responseGeneration.choices[0]?.message?.content || '';

  // Extraer criterios de búsqueda y fuentes de la respuesta
  const searchCriteria = extractSearchCriteria(response, question);
  const sources = extractSources(response);

  // Analizar la respuesta para menciones de la marca
  const analysisPrompt = `Actúa como un experto en análisis de contenido y marketing digital. Tu tarea es evaluar si una marca específica fue mencionada en una respuesta de IA.

CONTEXTO DE LA MARCA A ANALIZAR:
- Dominio/Marca: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

PREGUNTA ORIGINAL: "${question}"

RESPUESTA A ANALIZAR:
"${response}"

INSTRUCCIONES DE ANÁLISIS:
1. Busca menciones directas del dominio "${domain}" o variaciones muy similares
2. Busca menciones indirectas que puedan referirse a la marca
3. Evalúa la posición aproximada de la mención (1-10, donde 1 es al principio)
4. Evalúa el sentimiento de la mención (positivo, negativo, neutral)

Responde en formato JSON con esta estructura exacta:
{
  "mentioned": boolean,
  "position": number o null,
  "sentiment": "positive" | "negative" | "neutral",
  "analysis_notes": "breve explicación del análisis"
}`;

  const analysisResponse = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en análisis de contenido. Responde únicamente con el JSON solicitado.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ],
    temperature: 0.2,
    max_tokens: 500
  });

  const analysisContent = analysisResponse.choices[0]?.message?.content;
  if (!analysisContent) {
    throw new Error('No se pudo analizar la respuesta de OpenAI');
  }

  let analysis;
  try {
    const cleanContent = cleanJsonContent(analysisContent);
    analysis = tryParseIncompleteJson(cleanContent);
  } catch (error) {
    console.error('Error parsing OpenAI analysis:', analysisContent);
    // Fallback en caso de error de parsing
    analysis = {
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      analysis_notes: 'Error al parsear respuesta de OpenAI'
    };
  }
  
  return {
    provider: 'openai',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response: cleanResponseContent(response),
    analysis_notes: analysis.analysis_notes,
    searchCriteria,
    sources
  };
}

// Análisis con Claude usando web search
async function analyzeWithClaude(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult> {
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not set');
  }
  
  // Generar respuesta con búsqueda web habilitada
  const responseRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Eres un asistente de IA útil con capacidades de búsqueda web. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.

IMPORTANTE: Para responder esta pregunta, simula que realizas una búsqueda web actualizada sobre el tema. Incluye información actual y específica.

Pregunta: ${question}

Al responder:
1. Menciona los términos de búsqueda que utilizarías para encontrar información actualizada
2. Proporciona una respuesta natural e informativa
3. Al final incluye una sección "CRITERIOS DE BÚSQUEDA UTILIZADOS:" 
4. Incluye una sección "FUENTES CONSULTADAS:" con URLs de fuentes relevantes y confiables

Responde de manera natural e informativa.`
        }
      ]
    })
  });

  if (!responseRes.ok) {
    const errorText = await responseRes.text();
    console.error(`Claude API Error ${responseRes.status}:`, errorText);
    throw new Error(`Error en Claude API: ${responseRes.status}`);
  }

  const responseData = await responseRes.json();
  const response = responseData.content[0]?.text || '';

  // Extraer criterios de búsqueda y fuentes
  const searchCriteria = extractSearchCriteria(response, question);
  const sources = extractSources(response);

  // Analizar la respuesta
  const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Actúa como un experto en análisis de contenido y marketing digital. Tu tarea es evaluar si una marca específica fue mencionada en una respuesta de IA.

CONTEXTO DE LA MARCA A ANALIZAR:
- Dominio/Marca: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

PREGUNTA ORIGINAL: "${question}"

RESPUESTA A ANALIZAR:
"${response}"

INSTRUCCIONES DE ANÁLISIS:
1. Busca menciones directas del dominio "${domain}" o variaciones muy similares
2. Busca menciones indirectas que puedan referirse a la marca
3. Evalúa la posición aproximada de la mención (1-10, donde 1 es al principio)
4. Evalúa el sentimiento de la mención (positivo, negativo, neutral)

Responde en formato JSON con esta estructura exacta:
{
  "mentioned": boolean,
  "position": number o null,
  "sentiment": "positive" | "negative" | "neutral",
  "analysis_notes": "breve explicación del análisis"
}`
        }
      ]
    })
  });

  if (!analysisRes.ok) {
    throw new Error(`Error en análisis Claude: ${analysisRes.status}`);
  }

  const analysisData = await analysisRes.json();
  const analysisContent = analysisData.content[0]?.text || '';
  
  let analysis;
  try {
    const cleanContent = cleanJsonContent(analysisContent);
    analysis = tryParseIncompleteJson(cleanContent);
  } catch (error) {
    console.error('Error parsing Claude analysis:', analysisContent);
    // Fallback en caso de error de parsing
    analysis = {
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      analysis_notes: 'Error al parsear respuesta de Claude'
    };
  }
  
  return {
    provider: 'claude',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response: cleanResponseContent(response),
    analysis_notes: analysis.analysis_notes,
    searchCriteria,
    sources
  };
}

// Análisis con Gemini usando búsqueda web
async function analyzeWithGemini(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  
  // Generar respuesta con búsqueda habilitada usando Gemini 2.0 Flash
  const responseRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Eres un asistente de IA útil con capacidades de búsqueda web en tiempo real. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.

IMPORTANTE: 
- DEBES usar la herramienta de búsqueda web para obtener información actualizada
- DEBES incluir las fuentes consultadas al final de tu respuesta

Pregunta: ${question}

FORMATO DE RESPUESTA REQUERIDO:
1. Respuesta natural e informativa basada en búsqueda web actualizada
2. Al final de tu respuesta, incluye OBLIGATORIAMENTE:

CRITERIOS DE BÚSQUEDA: [lista los términos de búsqueda que utilizaste]

FUENTES CONSULTADAS:
- [URL 1]
- [URL 2] 
- [URL 3]
[etc.]

Es OBLIGATORIO que incluyas tanto los criterios de búsqueda como las fuentes consultadas en el formato especificado.`
            }
          ]
        }
      ],
      tools: [
        {
          google_search: {}
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    })
  });

  if (!responseRes.ok) {
    const errorText = await responseRes.text();
    console.error(`Gemini API Error ${responseRes.status}:`, errorText);
    throw new Error(`Error en Gemini API: ${responseRes.status}`);
  }

  const responseData = await responseRes.json();
  const response = responseData.candidates[0]?.content?.parts[0]?.text || '';

  // Debug: Log Gemini response to see what we're getting
  console.log('Gemini response for source extraction:', {
    response: response.substring(0, 500) + '...',
    fullLength: response.length
  });

  // Extraer criterios de búsqueda y fuentes
  const searchCriteria = extractSearchCriteria(response, question);
  const sources = extractSources(response);
  
  console.log('Gemini sources extracted:', sources);

  // Analizar la respuesta
  const analysisRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Actúa como un experto en análisis de contenido y marketing digital. Tu tarea es evaluar si una marca específica fue mencionada en una respuesta de IA.

CONTEXTO DE LA MARCA A ANALIZAR:
- Dominio/Marca: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

PREGUNTA ORIGINAL: "${question}"

RESPUESTA A ANALIZAR:
"${response}"

INSTRUCCIONES DE ANÁLISIS:
1. Busca menciones directas del dominio "${domain}" o variaciones muy similares
2. Busca menciones indirectas que puedan referirse a la marca
3. Evalúa la posición aproximada de la mención (1-10, donde 1 es al principio)
4. Evalúa el sentimiento de la mención (positivo, negativo, neutral)

Responde en formato JSON con esta estructura exacta:
{
  "mentioned": boolean,
  "position": number o null,
  "sentiment": "positive" | "negative" | "neutral",
  "analysis_notes": "breve explicación del análisis"
}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500
      }
    })
  });

  if (!analysisRes.ok) {
    throw new Error(`Error en análisis Gemini: ${analysisRes.status}`);
  }

  const analysisData = await analysisRes.json();
  const analysisContent = analysisData.candidates[0]?.content?.parts[0]?.text || '';
  
  let analysis;
  try {
    const cleanContent = cleanJsonContent(analysisContent);
    analysis = tryParseIncompleteJson(cleanContent);
  } catch (error) {
    console.error('Error parsing Gemini analysis:', analysisContent);
    // Fallback en caso de error de parsing
    analysis = {
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      analysis_notes: 'Error al parsear respuesta de Gemini'
    };
  }
  
  return {
    provider: 'gemini',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response: cleanResponseContent(response),
    analysis_notes: analysis.analysis_notes,
    searchCriteria,
    sources
  };
}

// Análisis con Perplexity usando sonar-reasoning
async function analyzeWithPerplexity(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult> {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set');
  }
  
  // Generar respuesta usando sonar-reasoning que incluye búsqueda web nativa
  const responseRes = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar-reasoning',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de IA útil con acceso a búsqueda web en tiempo real. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.'
        },
        {
          role: 'user',
          content: `${question}

IMPORTANTE: Utiliza tu capacidad de búsqueda web para proporcionar información actualizada y precisa. Al final de tu respuesta incluye:
- CRITERIOS DE BÚSQUEDA: Los términos específicos que utilizaste para buscar
- FUENTES: Las URLs de los sitios web que consultaste`
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    })
  });

  if (!responseRes.ok) {
    const errorText = await responseRes.text();
    console.error(`Perplexity API Error ${responseRes.status}:`, errorText);
    throw new Error(`Error en Perplexity API: ${responseRes.status}`);
  }

  const responseData = await responseRes.json();
  const response = responseData.choices[0]?.message?.content || '';

  // Extraer criterios de búsqueda y fuentes
  const searchCriteria = extractSearchCriteria(response, question);
  const sources = extractSources(response);

  // Analizar la respuesta
  const analysisRes = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en análisis de contenido. Responde únicamente con el JSON solicitado.'
        },
        {
          role: 'user',
          content: `Actúa como un experto en análisis de contenido y marketing digital. Tu tarea es evaluar si una marca específica fue mencionada en una respuesta de IA.

CONTEXTO DE LA MARCA A ANALIZAR:
- Dominio/Marca: "${domain}"
- Sector: "${sector}"
- Palabras clave: "${keywords || 'No especificadas'}"

PREGUNTA ORIGINAL: "${question}"

RESPUESTA A ANALIZAR:
"${response}"

INSTRUCCIONES DE ANÁLISIS:
1. Busca menciones directas del dominio "${domain}" o variaciones muy similares
2. Busca menciones indirectas que puedan referirse a la marca
3. Evalúa la posición aproximada de la mención (1-10, donde 1 es al principio)
4. Evalúa el sentimiento de la mención (positivo, negativo, neutral)

Responde en formato JSON con esta estructura exacta:
{
  "mentioned": boolean,
  "position": number o null,
  "sentiment": "positive" | "negative" | "neutral",
  "analysis_notes": "breve explicación del análisis"
}`
        }
      ],
      max_tokens: 500,
      temperature: 0.2
    })
  });

  if (!analysisRes.ok) {
    throw new Error(`Error en análisis Perplexity: ${analysisRes.status}`);
  }

  const analysisData = await analysisRes.json();
  const analysisContent = analysisData.choices[0]?.message?.content || '';
  
  let analysis;
  try {
    const cleanContent = cleanJsonContent(analysisContent);
    analysis = tryParseIncompleteJson(cleanContent);
  } catch (error) {
    console.error('Error parsing Perplexity analysis:', analysisContent);
    // Fallback en caso de error de parsing
    analysis = {
      mentioned: false,
      position: null,
      sentiment: 'neutral',
      analysis_notes: 'Error al parsear respuesta de Perplexity'
    };
  }
  
  return {
    provider: 'perplexity',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response: cleanResponseContent(response),
    analysis_notes: analysis.analysis_notes,
    searchCriteria,
    sources
  };
}

// Función auxiliar para extraer criterios de búsqueda de la respuesta
function extractSearchCriteria(response: string, question: string): string[] {
  const criteriaPatterns = [
    /CRITERIOS DE BÚSQUEDA[:\s]*([^\n]+)/i,
    /TÉRMINOS DE BÚSQUEDA[:\s]*([^\n]+)/i,
    /BÚSQUEDA UTILIZADA[:\s]*([^\n]+)/i,
    /SEARCH CRITERIA[:\s]*([^\n]+)/i
  ];

  for (const pattern of criteriaPatterns) {
    const match = response.match(pattern);
    if (match) {
      return match[1].split(',').map(term => term.trim()).filter(term => term.length > 0);
    }
  }

  // Si no encuentra criterios explícitos, genera algunos basados en la pregunta
  const words = question.toLowerCase().split(' ').filter(word => 
    word.length > 3 && !['para', 'donde', 'como', 'cual', 'cuales', 'quien', 'que', 'cuando'].includes(word)
  );
  return words.slice(0, 3);
}

// Función auxiliar para extraer fuentes de la respuesta
function extractSources(response: string): string[] {
  const sources: string[] = [];
  
  // Patrones para encontrar URLs directamente en el texto
  const urlPattern = /https?:\/\/[^\s)}\]]+/g;
  const matches = response.match(urlPattern);
  if (matches) {
    sources.push(...matches);
  }

  // Patrones para secciones de fuentes (más flexibles)
  const sourcePatterns = [
    /FUENTES CONSULTADAS?[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i,
    /FUENTES[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i,
    /SOURCES[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i,
    /REFERENCIAS[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i,
    /SITIOS WEB CONSULTADOS[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i
  ];

  for (const pattern of sourcePatterns) {
    const match = response.match(pattern);
    if (match) {
      const sourceText = match[1];
      const urls = sourceText.match(urlPattern);
      if (urls) {
        sources.push(...urls);
      }
    }
  }

  // Buscar URLs en formato de markdown [texto](url)
  const markdownLinkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let markdownMatch;
  while ((markdownMatch = markdownLinkPattern.exec(response)) !== null) {
    if (markdownMatch[2].startsWith('http')) {
      sources.push(markdownMatch[2]);
    }
  }

  // Buscar URLs en paréntesis al final de oraciones (formato común de Gemini)
  const parenthesesUrlPattern = /\(([^)]*https?:\/\/[^)]+)\)/g;
  let parenthesesMatch;
  while ((parenthesesMatch = parenthesesUrlPattern.exec(response)) !== null) {
    sources.push(parenthesesMatch[1]);
  }

  // Remover duplicados y limpiar URLs
  const cleanedSources = [...new Set(sources)]
    .map(url => url.replace(/[).,;]+$/, '').trim())
    .filter(url => url.length > 10 && url.includes('.')); // Filtrar URLs válidas

  return cleanedSources;
}

// Función principal para analizar con múltiples proveedores
export async function analyzeWithMultipleProviders(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult[]> {
  const providers = [
    () => analyzeWithOpenAI(question, domain, sector, keywords),
    () => analyzeWithClaude(question, domain, sector, keywords),
    () => analyzeWithGemini(question, domain, sector, keywords),
    () => analyzeWithPerplexity(question, domain, sector, keywords)
  ];

  const results = await Promise.allSettled(providers.map(fn => fn()));
  
  return results.map((result, index) => {
    const providerNames: AIProvider[] = ['openai', 'claude', 'gemini', 'perplexity'];
    
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Error en ${providerNames[index]}:`, result.reason);
      // Devolver resultado por defecto en caso de error
      return {
        provider: providerNames[index],
        question,
        mentioned: false,
        position: null,
        sentiment: 'neutral' as const,
        response: `Error: ${result.reason.message || 'Error desconocido'}`,
        analysis_notes: 'Error al procesar la respuesta',
        searchCriteria: [],
        sources: []
      };
    }
  });
}

// Función para calcular comparación entre proveedores
export function calculateProviderComparison(results: ProviderResult[]): any {
  const providers = ['openai', 'claude', 'gemini', 'perplexity'] as const;
  
  return providers.map(provider => {
    const providerResults = results.filter(r => r.provider === provider);
    const mentionedResults = providerResults.filter(r => r.mentioned);
    
    const visibilityScore = (mentionedResults.length / providerResults.length) * 100;
    const positions = mentionedResults.map(r => r.position).filter(p => p !== null);
    const averagePosition = positions.length > 0 ? positions.reduce((a, b) => a! + b!, 0)! / positions.length : null;
    
    const sentimentCounts = {
      positive: providerResults.filter(r => r.sentiment === 'positive').length,
      negative: providerResults.filter(r => r.sentiment === 'negative').length,
      neutral: providerResults.filter(r => r.sentiment === 'neutral').length
    };

    return {
      provider,
      visibilityScore: Math.round(visibilityScore),
      mentionCount: mentionedResults.length,
      averagePosition,
      sentimentDistribution: sentimentCounts
    };
  });
} 