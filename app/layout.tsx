'use client'

import { Inter } from "next/font/google"
import dynamic from 'next/dynamic'
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/components/providers/auth-provider"
import { AudioProvider } from "@/components/providers/audio-provider"
import { Loading } from '@/components/loading'
import { useState, useEffect } from "react"
import "./globals.css"
import { FavoritesProvider } from "@/components/providers/favorites-provider"

const PlayerWrapper = dynamic(() => import('@/components/player-wrapper').then(mod => ({ default: mod.PlayerWrapper })), {
  ssr: false,
  loading: () => null
})

const MobileNavigation = dynamic(() => import('@/components/mobile-navigation').then(mod => ({ default: mod.MobileNavigation })), {
  ssr: false,
  loading: () => null
})

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
  adjustFontFallback: true
})

function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!mounted) {
    return (
      <html lang="ru" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen bg-slate-50 dark:bg-dark-900" />
        </body>
      </html>
    )
  }

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/api/user/profile" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/tracks/trending" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AudioProvider>
              <FavoritesProvider>
                <main className={`${isMobile ? 'main-content' : ''} min-h-screen bg-slate-50 dark:bg-dark-900 transition-colors`} style={{ paddingBottom: '5rem' }}>
                  {children}
                </main>
                <PlayerWrapper />
                {isMobile && <MobileNavigation />}
              </FavoritesProvider>
            </AudioProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

export default Layout
