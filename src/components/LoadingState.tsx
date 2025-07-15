'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Zap,
  Brain
} from 'lucide-react';

interface LoadingStateProps {
  currentStep?: number;
  totalSteps?: number;
  currentMessage?: string;
}

const loadingMessages = [
  'Iniciando análisis AEO...',
  'Generando preguntas relevantes...',
  'Consultando modelos de IA...',
  'Procesando respuestas...',
  'Detectando menciones de marca...',
  'Analizando competencia...',
  'Generando insights...',
  'Finalizando análisis...',
  'Preparando resultados...'
];

export default function LoadingState({ 
  currentStep = 0, 
  totalSteps = 8, 
  currentMessage 
}: LoadingStateProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + (100 / (totalSteps * 8)), 95); // Avanza cada segundo hasta 95%
        return newProgress;
      });
      
      // Cambiar mensaje cada 3-4 segundos
      setMessageIndex(prev => {
        const nextIndex = Math.min(prev, Math.floor(progress / 11)); // Cambia mensaje basado en progreso
        return nextIndex < loadingMessages.length - 1 ? nextIndex : loadingMessages.length - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalSteps, progress]);

  // Cuando se recibe un paso específico, ajustar el progreso
  useEffect(() => {
    if (currentStep !== undefined) {
      const stepProgress = ((currentStep + 1) / totalSteps) * 100;
      setProgress(stepProgress);
      setMessageIndex(Math.min(currentStep, loadingMessages.length - 1));
    }
  }, [currentStep, totalSteps]);

  const displayMessage = currentMessage || loadingMessages[messageIndex];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-green-50/30 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-green-900/10"></div>
        
        <CardContent className="relative p-6 sm:p-8">
          {/* Header con icono animado */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Zap className="h-8 w-8 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analizando tu visibilidad AEO
            </h2>
          </div>

          {/* Mensaje actual con animación */}
          <motion.div 
            className="text-center mb-8"
            key={displayMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-3 text-lg font-medium text-gray-900 dark:text-gray-100">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
              <span>{displayMessage}</span>
            </div>
          </motion.div>

          {/* Barra de progreso principal */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso del análisis
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="relative">
              <Progress value={progress} className="h-4" />
              
              {/* Efecto de brillo en la barra */}
              <motion.div
                className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                animate={{
                  x: ['-2rem', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>

          {/* Indicador de actividad */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <motion.div
              className="w-2 h-2 bg-purple-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span>Procesando datos en tiempo real...</span>
          </div>

          {/* Dato curioso */}
          <motion.div 
            className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2 }}
          >
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Brain className="h-4 w-4" />
              <span className="font-medium">Dato interesante:</span>
              <span>El AEO representa el futuro de las búsquedas digitales</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
} 