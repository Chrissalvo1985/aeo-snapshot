'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AEOForm from '@/components/AEOForm';
import AEODashboard from '@/components/AEODashboard';
import LoadingState from '@/components/LoadingState';
import AIBot from '@/components/AIBot';
import { AEOAnalysis } from '@/lib/types';
import { saveAnalysisToLocalStorage, getAnalysesFromLocalStorage, deleteAnalysisFromLocalStorage, clearAllAnalysesFromLocalStorage } from '@/lib/database';

export default function Home() {
  const [analysis, setAnalysis] = useState<AEOAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previousAnalyses, setPreviousAnalyses] = useState<AEOAnalysis[]>([]);
  const [currentView, setCurrentView] = useState<'form' | 'dashboard' | 'history' | 'bot'>('form');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Analizando tu marca...');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Cargar análisis previos al montar el componente
  useEffect(() => {
    const loadPreviousAnalyses = () => {
      const analyses = getAnalysesFromLocalStorage();
      setPreviousAnalyses(analyses);
    };

    loadPreviousAnalyses();
  }, []);

  const handleFormSubmit = async (data: { brand: string; sector: string; keywords?: string; customQuestions?: string[] }) => {
    setIsLoading(true);
    setAnalysis(null);
    setCurrentStep(0);
    setCurrentMessage('Generando preguntas...');

    try {
      // Paso 1: Generar preguntas
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: data.brand, // Mapear brand a domain
          sector: data.sector,
          keywords: data.keywords,
          customQuestions: data.customQuestions
        }),
      });

      setCurrentStep(1);
      setCurrentMessage('Simulando IA...');

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Validar que el análisis tenga los datos mínimos necesarios
      if (!result || (!result.results && !result.questions)) {
        throw new Error('El análisis no se completó correctamente');
      }

      setCurrentStep(2);
      setCurrentMessage('Analizando menciones...');
      
      // Delay para mostrar el progreso visualmente
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAnalysis(result);

      setCurrentStep(3);
      setCurrentMessage('Generando insights...');
      
      // Delay para mostrar el progreso visualmente
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentStep(4);
      setCurrentMessage('Analizando competencia...');
      
      // Delay final para mostrar el progreso completo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Guardar análisis en localStorage
      saveAnalysisToLocalStorage(result);
      
      // Actualizar la lista de análisis previos
      const updatedAnalyses = getAnalysesFromLocalStorage();
      setPreviousAnalyses(updatedAnalyses);
      
      // Cambiar a vista de dashboard
      setCurrentView('dashboard');
      
    } catch (error) {
      console.error('Error al analizar:', error);
      
      // Limpiar cualquier análisis parcial
      setAnalysis(null);
      
      // Mostrar mensaje de error específico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al realizar el análisis: ${errorMessage}\n\nPor favor, intenta nuevamente.`);
      
      // Mantener en la vista del formulario
      setCurrentView('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowDashboard = () => {
    if (analysis) {
      setCurrentView('dashboard');
    } else {
      alert('No hay análisis disponible. Por favor, realiza un análisis primero.');
    }
  };

  const handleShowHistory = () => {
    setCurrentView('history');
  };

  const handleShowHome = () => {
    setCurrentView('form');
  };

  const handleShowBot = () => {
    setCurrentView('bot');
  };

  const handleSelectPreviousAnalysis = (selectedAnalysis: AEOAnalysis) => {
    setAnalysis(selectedAnalysis);
    setCurrentView('dashboard');
  };

  const handleDeleteAnalysis = (analysisId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se active el click de selección
    
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Análisis',
      message: '¿Estás seguro de que quieres eliminar este análisis?',
      onConfirm: () => {
        const success = deleteAnalysisFromLocalStorage(analysisId);
        if (success) {
          const updatedAnalyses = getAnalysesFromLocalStorage();
          setPreviousAnalyses(updatedAnalyses);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleClearAllHistory = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpiar Todo el Historial',
      message: '¿Estás seguro de que quieres eliminar todo el historial? Esta acción no se puede deshacer.',
      onConfirm: () => {
        const success = clearAllAnalysesFromLocalStorage();
        if (success) {
          setPreviousAnalyses([]);
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onShowDashboard={handleShowDashboard}
        onShowHistory={handleShowHistory}
        onShowHome={handleShowHome}
        onShowBot={handleShowBot}
        currentView={currentView}
        hasAnalysis={analysis !== null}
      />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {isLoading && <LoadingState currentStep={currentStep} currentMessage={currentMessage} />}
        
        {!isLoading && currentView === 'form' && (
          <AEOForm onSubmit={handleFormSubmit} isLoading={isLoading} />
        )}
        
        {!isLoading && currentView === 'dashboard' && analysis && (
          <AEODashboard analysis={analysis} onNewAnalysis={handleShowHome} />
        )}
        
        {!isLoading && currentView === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">Historial de Análisis</h2>
              {previousAnalyses.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full sm:w-auto text-center"
                >
                  Limpiar Todo
                </button>
              )}
            </div>
            
            {previousAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">No hay análisis previos disponibles.</p>
                <button
                  onClick={handleShowHome}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Crear Primer Análisis
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {previousAnalyses.map((prevAnalysis, index) => (
                  <div 
                    key={prevAnalysis.id || index}
                    className="group p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hover:shadow-sm"
                    onClick={() => handleSelectPreviousAnalysis(prevAnalysis)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{prevAnalysis.domain}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                              <span className="truncate">{prevAnalysis.sector}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{prevAnalysis.questions?.length || 0} preguntas</span>
                              {prevAnalysis.customQuestionsUsed && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="text-purple-600 dark:text-purple-400">Personalizado</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-gray-500">
                            <span className="whitespace-nowrap">{new Date(prevAnalysis.createdAt).toLocaleDateString()}</span>
                            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              prevAnalysis.visibilityScore >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              prevAnalysis.visibilityScore >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {prevAnalysis.visibilityScore}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteAnalysis(prevAnalysis.id || index, e)}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-100 transition-opacity self-start sm:self-center"
                        title="Eliminar análisis"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {!isLoading && currentView === 'bot' && (
          <AIBot onBackToHistory={handleShowHistory} />
        )}
      </main>

      {/* Modal de Confirmación */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">{confirmModal.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
