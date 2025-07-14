import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AEOQuestion } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateVisibilityScore(questions: AEOQuestion[]): number {
  if (questions.length === 0) return 0;
  
  const mentionedCount = questions.filter(q => q.mentioned).length;
  return Math.round((mentionedCount / questions.length) * 100);
}

export function getSentimentColor(sentiment: 'positive' | 'negative' | 'neutral'): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600 bg-green-50';
    case 'negative':
      return 'text-red-600 bg-red-50';
    case 'neutral':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function formatDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 