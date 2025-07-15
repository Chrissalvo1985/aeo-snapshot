'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Users,
  Target,
  Eye,
  Sparkles,
  ArrowRight,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AEOAnalysis, CompetitorMention, AIProvider, MultiProviderQuestion } from '@/lib/types';
import ProviderComparison from './ProviderComparison';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AEODashboardProps {
  analysis: AEOAnalysis;
  onNewAnalysis: () => void;
}

export default function AEODashboard({ analysis, onNewAnalysis }: AEODashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'suggestions' | 'competition' | 'providers'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(6);

  const toggleQuestionExpansion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Excelente';
    if (score >= 40) return 'Buena';
    return 'Necesita mejora';
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Baja': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Contenido': return <Lightbulb className="h-4 w-4" />;
      case 'Técnico': return <Zap className="h-4 w-4" />;
      case 'Estrategia': return <Target className="h-4 w-4" />;
      case 'Optimización': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Funciones para obtener preguntas según el proveedor seleccionado
  const getQuestionsForProvider = (provider: AIProvider) => {
    if (!analysis.multiProviderResults) return analysis.questions;
    
    return analysis.multiProviderResults.map(mpq => {
      const providerResult = mpq.results.find(r => r.provider === provider);
      return {
        id: mpq.id,
        question: mpq.question,
        mentioned: providerResult?.mentioned || false,
        position: providerResult?.position || null,
        sentiment: providerResult?.sentiment || 'neutral',
        response: providerResult?.response || 'No disponible'
      };
    });
  };

  const questionsForProvider = getQuestionsForProvider(selectedProvider);
  const mentionedQuestions = questionsForProvider.filter(q => q.mentioned);
  const notMentionedQuestions = questionsForProvider.filter(q => !q.mentioned);

  // Datos base para el overview (independientes del proveedor seleccionado)
  // Si hay multiProviderResults, contar todas las respuestas de todos los proveedores
  const getTotalResponses = () => {
    if (analysis.multiProviderResults) {
      return analysis.multiProviderResults.reduce((total, mpq) => total + mpq.results.length, 0);
    }
    return analysis.questions.length;
  };

  const getTotalMentioned = () => {
    if (analysis.multiProviderResults) {
      return analysis.multiProviderResults.reduce((total, mpq) => 
        total + mpq.results.filter(r => r.mentioned).length, 0);
    }
    return analysis.questions.filter(q => q.mentioned).length;
  };

  const getTotalNotMentioned = () => {
    if (analysis.multiProviderResults) {
      return analysis.multiProviderResults.reduce((total, mpq) => 
        total + mpq.results.filter(r => !r.mentioned).length, 0);
    }
    return analysis.questions.filter(q => !q.mentioned).length;
  };

  const overviewMentionedQuestions = analysis.questions.filter(q => q.mentioned);
  const overviewNotMentionedQuestions = analysis.questions.filter(q => !q.mentioned);

  // Funciones de paginación
  const resetPagination = () => {
    setCurrentPage(1);
  };

  const getPaginatedQuestions = (questions: typeof questionsForProvider) => {
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    return questions.slice(startIndex, endIndex);
  };

  const getTotalPages = (questions: typeof questionsForProvider) => {
    return Math.ceil(questions.length / questionsPerPage);
  };

  // Función para formatear texto simple
  const formatTextWithReferences = (text: string) => {
    return (
      <div className="text-xs text-muted-foreground leading-relaxed">
        {text}
      </div>
    );
  };

  const paginatedMentionedQuestions = getPaginatedQuestions(mentionedQuestions);
  const paginatedNotMentionedQuestions = getPaginatedQuestions(notMentionedQuestions);
  const totalMentionedPages = getTotalPages(mentionedQuestions);
  const totalNotMentionedPages = getTotalPages(notMentionedQuestions);

  // Reset pagination when provider changes
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
    resetPagination();
  };

  // Funciones para obtener nombres e iconos de proveedores
  const getProviderName = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'claude': return 'Claude';
      case 'gemini': return 'Gemini';
      case 'perplexity': return 'Perplexity';
      default: return provider;
    }
  };

  // Componente de paginación
  const PaginationControls = ({ totalPages, currentPage, onPageChange }: { 
    totalPages: number; 
    currentPage: number; 
    onPageChange: (page: number) => void;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 px-2 sm:px-4">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 sm:h-9"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 sm:h-9"
          >
            <span className="hidden sm:inline mr-1">Siguiente</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2 break-words">
            Análisis AEO: {analysis.domain}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Sector: {analysis.sector} • {getTotalResponses()} respuestas analizadas
          </p>
        </div>
        <Button onClick={onNewAnalysis} className="btn-primary w-full sm:w-auto flex-shrink-0">
          <Sparkles className="h-4 w-4 mr-2" />
          Nuevo Análisis
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-max py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Resumen</span>
          <span className="sm:hidden">Inicio</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('questions');
            resetPagination();
          }}
          className={`flex-1 min-w-max py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'questions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-4 w-4 inline mr-1 sm:mr-2" />
          Preguntas
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 min-w-max py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lightbulb className="h-4 w-4 inline mr-1 sm:mr-2" />
          Sugerencias
        </button>
        <button
          onClick={() => setActiveTab('competition')}
          className={`flex-1 min-w-max py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'competition'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4 inline mr-1 sm:mr-2" />
          Competencia
        </button>
        {analysis.providerComparison && (
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 min-w-max py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'providers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-1 sm:mr-2" />
            Proveedores
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Score de Visibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysis.visibilityScore)}`}>
                  {analysis.visibilityScore}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  {getScoreLabel(analysis.visibilityScore)}
                </div>
                <Progress value={analysis.visibilityScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Mentions Card */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Menciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mencionado</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{getTotalMentioned()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">No mencionado</span>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{getTotalNotMentioned()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-bold">{getTotalResponses()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Strength */}
          {analysis.competitiveAnalysis && (
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Fortaleza Competitiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2 capitalize">
                    {analysis.competitiveAnalysis.competitiveStrength}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {analysis.competitiveAnalysis.totalCompetitors} competidores identificados
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Top competidor: {analysis.competitiveAnalysis.topCompetitors[0]?.name || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Competition Tab */}
      {activeTab === 'competition' && analysis.competitiveAnalysis && (
        <div className="space-y-6">
          {/* Competitive Overview */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Análisis Competitivo
              </CardTitle>
              <CardDescription>
                Empresas mencionadas orgánicamente en las respuestas de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysis.competitiveAnalysis.totalCompetitors}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Competidores identificados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 capitalize">
                    {analysis.competitiveAnalysis.competitiveStrength}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fortaleza competitiva
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.competitiveAnalysis.marketGaps.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gaps de mercado
                  </div>
                </div>
              </div>

              {/* Top Competitors */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Top Competidores</h4>
                {analysis.competitiveAnalysis.topCompetitors.map((competitor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{competitor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {competitor.count} {competitor.count === 1 ? 'mención' : 'menciones'}
                          {competitor.providerConsensus && competitor.providerConsensus > 1 && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {competitor.providerConsensus}/4 proveedores
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSentimentColor(competitor.sentiment)}>
                        {getSentimentIcon(competitor.sentiment)}
                        <span className="ml-1 capitalize">{competitor.sentiment}</span>
                      </Badge>
                      <div className="text-sm font-medium">
                        {competitor.marketShare.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Gaps */}
              {analysis.competitiveAnalysis.marketGaps.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-3">Oportunidades de Mercado</h4>
                  <div className="space-y-2">
                    {analysis.competitiveAnalysis.marketGaps.map((gap, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Insights */}
              {analysis.competitiveAnalysis.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-3">Insights Competitivos</h4>
                  <div className="space-y-2">
                    {analysis.competitiveAnalysis.recommendations.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && analysis.providerComparison && (
        <ProviderComparison comparison={analysis.providerComparison} />
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Selector de proveedor */}
          {analysis.multiProviderResults && (
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <span className="text-base sm:text-lg">Análisis por Proveedor</span>
                  </div>
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="claude">Claude</SelectItem>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="perplexity">Perplexity</SelectItem>
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando resultados para <span className="font-medium">{getProviderName(selectedProvider)}</span>
                  </span>
                  <span className="text-xs">
                    Mostrando {questionsPerPage} preguntas por página
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mentioned Questions */}
          {mentionedQuestions.length > 0 && (
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Preguntas donde fuiste mencionado ({mentionedQuestions.length})
                  {analysis.multiProviderResults && (
                    <span className="text-sm font-normal text-muted-foreground">
                      - {getProviderName(selectedProvider)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {paginatedMentionedQuestions.map((question, index) => {
                    const isExpanded = expandedQuestions.has(question.id);
                    const shouldShowToggle = question.response.length > 150;
                    const wordCount = question.response.split(' ').length;
                    
                    return (
                      <div key={question.id} className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <h4 className="font-medium text-green-800 dark:text-green-200 text-sm leading-tight flex-1 pr-2">
                              {question.question}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge className={`${getSentimentColor(question.sentiment)} text-xs`}>
                                {getSentimentIcon(question.sentiment)}
                              </Badge>
                              {question.position && (
                                <Badge variant="outline" className="text-xs">
                                  #{question.position}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`${!isExpanded && shouldShowToggle ? 'line-clamp-3' : ''}`}>
                            {formatTextWithReferences(question.response)}
                          </div>
                          {shouldShowToggle && (
                            <button
                              onClick={() => toggleQuestionExpansion(question.id)}
                              className="mt-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs font-medium flex items-center gap-1 transition-all duration-200"
                            >
                              <ArrowRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                              {isExpanded ? 'Ver menos' : `Ver más`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <PaginationControls 
                  totalPages={totalMentionedPages} 
                  currentPage={currentPage} 
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>
          )}

          {/* Not Mentioned Questions */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Preguntas donde no fuiste mencionado ({notMentionedQuestions.length})
                {analysis.multiProviderResults && (
                  <span className="text-sm font-normal text-muted-foreground">
                    - {getProviderName(selectedProvider)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paginatedNotMentionedQuestions.map((question, index) => {
                  const isExpanded = expandedQuestions.has(question.id);
                  const shouldShowToggle = question.response.length > 150;
                  const wordCount = question.response.split(' ').length;
                  
                  return (
                    <div key={question.id} className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <h4 className="font-medium text-red-800 dark:text-red-200 text-sm leading-tight flex-1 pr-2">
                            {question.question}
                          </h4>
                          <Badge className={`${getSentimentColor(question.sentiment)} text-xs flex-shrink-0`}>
                            {getSentimentIcon(question.sentiment)}
                          </Badge>
                        </div>
                        <div className={`${!isExpanded && shouldShowToggle ? 'line-clamp-3' : ''}`}>
                          {formatTextWithReferences(question.response)}
                        </div>
                        {shouldShowToggle && (
                          <button
                            onClick={() => toggleQuestionExpansion(question.id)}
                            className="mt-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium flex items-center gap-1 transition-all duration-200"
                          >
                            <ArrowRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                            {isExpanded ? 'Ver menos' : `Ver más`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <PaginationControls 
                totalPages={totalNotMentionedPages} 
                currentPage={currentPage} 
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Sugerencias de Mejora
              </CardTitle>
              <CardDescription>
                Recomendaciones personalizadas para mejorar tu visibilidad AEO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(suggestion.category)}
                        <h4 className="font-medium">{suggestion.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {formatTextWithReferences(suggestion.description)}
                    </div>
                    {suggestion.impact && (
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">Impacto esperado:</span>
                        <span>{suggestion.impact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}