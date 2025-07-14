import { neon } from '@neondatabase/serverless';
import { AEOAnalysis } from './types';

let sql: ReturnType<typeof neon> | null = null;

function getSqlClient() {
  if (!sql) {
    if (!process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL === 'your_neon_database_url_here') {
      return null; // Retorna null si no hay configuración válida
    }
    sql = neon(process.env.NEON_DATABASE_URL);
  }
  return sql;
}

export { getSqlClient as sql };

// Funciones para localStorage
export function saveAnalysisToLocalStorage(analysis: AEOAnalysis) {
  if (typeof window === 'undefined') return; // Solo en el cliente
  
  try {
    const existingAnalyses = getAnalysesFromLocalStorage();
    const newAnalysis = {
      ...analysis,
      id: Date.now(), // ID simple basado en timestamp
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedAnalyses = [newAnalysis, ...existingAnalyses].slice(0, 10); // Mantener solo los últimos 10
    localStorage.setItem('aeo_analyses', JSON.stringify(updatedAnalyses));
    
    return newAnalysis;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return analysis;
  }
}

export function getAnalysesFromLocalStorage(domain?: string, limit: number = 10): AEOAnalysis[] {
  if (typeof window === 'undefined') return []; // Solo en el cliente
  
  try {
    const stored = localStorage.getItem('aeo_analyses');
    if (!stored) return [];
    
    const analyses: AEOAnalysis[] = JSON.parse(stored);
    let filtered = analyses;
    
    if (domain) {
      filtered = analyses.filter(analysis => analysis.domain.toLowerCase().includes(domain.toLowerCase()));
    }
    
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// Nueva función para eliminar análisis
export function deleteAnalysisFromLocalStorage(analysisId: number): boolean {
  if (typeof window === 'undefined') return false; // Solo en el cliente
  
  try {
    const existingAnalyses = getAnalysesFromLocalStorage();
    const updatedAnalyses = existingAnalyses.filter(analysis => analysis.id !== analysisId);
    
    localStorage.setItem('aeo_analyses', JSON.stringify(updatedAnalyses));
    return true;
  } catch (error) {
    console.error('Error deleting from localStorage:', error);
    return false;
  }
}

// Nueva función para limpiar todo el historial
export function clearAllAnalysesFromLocalStorage(): boolean {
  if (typeof window === 'undefined') return false; // Solo en el cliente
  
  try {
    localStorage.removeItem('aeo_analyses');
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

export async function initializeDatabase() {
  const client = getSqlClient();
  
  // Si no hay cliente de DB, usar localStorage
  if (!client) {
    console.log('Database not configured - using localStorage for development');
    return;
  }
  
  try {
    // Crear tabla de análisis si no existe
    await client`
      CREATE TABLE IF NOT EXISTS aeo_analyses (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        sector VARCHAR(255) NOT NULL,
        keywords TEXT,
        questions JSONB NOT NULL,
        results JSONB NOT NULL,
        visibility_score DECIMAL(5,2) NOT NULL,
        suggestions JSONB NOT NULL,
        custom_questions_used BOOLEAN DEFAULT FALSE,
        custom_questions_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Crear índices para optimizar consultas
    await client`
      CREATE INDEX IF NOT EXISTS idx_aeo_analyses_domain ON aeo_analyses(domain);
      CREATE INDEX IF NOT EXISTS idx_aeo_analyses_created_at ON aeo_analyses(created_at);
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
    // No lanzar error, solo loguearlo
  }
} 