'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, Clock, Sparkles, User, ChevronDown, ChevronUp, BarChart3, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { AEOAnalysis } from '@/lib/types';
import { getAnalysesFromLocalStorage } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIBotProps {
  onBackToHistory: () => void;
}

export default function AIBot({ onBackToHistory }: AIBotProps) {
  const [selectedAnalyses, setSelectedAnalyses] = useState<AEOAnalysis[]>([]);
  const [analyses, setAnalyses] = useState<AEOAnalysis[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysisSelector, setShowAnalysisSelector] = useState(true);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar análisis al montar el componente
  useEffect(() => {
    const loadAnalyses = () => {
      const savedAnalyses = getAnalysesFromLocalStorage();
      setAnalyses(savedAnalyses);
    };
    loadAnalyses();
  }, []);

  // Scroll automático a mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje de bienvenida cuando se seleccionan análisis
  useEffect(() => {
    if (selectedAnalyses.length > 0 && messages.length === 0) {
      // Solo mostrar que está listo, sin mensaje automático estructurado
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: selectedAnalyses.length === 1 
          ? `Hola! Ya tengo cargado el análisis de ${selectedAnalyses[0].domain}. ¿Qué te gustaría saber?`
          : `Hola! Tengo ${selectedAnalyses.length} análisis listos para comparar. ¿Qué quieres que analicemos?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedAnalyses]);

  const handleSelectAnalysis = (analysis: AEOAnalysis) => {
    if (isMultiSelectMode) {
      setSelectedAnalyses(prev => {
        const isSelected = prev.some(a => a.id === analysis.id);
        if (isSelected) {
          return prev.filter(a => a.id !== analysis.id);
        } else {
          return [...prev, analysis];
        }
      });
    } else {
      setSelectedAnalyses([analysis]);
      setMessages([]);
      setShowAnalysisSelector(false);
    }
  };

  const handleConfirmMultiSelection = () => {
    if (selectedAnalyses.length > 0) {
      setMessages([]);
      setShowAnalysisSelector(false);
    }
  };

  const handleToggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (!isMultiSelectMode) {
      // Al activar modo multi-selección, mantener solo el primer análisis si hay alguno seleccionado
      if (selectedAnalyses.length > 1) {
        setSelectedAnalyses([selectedAnalyses[0]]);
      }
    } else {
      // Al desactivar modo multi-selección, mantener solo el primer análisis
      if (selectedAnalyses.length > 1) {
        setSelectedAnalyses([selectedAnalyses[0]]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || selectedAnalyses.length === 0 || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          analyses: selectedAnalyses, // Cambio: enviar array de análisis
          conversationHistory: messages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la respuesta');
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear texto markdown simple
  const formatBotMessage = (content: string) => {
    // Formatear el contenido principal
    const lines = content.split('\n');
    const formattedLines: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        formattedLines.push(<br key={index} />);
        return;
      }
      
      // Lista con bullets (•)
      if (line.trim().startsWith('• ')) {
        formattedLines.push(
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-purple-500 font-bold text-lg leading-none">•</span>
            <span className="flex-1">{line.trim().slice(2)}</span>
          </div>
        );
        return;
      }
      
      // Lista con asteriscos (*)
      if (line.trim().startsWith('* ')) {
        formattedLines.push(
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-purple-500 font-bold text-lg leading-none">•</span>
            <span className="flex-1">{line.trim().slice(2)}</span>
          </div>
        );
        return;
      }
      
      // Lista numerada
      if (/^\d+\./.test(line.trim())) {
        formattedLines.push(
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-purple-500 font-semibold">{line.trim().match(/^\d+\./)?.[0]}</span>
            <span className="flex-1">{line.trim().replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
        return;
      }
      
      // Títulos con doble asterisco
      if (line.trim().startsWith('**') && line.trim().endsWith('**') && line.trim().length > 4) {
        const title = line.trim().slice(2, -2);
        formattedLines.push(
          <div key={index} className="font-semibold text-purple-600 dark:text-purple-400 mt-3 mb-2">
            {title}
          </div>
        );
        return;
      }
      
      // Texto normal con negritas inline
      let formattedText = line;
      
      // Reemplazar **texto** con negritas
      formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
      
      // Reemplazar *texto* con cursivas
      formattedText = formattedText.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      
      formattedLines.push(
        <div 
          key={index} 
          className="my-1" 
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    });
    
    return (
      <div className="space-y-1">
        {formattedLines}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
            {selectedAnalyses.length > 1 ? (
              <BarChart3 className="h-6 w-6 text-white" />
            ) : (
              <Bot className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {selectedAnalyses.length > 1 ? 'Análisis Comparativo AEO' : 'Asistente AEO'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {selectedAnalyses.length > 1 
                ? 'Analiza estadísticas y compara múltiples análisis'
                : 'Conversa con tus análisis para obtener insights profundos'
              }
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={onBackToHistory}
          className="text-sm w-full sm:w-auto"
        >
          ← Volver al Historial
        </Button>
      </div>

      {/* Selector de análisis */}
      {(selectedAnalyses.length === 0 || showAnalysisSelector) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>
                  {isMultiSelectMode 
                    ? `Selecciona análisis (${selectedAnalyses.length} seleccionados)`
                    : 'Selecciona un análisis'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={isMultiSelectMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleMultiSelectMode}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isMultiSelectMode ? 'Modo Comparativo' : 'Modo Individual'}
                </Button>
                {selectedAnalyses.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalysisSelector(false)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No hay análisis disponibles para conversar.
                </p>
                <Button onClick={onBackToHistory} variant="outline">
                  Crear un análisis
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {analyses.map((analysis) => {
                    const isSelected = selectedAnalyses.some(a => a.id === analysis.id);
                    return (
                      <div
                        key={analysis.id}
                        className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''
                        }`}
                        onClick={() => handleSelectAnalysis(analysis)}
                      >
                        <div className="flex items-start space-x-3">
                          {isMultiSelectMode && (
                            <div className="flex-shrink-0 mt-1">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm truncate">{analysis.domain}</h3>
                                <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                                  <span className="truncate">{analysis.sector}</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{analysis.questions.length} preguntas</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{analysis.visibilityScore}% visibilidad</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center space-x-2 justify-end">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {new Date(analysis.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <Badge 
                                  variant={analysis.visibilityScore >= 70 ? 'default' : 
                                           analysis.visibilityScore >= 40 ? 'secondary' : 'destructive'}
                                  className="mt-1"
                                >
                                  {analysis.visibilityScore >= 70 ? 'Excelente' :
                                   analysis.visibilityScore >= 40 ? 'Bueno' : 'Necesita mejora'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {isMultiSelectMode && selectedAnalyses.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAnalyses.length} análisis seleccionados para comparación
                      </span>
                      <Button 
                        onClick={handleConfirmMultiSelection}
                        disabled={selectedAnalyses.length === 0}
                      >
                        Iniciar Análisis Comparativo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {selectedAnalyses.length > 0 && (
        <>
          {/* Info de los análisis seleccionados */}
          {!showAnalysisSelector && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      {selectedAnalyses.length > 1 ? (
                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      {selectedAnalyses.length === 1 ? (
                        <>
                          <h3 className="font-semibold">{selectedAnalyses[0].domain}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedAnalyses[0].sector} • {selectedAnalyses[0].visibilityScore}% visibilidad
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="font-semibold">{selectedAnalyses.length} análisis en comparación</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {Math.round(selectedAnalyses.reduce((sum, a) => sum + a.visibilityScore, 0) / selectedAnalyses.length)}% visibilidad promedio • 
                            {selectedAnalyses.reduce((sum, a) => sum + a.questions.length, 0)} preguntas totales
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalysisSelector(true)}
                  >
                    <ChevronDown className="h-4 w-4" />
                    Cambiar análisis
                  </Button>
                </div>
                
                {selectedAnalyses.length > 1 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {selectedAnalyses.map((analysis) => (
                        <div key={analysis.id} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <div className="font-medium truncate">{analysis.domain}</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {analysis.sector} • {analysis.visibilityScore}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chat Messages */}
          <Card className="flex-1">
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0">
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 mt-0.5" />
                          ) : (
                            selectedAnalyses.length > 1 ? (
                              <BarChart3 className="h-4 w-4 mt-0.5" />
                            ) : (
                              <Bot className="h-4 w-4 mt-0.5" />
                            )
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">
                            {message.role === 'assistant' 
                              ? formatBotMessage(message.content)
                              : <div className="whitespace-pre-wrap break-words">{message.content}</div>
                            }
                          </div>
                          <div className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {selectedAnalyses.length > 1 ? (
                          <BarChart3 className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      selectedAnalyses.length > 1 
                        ? "Pregunta estadísticas comparativas: ¿cuál tiene mejor rendimiento?, ¿qué sectores destacan?, etc..."
                        : "Pregunta sobre tu análisis AEO..."
                    }
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-background text-sm sm:text-base"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="self-end sm:self-end w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Enviar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 