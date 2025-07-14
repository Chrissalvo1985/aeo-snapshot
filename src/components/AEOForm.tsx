'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Tag, Search, Sparkles, CheckCircle, Zap, Plus, Upload, Download, FileText } from 'lucide-react';

interface AEOFormProps {
  onSubmit: (data: { brand: string; sector: string; keywords?: string; customQuestions?: string[] }) => void;
  isLoading: boolean;
}

const sectors = [
  { id: 'tecnologia', name: 'Tecnología', icon: '💻' },
  { id: 'salud', name: 'Salud', icon: '🏥' },
  { id: 'finanzas', name: 'Finanzas', icon: '💰' },
  { id: 'educacion', name: 'Educación', icon: '📚' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { id: 'marketing', name: 'Marketing', icon: '📱' },
  { id: 'inmobiliario', name: 'Inmobiliario', icon: '🏠' },
  { id: 'alimentacion', name: 'Alimentación', icon: '🍕' },
  { id: 'moda', name: 'Moda', icon: '👗' },
  { id: 'viajes', name: 'Viajes', icon: '✈️' },
  { id: 'deportes', name: 'Deportes', icon: '⚽' },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: '🎬' },
  { id: 'automotriz', name: 'Automotriz', icon: '🚗' },
  { id: 'construccion', name: 'Construcción', icon: '🏗️' },
  { id: 'energia', name: 'Energía', icon: '⚡' },
  { id: 'agricultura', name: 'Agricultura', icon: '🌾' },
  { id: 'logistica', name: 'Logística', icon: '📦' },
  { id: 'consultoria', name: 'Consultoría', icon: '💼' },
];

export default function AEOForm({ onSubmit, isLoading }: AEOFormProps) {
  const [formData, setFormData] = useState({
    brand: '',
    sector: '',
    keywords: '',
  });

  const [showCustomSector, setShowCustomSector] = useState(false);
  const [customSector, setCustomSector] = useState('');
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [showCustomQuestions, setShowCustomQuestions] = useState(false);

  const [validations, setValidations] = useState({
    brand: false,
    sector: false,
  });

  // Generate and download template CSV
  const downloadTemplate = () => {
    const template = `pregunta
¿Cuáles son las mejores marcas de tecnología?
¿Qué empresa es líder en innovación?
¿Cuál es la marca más confiable del sector?
¿Qué compañía tiene mejor reputación?
¿Cuáles son las marcas más populares?
¿Qué empresa ofrece mejor calidad?
¿Cuál es la marca más reconocida?
¿Qué compañía tiene mejor servicio al cliente?
¿Cuáles son las empresas más exitosas?
¿Qué marca recomendarías?`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-preguntas-aeo.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const questions = lines[0].toLowerCase().includes('pregunta') 
        ? lines.slice(1).map(line => line.trim()).filter(Boolean)
        : lines.map(line => line.trim()).filter(Boolean);

      setCustomQuestions(questions);
      setShowCustomQuestions(true);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSector = showCustomSector ? customSector : formData.sector;
    if (formData.brand && finalSector) {
      onSubmit({
        brand: formData.brand,
        sector: finalSector,
        keywords: formData.keywords,
        customQuestions: customQuestions.length > 0 ? customQuestions : undefined
      });
    }
  };

  const handleBrandChange = (value: string) => {
    setFormData(prev => ({ ...prev, brand: value }));
    setValidations(prev => ({ ...prev, brand: value.length >= 2 }));
  };

  const handleSectorChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomSector(true);
      setFormData(prev => ({ ...prev, sector: '' }));
      setValidations(prev => ({ ...prev, sector: false }));
    } else {
      setShowCustomSector(false);
      setCustomSector('');
      setFormData(prev => ({ ...prev, sector: value }));
      setValidations(prev => ({ ...prev, sector: true }));
    }
  };

  const handleCustomSectorChange = (value: string) => {
    setCustomSector(value);
    setValidations(prev => ({ ...prev, sector: value.length >= 2 }));
  };

  const isFormValid = validations.brand && validations.sector;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Card className="card-modern max-w-2xl mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="relative mx-auto mb-4">
            <div className="gradient-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse-soft"></div>
          </div>
          
          <CardTitle className="gradient-text text-xl sm:text-2xl mb-2">
            ¿Cómo te ve la IA?
          </CardTitle>
          <CardDescription className="text-sm sm:text-base flex items-center justify-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4 text-yellow-500" />
            Descubre tu visibilidad en las respuestas de inteligencia artificial
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              Nombre de tu marca
              <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ej: Tesla, Apple, Coca-Cola..."
                value={formData.brand}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="input-modern pl-12 pr-12"
                required
              />
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              {validations.brand && (
                <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el nombre exacto de tu marca o empresa
            </p>
          </div>

          {/* Sector Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Tag className="h-4 w-4 text-primary" />
              Sector de tu negocio
              <span className="text-destructive">*</span>
            </label>
            
            <div className="relative">
              <Select onValueChange={handleSectorChange} value={showCustomSector ? 'custom' : formData.sector}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecciona tu sector..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      <div className="flex items-center gap-2">
                        <span>{sector.icon}</span>
                        <span>{sector.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Otro sector...</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {validations.sector && !showCustomSector && (
                <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>

            {/* Custom Sector Input */}
            {showCustomSector && (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Escribe tu sector..."
                    value={customSector}
                    onChange={(e) => handleCustomSectorChange(e.target.value)}
                    className="input-modern pl-12 pr-12"
                    required
                  />
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  {validations.sector && (
                    <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe tu sector o industria específica
                </p>
              </div>
            )}

            {validations.sector && !showCustomSector && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                Sector seleccionado
              </div>
            )}
          </div>

          {/* Keywords Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Search className="h-4 w-4 text-primary" />
              Palabras clave adicionales
              <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Ej: innovación, sostenibilidad, premium..."
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                className="input-modern pl-12 pr-16"
                maxLength={100}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {formData.keywords.length}/100
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Agrega términos relevantes para un análisis más preciso
            </p>
          </div>

          {/* Custom Questions Upload */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Preguntas personalizadas
              <span className="text-xs text-muted-foreground ml-1">(opcional)</span>
            </label>
            
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground text-center">
                  <Upload className="h-4 w-4 flex-shrink-0" />
                  <span>Sube tu archivo CSV con preguntas específicas</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Descargar plantilla</span>
                    <span className="sm:hidden">Plantilla</span>
                  </Button>
                  
                  <label className="relative w-full sm:w-auto">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Subir archivo</span>
                      <span className="sm:hidden">Subir</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {showCustomQuestions && customQuestions.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">{customQuestions.length} preguntas cargadas</span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Se usarán estas preguntas para el análisis AEO personalizado
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCustomQuestions([]);
                    setShowCustomQuestions(false);
                  }}
                  className="mt-2 h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  Eliminar preguntas
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Carga un archivo CSV con preguntas específicas para tu sector. Formato: una pregunta por línea.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="btn-primary w-full h-14 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Analizando tu marca...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-3" />
                Iniciar Análisis AEO
                {customQuestions.length > 0 && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    +{customQuestions.length} preguntas
                  </span>
                )}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
} 