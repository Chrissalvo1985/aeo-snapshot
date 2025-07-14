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

// Análisis con OpenAI
async function analyzeWithOpenAI(
  question: string,
  domain: string,
  sector: string,
  keywords?: string
): Promise<ProviderResult> {
  const client = getOpenAIClient();
  
  // Generar respuesta natural
  const responseGeneration = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un asistente de IA útil. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.'
      },
      {
        role: 'user',
        content: question
      }
    ],
    temperature: 0.7,
    max_tokens: 600
  });

  const response = responseGeneration.choices[0]?.message?.content || '';

  // Analizar la respuesta
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

  const analysis = JSON.parse(cleanJsonContent(analysisContent));
  
  return {
    provider: 'openai',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response,
    analysis_notes: analysis.analysis_notes
  };
}

// Análisis con Claude
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
  
  // Generar respuesta natural
  const responseRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Eres un asistente de IA útil. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.

Pregunta: ${question}`
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
  const analysis = JSON.parse(cleanJsonContent(analysisContent));
  
  return {
    provider: 'claude',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response,
    analysis_notes: analysis.analysis_notes
  };
}

// Análisis con Gemini
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
  
  // Generar respuesta natural
  const responseRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Eres un asistente de IA útil. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.

Pregunta: ${question}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 600
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
  const analysis = JSON.parse(cleanJsonContent(analysisContent));
  
  return {
    provider: 'gemini',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response,
    analysis_notes: analysis.analysis_notes
  };
}

// Análisis con Perplexity
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
  
  // Generar respuesta natural
  const responseRes = await fetch('https://api.perplexity.ai/chat/completions', {
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
          content: 'Eres un asistente de IA útil. Responde considerando que el usuario está en Chile y busca información relevante para el mercado chileno.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 600,
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
  const analysis = JSON.parse(cleanJsonContent(analysisContent));
  
  return {
    provider: 'perplexity',
    question,
    mentioned: analysis.mentioned,
    position: analysis.mentioned ? analysis.position : null,
    sentiment: analysis.sentiment,
    response,
    analysis_notes: analysis.analysis_notes
  };
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
        analysis_notes: 'Error al procesar la respuesta'
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