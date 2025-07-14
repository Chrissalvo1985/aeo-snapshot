import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { AEOAnalysis } from '@/lib/types';

// Configuración de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  analysis: AEOAnalysis;
  conversationHistory: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const { message, analysis, conversationHistory }: ChatRequest = await request.json();

    if (!message || !analysis) {
      return NextResponse.json({ error: 'Mensaje y análisis son requeridos' }, { status: 400 });
    }

    // Preparar el contexto del análisis
    const analysisContext = `
ANÁLISIS AEO ACTUAL:
- Dominio: ${analysis.domain}
- Sector: ${analysis.sector}
- Palabras clave: ${analysis.keywords || 'No especificadas'}
- Puntuación de visibilidad: ${analysis.visibilityScore}%
- Fecha de análisis: ${new Date(analysis.createdAt).toLocaleDateString()}

PREGUNTAS EVALUADAS (${analysis.questions.length} total):
${analysis.questions.map(q => `
- "${q.question}"
  * Mencionado: ${q.mentioned ? 'SÍ' : 'NO'}
  * Posición: ${q.position ? `#${q.position}` : 'No encontrado'}
  * Sentimiento: ${q.sentiment}
  * Respuesta: ${q.response}
`).join('\n')}

SUGERENCIAS DE OPTIMIZACIÓN:
${analysis.suggestions.map(s => `
- [${s.priority}] ${s.title}
  Categoría: ${s.category}
  Descripción: ${s.description}
  ${s.impact ? `Impacto: ${s.impact}` : ''}
`).join('\n')}

${analysis.competitiveAnalysis ? `
ANÁLISIS COMPETITIVO:
- Competidores totales: ${analysis.competitiveAnalysis.totalCompetitors}
- Principales competidores: ${analysis.competitiveAnalysis.topCompetitors.map(c => `${c.name} (${c.count} menciones, ${c.marketShare}% market share)`).join(', ')}
- Fortaleza competitiva: ${analysis.competitiveAnalysis.competitiveStrength}
- Oportunidades de mercado: ${analysis.competitiveAnalysis.marketGaps.join(', ')}
- Recomendaciones: ${analysis.competitiveAnalysis.recommendations.join(', ')}
` : ''}
`;

    // Preparar el historial de conversación
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Prompt del sistema para el bot
    const systemPrompt = `Eres un asistente experto en AEO (Answer Engine Optimization) especializado en analizar la visibilidad de marcas en motores de respuesta de IA como ChatGPT, Claude, Gemini, etc.

Tu función es ayudar a interpretar y extraer insights profundos de los análisis AEO, proporcionando:
- Análisis detallado de resultados
- Identificación de patrones y tendencias
- Sugerencias estratégicas personalizadas
- Comparaciones competitivas
- Recomendaciones de optimización

CONTEXTO DEL ANÁLISIS:
${analysisContext}

INSTRUCCIONES:
1. Responde de manera conversacional y profesional
2. Basa tus respuestas únicamente en los datos del análisis proporcionado
3. Proporciona insights accionables y específicos
4. Usa ejemplos concretos del análisis cuando sea posible
5. Mantén un tono experto pero accesible
6. Si no tienes información específica sobre algo, dilo claramente
7. Sugiere preguntas de seguimiento relevantes cuando sea apropiado

FORMATO DE RESPUESTA:
- Usa listas con • para puntos importantes
- Usa **texto** para enfatizar términos clave
- Estructura las respuestas en párrafos claros
- Mantén las respuestas concisas pero informativas
- Evita texto plano sin formato

Responde en español y mantén la conversación enfocada en insights de AEO.`;

    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Usando el modelo especificado en la memoria
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({ error: 'No se pudo generar una respuesta' }, { status: 500 });
    }

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Error en chat API:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'Error de configuración de OpenAI' }, { status: 500 });
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ error: 'Límite de velocidad excedido. Intenta de nuevo en unos momentos.' }, { status: 429 });
      }
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 