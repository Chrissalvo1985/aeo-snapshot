# Configuración de AEO Snapshot

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente, necesitas crear un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# OpenAI API Key (REQUERIDO)
OPENAI_API_KEY=tu-api-key-de-openai-aqui

# Database URL (Opcional para desarrollo local)
DATABASE_URL=tu-url-de-base-de-datos-aqui

# App URL (Opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Cómo obtener la API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a "API Keys" en tu dashboard
4. Crea una nueva API key
5. Copia la key y pégala en tu archivo `.env.local`

## Pasos para configurar

1. Crea el archivo `.env.local` en la raíz del proyecto
2. Agrega tu API key de OpenAI
3. Ejecuta `npm run dev` para iniciar el servidor de desarrollo
4. La aplicación estará disponible en `http://localhost:3000`

## Solución de Problemas

### Error 400: "OpenAI API key not configured"
- Verifica que el archivo `.env.local` existe
- Verifica que la variable `OPENAI_API_KEY` está configurada correctamente
- Reinicia el servidor de desarrollo después de agregar las variables

### Error 404: Favicons no encontrados
- Los favicons se sirven desde la carpeta `public/`
- Asegúrate de que los archivos existen o agrega tus propios favicons

### Error en análisis
- Verifica que tienes créditos disponibles en tu cuenta de OpenAI
- Revisa la consola del navegador para más detalles del error 