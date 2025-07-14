import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions, analyzeQuestionResponse, generateSuggestions, analyzeCompetition } from '@/lib/openai';
import { analyzeWithMultipleProviders, calculateProviderComparison } from '@/lib/ai-providers';
import { sql, initializeDatabase, saveAnalysisToLocalStorage, getAnalysesFromLocalStorage } from '@/lib/database';
import { AEOAnalysis, AEOQuestion, OpenAIResponse, MultiProviderQuestion, ProviderResult } from '@/lib/types';
import { calculateVisibilityScore, sleep } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Validar que el cuerpo de la solicitud existe
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { domain, sector, keywords, brand, customQuestions } = body;

    // Usar brand como fallback para domain si no está presente
    const domainToUse = domain || brand;

    if (!domainToUse || !sector) {
      return NextResponse.json(
        { 
          error: 'Domain/brand and sector are required',
          received: { domain: domainToUse, sector, keywords, customQuestions: customQuestions ? customQuestions.length : 0 }
        },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Verificar si tenemos las claves para múltiples proveedores
    const hasMultipleProviders = 
      process.env.CLAUDE_API_KEY && 
      process.env.GEMINI_API_KEY && 
      process.env.PERPLEXITY_API_KEY;

    console.log('Multiple providers available:', hasMultipleProviders);

    // Inicializar base de datos
    await initializeDatabase();

    // Paso 1: Generar preguntas (usar personalizadas si están disponibles)
    const questionType = customQuestions && customQuestions.length > 0 ? 'personalizadas' : 'automáticas';
    console.log(`Paso 1: Generando preguntas ${questionType} para ${domainToUse} en sector ${sector}`);
    const questions = await generateQuestions(domainToUse, sector, keywords, customQuestions);
    console.log(`Preguntas generadas: ${questions.length} (${questionType})`);
    
    // Pequeña pausa para simular procesamiento
    await sleep(1000);

    // Paso 2: Analizar cada pregunta con múltiples proveedores
    console.log('Paso 2: Analizando respuestas con múltiples proveedores...');
    const multiProviderResults: MultiProviderQuestion[] = [];
    const allProviderResults: ProviderResult[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      console.log(`Analizando pregunta ${i + 1}/${questions.length}: ${questions[i]}`);
      try {
        const providerResults = await analyzeWithMultipleProviders(questions[i], domainToUse, sector, keywords);
        
        // Filtrar solo los resultados exitosos
        const successfulResults = providerResults.filter(result => 
          !result.response.startsWith('Error:')
        );
        
        multiProviderResults.push({
          id: `q-${i}`,
          question: questions[i],
          results: providerResults // Incluir todos los resultados, incluso los que fallaron
        });
        
        allProviderResults.push(...providerResults);
        console.log(`✓ Pregunta ${i + 1} completada con ${providerResults.length} proveedores (${successfulResults.length} exitosos)`);
      } catch (error) {
        console.error(`✗ Error en pregunta ${i + 1}:`, error);
        // En lugar de fallar completamente, crear un resultado de error
        const errorResult: MultiProviderQuestion = {
          id: `q-${i}`,
          question: questions[i],
          results: [
            {
              provider: 'openai',
              question: questions[i],
              mentioned: false,
              position: null,
              sentiment: 'neutral',
              response: 'Error al procesar la pregunta',
              analysis_notes: 'Error en el análisis'
            }
          ]
        };
        multiProviderResults.push(errorResult);
        allProviderResults.push(...errorResult.results);
      }
      
      // Pausa entre llamadas para evitar rate limiting
      await sleep(1000);
    }

    // Crear resultados compatibles con el formato anterior (usando OpenAI como base)
    const results: OpenAIResponse[] = multiProviderResults.map(mpq => {
      const openaiResult = mpq.results.find(r => r.provider === 'openai');
      return openaiResult ? {
        question: mpq.question,
        mentioned: openaiResult.mentioned,
        position: openaiResult.position,
        sentiment: openaiResult.sentiment,
        response: openaiResult.response,
        analysis_notes: openaiResult.analysis_notes
      } : {
        question: mpq.question,
        mentioned: false,
        position: null,
        sentiment: 'neutral' as const,
        response: 'Error al procesar con OpenAI',
        analysis_notes: 'Error'
      };
    });

    // Validar que tenemos resultados
    if (results.length === 0) {
      throw new Error('No se pudieron analizar las preguntas');
    }

    // Paso 3: Generar sugerencias
    console.log('Paso 3: Generando sugerencias...');
    const suggestions = await generateSuggestions(results, domainToUse, sector, keywords);
    console.log(`Sugerencias generadas: ${suggestions.length}`);

    // Paso 4: Analizar competencia
    console.log('Paso 4: Analizando competencia...');
    const competitiveAnalysis = await analyzeCompetition(results, domainToUse, sector, keywords, multiProviderResults);
    console.log(`Competidores identificados: ${competitiveAnalysis.totalCompetitors}`);

    // Convertir resultados al formato AEOQuestion
    const aeoQuestions: AEOQuestion[] = results.map((result, index) => ({
      id: `q-${index}`,
      question: result.question,
      mentioned: result.mentioned,
      position: result.position,
      sentiment: result.sentiment,
      response: result.response
    }));

    // Calcular score de visibilidad
    const visibilityScore = calculateVisibilityScore(aeoQuestions);
    console.log(`Score de visibilidad calculado: ${visibilityScore}`);

    // Calcular comparación entre proveedores
    const providerComparison = calculateProviderComparison(allProviderResults);
    console.log(`Comparación de proveedores calculada`);

    // Crear análisis completo
    const analysis: AEOAnalysis = {
      domain: domainToUse,
      sector,
      keywords,
      questions: aeoQuestions,
      results: aeoQuestions,
      visibilityScore,
      suggestions,
      competitiveAnalysis,
      customQuestionsUsed: customQuestions && customQuestions.length > 0,
      customQuestionsCount: customQuestions ? customQuestions.length : 0,
      multiProviderResults,
      providerComparison,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Intentar guardar en base de datos, si falla usar localStorage
    const client = sql();
    if (client) {
      try {
        const customQuestionsUsed = customQuestions && customQuestions.length > 0;
        const customQuestionsCount = customQuestionsUsed ? customQuestions.length : 0;
        
        await client`
          INSERT INTO aeo_analyses (
            domain, sector, keywords, questions, results, visibility_score, suggestions,
            competitive_analysis, custom_questions_used, custom_questions_count
          ) VALUES (
            ${domainToUse},
            ${sector},
            ${keywords || null},
            ${JSON.stringify(aeoQuestions)},
            ${JSON.stringify(aeoQuestions)},
            ${visibilityScore},
            ${JSON.stringify(suggestions)},
            ${JSON.stringify(competitiveAnalysis)},
            ${customQuestionsUsed},
            ${customQuestionsCount}
          )
        `;
        console.log(`Analysis saved to database (custom questions: ${customQuestionsUsed ? 'yes' : 'no'})`);
      } catch (dbError) {
        console.error('Database error, using localStorage:', dbError);
        // Fallback a localStorage se maneja en el cliente
      }
    } else {
      console.log('No database configured, client will use localStorage');
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze AEO visibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const limit = parseInt(searchParams.get('limit') || '10');

    await initializeDatabase();
    const client = sql();

    if (client) {
      // Usar base de datos si está disponible
      let query;
      if (domain) {
        query = client`
          SELECT * FROM aeo_analyses 
          WHERE domain = ${domain}
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
      } else {
        query = client`
          SELECT * FROM aeo_analyses 
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
      }

      const analyses = await query;
      return NextResponse.json({ analyses });
    } else {
      // Usar localStorage como fallback
      // Nota: En el servidor no podemos acceder a localStorage
      // El cliente deberá manejar esto directamente
      return NextResponse.json({ 
        analyses: [],
        message: 'Database not configured - use localStorage on client side'
      });
    }

  } catch (error) {
    console.error('Fetch error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analyses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 