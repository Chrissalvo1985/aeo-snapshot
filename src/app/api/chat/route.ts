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
  analyses: AEOAnalysis[];
  conversationHistory: Message[];
}

// Función para validar si la pregunta está relacionada con AEO/análisis
async function validateQueryIntent(message: string): Promise<boolean> {
  try {
    const validation = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Determina si una pregunta puede estar relacionada con análisis de datos, negocios, web, marketing o consultoría.

Responde SOLO "SI" o "NO":

SI para preguntas sobre:
- Análisis, datos, métricas, estadísticas
- Negocios, empresas, competencia, mercado
- Web, sitios, dominios, SEO, marketing
- Rendimiento, visibilidad, posicionamiento
- Comparaciones, tendencias, insights
- Preguntas generales que podrían aplicar a análisis de negocio
- Consultas sobre "cómo", "por qué", "cuál", "qué" en contexto empresarial

NO solo para preguntas claramente no relacionadas:
- Recetas de cocina, entretenimiento personal
- Temas muy personales o familiares
- Ciencia ficción, literatura, arte (sin contexto empresarial)
- Deportes, música, viajes (sin contexto de negocio)

En caso de duda, responde SI.`
        },
        {
          role: 'user',
          content: `Pregunta: "${message}"`
        }
      ],
      max_tokens: 5,
      temperature: 0
    });

    const response = validation.choices[0]?.message?.content?.trim().toUpperCase();
    return response === 'SI';
  } catch (error) {
    console.error('Error validating intent:', error);
    return true; // En caso de error, permitir por defecto
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, analyses, conversationHistory }: ChatRequest = await request.json();

    if (!message || !analyses || analyses.length === 0) {
      return NextResponse.json({ error: 'Mensaje y análisis son requeridos' }, { status: 400 });
    }

    // Validar la intención de la pregunta
    const isRelevant = await validateQueryIntent(message);
    
    if (!isRelevant) {
      return NextResponse.json({ 
        response: "Lo siento, solo puedo ayudarte con preguntas relacionadas con tus análisis AEO, SEO, competencia, rendimiento web y temas de marketing digital. ¿Tienes alguna pregunta sobre tus análisis?" 
      });
    }

    // Preparar el contexto según el número de análisis
    let analysisContext = '';

    if (analyses.length === 1) {
      const analysis = analyses[0];
      
      analysisContext = `
ANÁLISIS AEO COMPLETO DISPONIBLE:
================================

INFORMACIÓN BÁSICA:
- Dominio: ${analysis.domain}
- Sector: ${analysis.sector}
- Palabras clave: ${analysis.keywords || 'No especificadas'}
- Puntuación de visibilidad global: ${analysis.visibilityScore}%
- Total de preguntas evaluadas: ${analysis.questions.length}
- Menciones obtenidas: ${analysis.questions.filter(q => q.mentioned).length}
- Preguntas en top 3: ${analysis.questions.filter(q => q.position && q.position <= 3).length}
- Fecha creación: ${new Date(analysis.createdAt).toLocaleDateString()}
- Última actualización: ${new Date(analysis.updatedAt).toLocaleDateString()}

${analysis.multiProviderResults && analysis.multiProviderResults.length > 0 ? `
RESULTADOS POR PROVEEDOR DE IA:
${analysis.multiProviderResults.map(mpq => `
PREGUNTA: "${mpq.question}"
${mpq.results.map(result => `
  → ${result.provider.toUpperCase()}:
    • Mencionado: ${result.mentioned ? 'SÍ' : 'NO'}
    • Posición: ${result.position ? `#${result.position}` : 'No encontrado'}
    • Sentimiento: ${result.sentiment}
    • Respuesta completa: "${result.response}"
    ${result.sources && result.sources.length > 0 ? `• Fuentes consultadas: ${result.sources.join(', ')}` : ''}
    ${result.searchCriteria && result.searchCriteria.length > 0 ? `• Criterios búsqueda: ${result.searchCriteria.join(', ')}` : ''}
    ${result.analysis_notes ? `• Notas adicionales: ${result.analysis_notes}` : ''}
`).join('')}
`).join('\n')}

COMPARACIÓN ENTRE PROVEEDORES:
${analysis.providerComparison?.map(pc => `
• ${pc.provider.toUpperCase()}:
  - Visibilidad específica: ${pc.visibilityScore}%
  - Total menciones: ${pc.mentionCount}
  - Posición promedio: ${pc.averagePosition ? pc.averagePosition.toFixed(1) : 'N/A'}
  - Distribución sentimientos: ${pc.sentimentDistribution.positive}% positivo, ${pc.sentimentDistribution.negative}% negativo, ${pc.sentimentDistribution.neutral}% neutral
`).join('')}
` : ''}

PREGUNTAS EVALUADAS (DETALLE COMPLETO):
${analysis.questions.map((q, index) => `
${index + 1}. "${q.question}"
   • Mencionado: ${q.mentioned ? 'SÍ' : 'NO'}
   • Posición obtenida: ${q.position ? `#${q.position}` : 'No encontrado'}
   • Sentimiento detectado: ${q.sentiment}
   • Respuesta completa: "${q.response}"
   ${q.sources && q.sources.length > 0 ? `• Fuentes: ${q.sources.join(', ')}` : ''}
   ${q.searchCriteria && q.searchCriteria.length > 0 ? `• Criterios: ${q.searchCriteria.join(', ')}` : ''}
`).join('\n')}

ANÁLISIS DE SENTIMIENTOS DETALLADO:
- Respuestas positivas: ${analysis.questions.filter(q => q.sentiment === 'positive').length} (${Math.round(analysis.questions.filter(q => q.sentiment === 'positive').length / analysis.questions.length * 100)}%)
- Respuestas negativas: ${analysis.questions.filter(q => q.sentiment === 'negative').length} (${Math.round(analysis.questions.filter(q => q.sentiment === 'negative').length / analysis.questions.length * 100)}%)
- Respuestas neutrales: ${analysis.questions.filter(q => q.sentiment === 'neutral').length} (${Math.round(analysis.questions.filter(q => q.sentiment === 'neutral').length / analysis.questions.length * 100)}%)

${analysis.competitiveAnalysis ? `
ANÁLISIS COMPETITIVO COMPLETO:
- Total competidores identificados: ${analysis.competitiveAnalysis.totalCompetitors}
- Fortaleza competitiva del dominio: ${analysis.competitiveAnalysis.competitiveStrength}

COMPETIDORES PRINCIPALES (DETALLADO):
${analysis.competitiveAnalysis.topCompetitors.map(comp => `
• ${comp.name}:
  - Menciones totales: ${comp.count}
  - Posiciones ocupadas: ${comp.positions.join(', ')}
  - Market share: ${comp.marketShare}%
  - Sentimiento general: ${comp.sentiment}
  - Consenso entre proveedores: ${comp.providerConsensus || 'N/A'}
  - Preguntas donde aparece: ${comp.questions.join(' | ')}
`).join('')}

BRECHAS DE MERCADO IDENTIFICADAS:
${analysis.competitiveAnalysis.marketGaps.map(gap => `• ${gap}`).join('\n')}

RECOMENDACIONES ESTRATÉGICAS:
${analysis.competitiveAnalysis.recommendations.map(rec => `• ${rec}`).join('\n')}
` : 'No hay análisis competitivo disponible'}

SUGERENCIAS DE OPTIMIZACIÓN:
${analysis.suggestions.map(s => `
• [${s.priority}] ${s.title} (Categoría: ${s.category})
  ${s.description}
  ${s.impact ? `Impacto esperado: ${s.impact}` : ''}
`).join('\n')}

${analysis.customQuestionsUsed ? `
INFORMACIÓN ADICIONAL:
- Preguntas personalizadas utilizadas: SÍ
- Cantidad de preguntas personalizadas: ${analysis.customQuestionsCount || 'No especificado'}
` : 'Se utilizaron preguntas estándar del sistema'}`;

    } else {
      // Múltiples análisis - contexto comparativo expandido
      const totalQuestions = analyses.reduce((sum, a) => sum + a.questions.length, 0);
      const avgVisibility = Math.round(analyses.reduce((sum, a) => sum + a.visibilityScore, 0) / analyses.length);
      const sectors = [...new Set(analyses.map(a => a.sector))];
      const bestPerformer = analyses.reduce((best, current) => 
        current.visibilityScore > best.visibilityScore ? current : best
      );
      const worstPerformer = analyses.reduce((worst, current) => 
        current.visibilityScore < worst.visibilityScore ? current : worst
      );

      // Análisis agregado de competidores
      const allCompetitors = analyses
        .filter(a => a.competitiveAnalysis?.topCompetitors)
        .flatMap(a => a.competitiveAnalysis!.topCompetitors);
      
      const competitorStats = allCompetitors.reduce((acc, comp) => {
        if (!acc[comp.name]) {
          acc[comp.name] = { count: 0, totalMarketShare: 0, appearances: 0, sentiments: [] };
        }
        acc[comp.name].count += comp.count;
        acc[comp.name].totalMarketShare += comp.marketShare;
        acc[comp.name].appearances += 1;
        acc[comp.name].sentiments.push(comp.sentiment);
        return acc;
      }, {} as Record<string, any>);

      // Análisis de proveedores agregado
      const providerStats = analyses
        .filter(a => a.providerComparison)
        .flatMap(a => a.providerComparison!)
        .reduce((acc, pc) => {
          if (!acc[pc.provider]) {
            acc[pc.provider] = { totalVis: 0, totalMentions: 0, count: 0, sentiments: { pos: 0, neg: 0, neu: 0 } };
          }
          acc[pc.provider].totalVis += pc.visibilityScore;
          acc[pc.provider].totalMentions += pc.mentionCount;
          acc[pc.provider].count += 1;
          acc[pc.provider].sentiments.pos += pc.sentimentDistribution.positive;
          acc[pc.provider].sentiments.neg += pc.sentimentDistribution.negative;
          acc[pc.provider].sentiments.neu += pc.sentimentDistribution.neutral;
          return acc;
        }, {} as Record<string, any>);

      analysisContext = `
ANÁLISIS COMPARATIVO COMPLETO (${analyses.length} dominios):
=========================================================

RESUMEN ESTADÍSTICO GLOBAL:
- Total preguntas evaluadas: ${totalQuestions}
- Visibilidad promedio: ${avgVisibility}%
- Sectores analizados: ${sectors.join(', ')}
- Mejor performer: ${bestPerformer.domain} (${bestPerformer.visibilityScore}%)
- Peor performer: ${worstPerformer.domain} (${worstPerformer.visibilityScore}%)
- Rango de visibilidad: ${worstPerformer.visibilityScore}% - ${bestPerformer.visibilityScore}%

DATOS DETALLADOS POR DOMINIO:
${analyses.map((analysis, index) => `
${index + 1}. ${analysis.domain} (${analysis.sector})
   • Visibilidad: ${analysis.visibilityScore}%
   • Preguntas totales: ${analysis.questions.length}
   • Menciones logradas: ${analysis.questions.filter(q => q.mentioned).length}
   • Posiciones top 3: ${analysis.questions.filter(q => q.position && q.position <= 3).length}
   • Sentimientos: ${analysis.questions.filter(q => q.sentiment === 'positive').length}+ / ${analysis.questions.filter(q => q.sentiment === 'negative').length}- / ${analysis.questions.filter(q => q.sentiment === 'neutral').length}°
   • Competidores identificados: ${analysis.competitiveAnalysis?.totalCompetitors || 'N/A'}
   • Fortaleza competitiva: ${analysis.competitiveAnalysis?.competitiveStrength || 'N/A'}
   • Proveedores IA analizados: ${analysis.providerComparison?.length || analysis.multiProviderResults?.length || 'N/A'}
   • Usa preguntas personalizadas: ${analysis.customQuestionsUsed ? 'SÍ' : 'NO'}
   • Fecha análisis: ${new Date(analysis.createdAt).toLocaleDateString()}
`).join('\n')}

${Object.keys(providerStats).length > 0 ? `
COMPARACIÓN ENTRE PROVEEDORES IA:
${Object.entries(providerStats).map(([provider, stats]) => `
• ${provider.toUpperCase()}:
  - Visibilidad promedio: ${Math.round(stats.totalVis / stats.count)}%
  - Menciones promedio por dominio: ${Math.round(stats.totalMentions / stats.count)}
  - Dominios donde se evaluó: ${stats.count}
  - Sentimiento promedio: ${Math.round(stats.sentiments.pos / stats.count)}% positivo, ${Math.round(stats.sentiments.neg / stats.count)}% negativo, ${Math.round(stats.sentiments.neu / stats.count)}% neutral
`).join('')}
` : ''}

DISTRIBUCIÓN POR SECTORES:
${sectors.map(sector => {
  const sectorAnalyses = analyses.filter(a => a.sector === sector);
  const sectorAvg = Math.round(sectorAnalyses.reduce((sum, a) => sum + a.visibilityScore, 0) / sectorAnalyses.length);
  const sectorQuestions = sectorAnalyses.reduce((sum, a) => sum + a.questions.length, 0);
  const sectorMentions = sectorAnalyses.reduce((sum, a) => sum + a.questions.filter(q => q.mentioned).length, 0);
  return `• ${sector}: ${sectorAnalyses.length} dominio(s), ${sectorAvg}% visibilidad promedio, ${sectorQuestions} preguntas totales, ${sectorMentions} menciones`;
}).join('\n')}

${Object.keys(competitorStats).length > 0 ? `
ANÁLISIS COMPETITIVO AGREGADO:
TOP COMPETIDORES ENTRE TODOS LOS DOMINIOS:
${Object.entries(competitorStats)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 15)
  .map(([name, stats]) => `
• ${name}:
  - Menciones totales: ${stats.count}
  - Market share promedio: ${Math.round(stats.totalMarketShare / stats.appearances)}%
  - Aparece en: ${stats.appearances} análisis diferentes
  - Sentimientos: ${stats.sentiments.join(', ')}
`).join('')}
` : ''}

PATRONES Y OPORTUNIDADES:
• Dominios con excelente visibilidad (>70%): ${analyses.filter(a => a.visibilityScore > 70).length}
• Dominios con visibilidad media (40-70%): ${analyses.filter(a => a.visibilityScore >= 40 && a.visibilityScore <= 70).length}
• Dominios que requieren mejora (<40%): ${analyses.filter(a => a.visibilityScore < 40).length}
• Diferencia competitiva máxima: ${bestPerformer.visibilityScore - worstPerformer.visibilityScore} puntos porcentuales
• Sector con mejor rendimiento promedio: ${sectors.map(s => {
  const sectorAvg = Math.round(analyses.filter(a => a.sector === s).reduce((sum, a) => sum + a.visibilityScore, 0) / analyses.filter(a => a.sector === s).length);
  return { sector: s, avg: sectorAvg };
}).sort((a, b) => b.avg - a.avg)[0]?.sector} (${sectors.map(s => {
  const sectorAvg = Math.round(analyses.filter(a => a.sector === s).reduce((sum, a) => sum + a.visibilityScore, 0) / analyses.filter(a => a.sector === s).length);
  return sectorAvg;
}).sort((a, b) => b - a)[0]}%)

BRECHAS Y OPORTUNIDADES COMUNES:
${[...new Set(analyses
  .filter(a => a.competitiveAnalysis?.marketGaps)
  .flatMap(a => a.competitiveAnalysis!.marketGaps)
)].slice(0, 10).map(gap => `• ${gap}`).join('\n')}

RECOMENDACIONES ESTRATÉGICAS RECURRENTES:
${[...new Set(analyses
  .filter(a => a.competitiveAnalysis?.recommendations)
  .flatMap(a => a.competitiveAnalysis!.recommendations)
)].slice(0, 10).map(rec => `• ${rec}`).join('\n')}`;
    }

    // Preparar el historial de conversación
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // System prompt con énfasis en usar TODOS los datos
    const systemPrompt = `Eres un asistente especializado en análisis AEO que conversa de forma natural y relajada.

INSTRUCCIONES DE CONVERSACIÓN:
- Responde como si fueras un colega experto charlando de forma casual
- Usa párrafos naturales, evita listas y estructuras pesadas
- Sé conversacional, directo y amigable
- Cita datos específicos de forma natural en la conversación
- No uses títulos, subtítulos ni formateo excesivo
- Responde como si estuvieras explicando a un amigo

TIENES ACCESO A TODOS ESTOS DATOS:
${analysisContext}

Conversa naturalmente usando esta información cuando sea relevante.`;

    // Llamada a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationMessages,
        { role: 'user', content: message },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No se recibió respuesta del modelo');
    }

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Error en chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 