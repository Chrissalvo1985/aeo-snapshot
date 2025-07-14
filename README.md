# AEO Snapshot 🤖

> **¿Cómo te ve la IA?** Descubre tu visibilidad en las respuestas de inteligencia artificial y mejora tu posicionamiento AEO.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=flat-square&logo=openai)](https://openai.com/)
[![Neon](https://img.shields.io/badge/Neon-Database-00E699?style=flat-square)](https://neon.tech/)

## 🚀 Características

- **Análisis AEO Inteligente**: Genera preguntas relevantes para tu sector y analiza cómo te menciona la IA
- **Dashboard Interactivo**: Visualiza resultados con métricas detalladas y score de visibilidad
- **Sugerencias Personalizadas**: Recibe recomendaciones específicas para mejorar tu presencia en IA
- **PWA Ready**: Funciona como aplicación nativa en dispositivos móviles
- **Interfaz Moderna**: Diseño responsivo con animaciones suaves y UX optimizada
- **Base de Datos Serverless**: Almacenamiento eficiente con Neon PostgreSQL

## 🎯 ¿Qué es AEO?

**Answer Engine Optimization (AEO)** es la evolución del SEO para la era de la IA. Mientras el SEO se enfoca en motores de búsqueda, el AEO optimiza tu presencia en las respuestas de asistentes de IA como ChatGPT, Claude, Gemini y otros.

### ¿Por qué es importante?

- Los usuarios cada vez más consultan IA en lugar de hacer búsquedas tradicionales
- Las respuestas de IA influyen en las decisiones de compra
- La visibilidad en IA puede generar más confianza y autoridad
- Es una ventaja competitiva temprana mientras pocos lo hacen

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Lucide Icons
- **IA**: OpenAI GPT-4 con Function Calling
- **Base de Datos**: Neon PostgreSQL Serverless
- **Deployment**: Vercel (recomendado)

## 📋 Requisitos Previos

- Node.js 18.0 o superior
- npm o yarn
- Cuenta en OpenAI (API Key)
- Cuenta en Neon Database

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/yourusername/aeo-snapshot.git
   cd aeo-snapshot
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus credenciales:
   ```env
   OPENAI_API_KEY=tu_api_key_de_openai
   NEON_DATABASE_URL=tu_connection_string_de_neon
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Inicializa la base de datos**
   ```bash
   npm run db:init
   ```

5. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abre tu navegador**
   Ve a [http://localhost:3000](http://localhost:3000)

## 🎨 Flujo de la Aplicación

### 1. Input Rápido
- Usuario ingresa dominio/marca y selecciona sector
- Opcionalmente añade palabras clave específicas

### 2. Generación de Preguntas
- GPT-4 genera 5 preguntas relevantes del sector
- Preguntas simulan consultas reales de usuarios

### 3. Simulación de Respuestas
- Para cada pregunta, GPT-4 simula una respuesta típica
- Análisis de mención de la marca en cada respuesta

### 4. Detección de Menciones
- Function Calling detecta si la marca fue mencionada
- Evalúa posición y sentimiento de la mención

### 5. Dashboard de Resultados
- Score de visibilidad (% de menciones)
- Tabla detallada con análisis por pregunta
- Sugerencias personalizadas para mejorar

## 📊 Estructura de la Base de Datos

```sql
CREATE TABLE aeo_analyses (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  keywords TEXT,
  questions JSONB NOT NULL,
  results JSONB NOT NULL,
  visibility_score DECIMAL(5,2) NOT NULL,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter ESLint
- `npm run type-check` - Verificación de tipos TypeScript
- `npm run db:init` - Inicializar base de datos

## 🌐 Deployment

### Vercel (Recomendado)

1. **Conecta tu repositorio a Vercel**
2. **Configura variables de entorno en Vercel**
3. **Deploy automático en cada push**

### Variables de Entorno para Producción

```env
OPENAI_API_KEY=tu_api_key_de_openai
NEON_DATABASE_URL=tu_connection_string_de_neon
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
```

## 📱 PWA Features

- **Instalable**: Funciona como app nativa
- **Offline Ready**: Funcionalidad básica sin conexión
- **Responsive**: Optimizado para móviles y desktop
- **Fast Loading**: Optimizaciones de performance

## 🔐 Seguridad

- Validación de entrada en API routes
- Rate limiting para evitar abuso
- Sanitización de datos de usuario
- Variables de entorno para secrets
- CORS configurado apropiadamente

## 🎯 Casos de Uso

### Para Empresas
- Auditar presencia en respuestas de IA
- Identificar oportunidades de mejora
- Monitorear competencia en AEO
- Optimizar contenido para IA

### Para Agencias
- Ofrecer servicios de AEO a clientes
- Reportes de visibilidad en IA
- Estrategias de contenido optimizado
- Análisis competitivo

### Para Freelancers
- Herramienta de consultoría AEO
- Análisis rápido para prospects
- Demostración de valor
- Generación de leads

## 🔄 Próximas Funcionalidades

- [ ] Análisis de competencia
- [ ] Seguimiento histórico de visibilidad
- [ ] Integración con más modelos de IA
- [ ] Exportación de reportes PDF
- [ ] API pública para integraciones
- [ ] Dashboard de múltiples dominios
- [ ] Alertas de cambios en visibilidad

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- 📧 Email: support@aeo-snapshot.com
- 💬 GitHub Issues: [Reportar problema](https://github.com/yourusername/aeo-snapshot/issues)
- 📖 Documentación: [Wiki](https://github.com/yourusername/aeo-snapshot/wiki)

## 🙏 Agradecimientos

- [OpenAI](https://openai.com/) por la API de GPT-4
- [Neon](https://neon.tech/) por la base de datos serverless
- [Vercel](https://vercel.com/) por el hosting y deployment
- [Tailwind CSS](https://tailwindcss.com/) por el framework de CSS
- [Radix UI](https://www.radix-ui.com/) por los componentes accesibles

---

**AEO Snapshot** - Optimiza tu presencia en la era de la IA 🚀
