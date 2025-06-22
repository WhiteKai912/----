"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const Player = dynamic(() => import("@/components/player").then(mod => mod.Player), {
  loading: () => (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
    </div>
  ),
  ssr: false
})

const MobilePlayer = dynamic(() => import("@/components/mobile-player").then(mod => mod.MobilePlayer), {
  loading: () => (
    <div className="fixed bottom-16 left-0 right-0 h-20 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
    </div>
  ),
  ssr: false
})

export function PlayerWrapper() {
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

  if (!mounted) return null

  return (
    <>
      {isMobile ? (
        <div className="block md:hidden">
          <MobilePlayer />
        </div>
      ) : (
        <div className="hidden md:block">
          <Player />
        </div>
      )}
    </>
  )
} 