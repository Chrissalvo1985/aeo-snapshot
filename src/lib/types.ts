export interface AEOQuestion {
  id: string;
  question: string;
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  response: string;
  searchCriteria?: string[]; // Términos de búsqueda utilizados por el bot
  sources?: string[]; // URLs de las fuentes consultadas
}

export interface CompetitorMention {
  name: string;
  count: number;
  positions: number[];
  sentiment: 'positive' | 'negative' | 'neutral';
  questions: string[];
  marketShare: number; // Porcentaje de aparición
  providerConsensus?: number; // Número de proveedores que mencionan este competidor
}

export interface CompetitiveAnalysis {
  totalCompetitors: number;
  topCompetitors: CompetitorMention[];
  marketGaps: string[];
  competitiveStrength: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface AEOSuggestion {
  title: string;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  category: 'Contenido' | 'Técnico' | 'Estrategia' | 'Optimización';
  impact?: string;
}

// Nuevos tipos para múltiples proveedores
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'perplexity';

export interface ProviderResult {
  provider: AIProvider;
  question: string;
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  response: string;
  analysis_notes?: string;
  searchCriteria: string[]; // Términos de búsqueda utilizados por el bot
  sources: string[]; // URLs de las fuentes consultadas
}

export interface MultiProviderQuestion {
  id: string;
  question: string;
  results: ProviderResult[];
}

export interface ProviderComparison {
  provider: AIProvider;
  visibilityScore: number;
  mentionCount: number;
  averagePosition: number | null;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface AEOAnalysis {
  id?: number;
  domain: string;
  sector: string;
  keywords?: string;
  questions: AEOQuestion[];
  results: AEOQuestion[];
  visibilityScore: number;
  suggestions: AEOSuggestion[];
  competitiveAnalysis?: CompetitiveAnalysis;
  customQuestionsUsed?: boolean;
  customQuestionsCount?: number;
  // Nuevos campos para múltiples proveedores
  multiProviderResults?: MultiProviderQuestion[];
  providerComparison?: ProviderComparison[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OpenAIResponse {
  question: string;
  mentioned: boolean;
  position: number | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  response: string;
  analysis_notes?: string;
}

export interface FormData {
  domain: string;
  sector: string;
  keywords?: string;
} 