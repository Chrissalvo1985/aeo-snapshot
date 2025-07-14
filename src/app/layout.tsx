import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "AEO Snapshot - Análisis de Visibilidad en IA",
  description: "Descubre cómo te menciona la IA cuando hablan de tu sector. Mejora tu posicionamiento AEO con análisis detallado y sugerencias personalizadas.",
  keywords: ["AEO", "SEO", "IA", "ChatGPT", "visibilidad", "marketing digital", "optimización"],
  authors: [{ name: "AEO Snapshot" }],
  creator: "AEO Snapshot",
  publisher: "AEO Snapshot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "AEO Snapshot - ¿Cómo te ve la IA?",
    description: "Descubre tu visibilidad en las respuestas de inteligencia artificial y mejora tu posicionamiento AEO",
    url: '/',
    siteName: 'AEO Snapshot',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AEO Snapshot - Análisis de Visibilidad en IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "AEO Snapshot - ¿Cómo te ve la IA?",
    description: "Descubre tu visibilidad en las respuestas de inteligencia artificial y mejora tu posicionamiento AEO",
    creator: '@aeo_snapshot',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AEO Snapshot',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'AEO Snapshot',
    'msapplication-TileColor': '#2563eb',
    'theme-color': '#2563eb',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AEO Snapshot" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="AEO Snapshot" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="aeo-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
