'use client';

import { useState } from 'react';
import { Menu, X, Sparkles, Moon, Sun, Bot, Info } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

interface HeaderProps {
  onShowDashboard?: () => void;
  onShowHistory?: () => void;
  onShowHome?: () => void;
  onShowBot?: () => void;
  currentView?: 'form' | 'dashboard' | 'history' | 'bot';
  hasAnalysis?: boolean;
}

export default function Header({ onShowDashboard, onShowHistory, onShowHome, onShowBot, currentView = 'form', hasAnalysis = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AEO Snapshot
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={onShowHome}
              className={`transition-colors ${
                currentView === 'form' 
                  ? 'text-purple-600 dark:text-purple-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              Inicio
            </button>
            <button 
              onClick={onShowDashboard}
              disabled={!hasAnalysis}
              className={`transition-colors ${
                currentView === 'dashboard' 
                  ? 'text-purple-600 dark:text-purple-400 font-medium' 
                  : hasAnalysis 
                    ? 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              Análisis
            </button>
            <button 
              onClick={onShowHistory}
              className={`transition-colors ${
                currentView === 'history' 
                  ? 'text-purple-600 dark:text-purple-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              Historial
            </button>
            <button 
              onClick={onShowBot}
              className={`flex items-center space-x-1 transition-colors ${
                currentView === 'bot' 
                  ? 'text-purple-600 dark:text-purple-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Bot IA</span>
            </button>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Info Button */}
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Información"
            >
              <Info className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>



            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <nav className="py-4 space-y-2">
              <button 
                onClick={() => {
                  onShowHome?.();
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'form' 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Inicio
              </button>
              <button 
                onClick={() => {
                  if (hasAnalysis) {
                    onShowDashboard?.();
                    setIsMenuOpen(false);
                  }
                }}
                disabled={!hasAnalysis}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard' 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 font-medium' 
                    : hasAnalysis 
                      ? 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                Análisis
              </button>
              <button 
                onClick={() => {
                  onShowHistory?.();
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'history' 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Historial
              </button>
              <button 
                onClick={() => {
                  onShowBot?.();
                  setIsMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'bot' 
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Bot className="h-4 w-4" />
                <span>Bot IA</span>
              </button>
              <button 
                onClick={() => {
                  setShowInfo(true);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Info className="h-4 w-4" />
                <span>Info</span>
              </button>
            </nav>
          </div>
        )}

        {/* Info Modal */}
        {showInfo && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8"
            onClick={() => setShowInfo(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>¿Cómo usar AEO Snapshot?</span>
                </h3>
                <button
                  onClick={() => setShowInfo(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🎯 ¿Qué hace esta app?</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    AEO Snapshot analiza qué tan visible es tu marca en motores de IA como ChatGPT, Claude y Gemini. Te ayuda a optimizar tu presencia digital para aparecer en respuestas de IA.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🚀 Cómo empezar:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Ve a <strong>Inicio</strong> y completa el formulario</li>
                    <li>Ingresa tu marca, sector y palabras clave</li>
                    <li>Espera el análisis (toma unos minutos)</li>
                    <li>Revisa tus resultados en el <strong>Dashboard</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">📊 Secciones principales:</h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li><strong>Inicio:</strong> Crear nuevos análisis</li>
                    <li><strong>Análisis:</strong> Ver resultados detallados</li>
                    <li><strong>Historial:</strong> Revisar análisis anteriores</li>
                    <li><strong>Bot IA:</strong> Conversar con tus análisis</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🤖 Bot IA:</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Usa el Bot IA para hacer preguntas sobre tus análisis como: "¿Por qué mi visibilidad es baja?" o "¿Cómo puedo mejorar mi posicionamiento?"
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 <strong>Tip:</strong> Los mejores resultados se obtienen con información específica sobre tu marca y sector.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 