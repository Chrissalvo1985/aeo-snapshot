'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Zap,
  Brain,
  Search,
  Sparkles
} from 'lucide-react';
import { ProviderComparison, AIProvider } from '@/lib/types';

interface ProviderComparisonProps {
  comparison: ProviderComparison[];
}

const getProviderIcon = (provider: AIProvider) => {
  switch (provider) {
    case 'openai': return <Brain className="h-4 w-4" />;
    case 'claude': return <Zap className="h-4 w-4" />;
    case 'gemini': return <Sparkles className="h-4 w-4" />;
    case 'perplexity': return <Search className="h-4 w-4" />;
    default: return <Eye className="h-4 w-4" />;
  }
};

const getProviderName = (provider: AIProvider) => {
  switch (provider) {
    case 'openai': return 'OpenAI';
    case 'claude': return 'Claude';
    case 'gemini': return 'Gemini';
    case 'perplexity': return 'Perplexity';
    default: return provider;
  }
};

const getProviderColor = (provider: AIProvider) => {
  switch (provider) {
    case 'openai': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'claude': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'gemini': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'perplexity': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export default function ProviderComparison({ comparison }: ProviderComparisonProps) {
  // Ordenar por score de visibilidad
  const sortedComparison = [...comparison].sort((a, b) => b.visibilityScore - a.visibilityScore);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Resumen comparativo */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparación de Proveedores IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {sortedComparison.map((provider) => (
              <div key={provider.provider} className="space-y-3 p-3 sm:p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getProviderIcon(provider.provider)}
                    <span className="font-medium text-sm sm:text-base truncate">{getProviderName(provider.provider)}</span>
                  </div>
                  <Badge className={`${getProviderColor(provider.provider)} text-xs flex-shrink-0`}>
                    {provider.provider}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Visibilidad</span>
                    <span className={`font-bold text-sm sm:text-base ${getScoreColor(provider.visibilityScore)}`}>
                      {provider.visibilityScore}%
                    </span>
                  </div>
                  <Progress value={provider.visibilityScore} className="h-2" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Menciones</span>
                    <span className="text-xs font-medium">{provider.mentionCount}</span>
                  </div>
                  
                  {provider.averagePosition && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Pos. Promedio</span>
                      <span className="text-xs font-medium">{provider.averagePosition.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Distribución de sentimientos */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Sentimientos</div>
                  <div className="flex gap-1 flex-wrap">
                    {provider.sentimentDistribution.positive > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs">{provider.sentimentDistribution.positive}</span>
                      </div>
                    )}
                    {provider.sentimentDistribution.negative > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs">{provider.sentimentDistribution.negative}</span>
                      </div>
                    )}
                    {provider.sentimentDistribution.neutral > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-gray-400 rounded-full" />
                        <span className="text-xs">{provider.sentimentDistribution.neutral}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking de proveedores */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Ranking de Visibilidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedComparison.map((provider, index) => (
              <div key={provider.provider} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(provider.provider)}
                    <span className="font-medium text-sm sm:text-base">{getProviderName(provider.provider)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:flex-row justify-between sm:justify-end">
                  <div className="text-right">
                    <div className={`font-bold text-sm sm:text-base ${getScoreColor(provider.visibilityScore)}`}>
                      {provider.visibilityScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {provider.mentionCount} menciones
                    </div>
                  </div>
                  
                  {provider.averagePosition && (
                    <div className="text-right">
                      <div className="font-medium text-sm sm:text-base">#{provider.averagePosition.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">posición</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 