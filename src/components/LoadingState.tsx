'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  Search, 
  Brain, 
  BarChart3, 
  Sparkles, 
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface LoadingStateProps {
  currentStep?: number;
  totalSteps?: number;
  currentMessage?: string;
}

const loadingSteps = [
  {
    icon: Search,
    title: 'Generando preguntas',
    description: 'Creando preguntas relevantes para tu sector',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    accentColor: 'from-blue-500 to-blue-600'
  },
  {
    icon: Brain,
    title: 'Simulando IA',
    description: 'Obteniendo respuestas de ChatGPT',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    accentColor: 'from-purple-500 to-purple-600'
  },
  {
    icon: BarChart3,
    title: 'Analizando menciones',
    description: 'Evaluando tu visibilidad en las respuestas',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    accentColor: 'from-green-500 to-green-600'
  },
  {
    icon: Sparkles,
    title: 'Generando insights',
    description: 'Creando sugerencias personalizadas',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    accentColor: 'from-orange-500 to-orange-600'
  },
  {
    icon: BarChart3,
    title: 'Analizando competencia',
    description: 'Identificando competidores mencionados',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    accentColor: 'from-red-500 to-red-600'
  }
];

export default function LoadingState({ 
  currentStep = 0, 
  totalSteps = 5, 
  currentMessage = 'Analizando tu marca...' 
}: LoadingStateProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-green-50/50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-green-900/10"></div>
        
        <CardContent className="relative p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </motion.div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Analizando tu visibilidad AEO
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Esto puede tomar unos minutos mientras procesamos tu información
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 sm:h-3" />
          </div>

          {/* Current message */}
          <motion.div 
            className="text-center mb-6 sm:mb-8"
            key={currentMessage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="text-center">{currentMessage}</span>
            </div>
          </motion.div>

          {/* Steps visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {loadingSteps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              const isPending = index > currentStep;
              
              return (
                <motion.div
                  key={index}
                  className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : isActive 
                        ? `border-purple-200 ${step.bgColor} dark:border-purple-800` 
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500' 
                        : isActive 
                          ? `bg-gradient-to-r ${step.accentColor}` 
                          : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      ) : (
                        <step.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-xs sm:text-sm ${
                        isCompleted 
                          ? 'text-green-700 dark:text-green-300' 
                          : isActive 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.title}
                      </h4>
                      <p className={`text-xs ${
                        isCompleted 
                          ? 'text-green-600 dark:text-green-400' 
                          : isActive 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-400 dark:text-gray-500'
                      } break-words`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Active step pulse animation */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-purple-400"
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Fun facts */}
          <motion.div 
            className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Dato curioso:</span>
              <span>El 60% de las búsquedas futuras serán respondidas por IA</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
} 