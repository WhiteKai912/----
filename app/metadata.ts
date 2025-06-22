import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "K-Tunes - Бесплатная музыкальная платформа",
  description: "Слушайте и скачивайте музыку бесплатно",
  generator: 'Next.js',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#00b3ff',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  }
} 