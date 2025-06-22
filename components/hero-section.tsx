"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface Stats {
  totalTracks: number
  totalUsers: number
  totalDownloads: number
}

export function HeroSection() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const scrollToCatalog = () => {
    const catalogSection = document.getElementById('catalog')
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M+`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K+`
    }
    return num.toString()
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700 py-20 animate-gradient">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-xl floating"></div>
        <div
          className="absolute bottom-20 right-10 w-48 h-48 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl floating"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo and Brand */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center neon-glow logo-pulse">
                <div className="music-bars">
                  <div className="music-bar"></div>
                  <div className="music-bar"></div>
                  <div className="music-bar"></div>
                  <div className="music-bar"></div>
                  <div className="music-bar"></div>
                </div>
              </div>
              <div className="absolute -inset-2 gradient-primary rounded-2xl blur opacity-30 animate-pulse"></div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-gray-900 via-cyan-600 to-purple-600 dark:from-white dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent leading-tight animate-gradient">
            K-TUNES
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 dark:text-slate-300 mb-4 font-medium">
            Твоя музыка. Твой мир. Твои эмоции.
          </p>

          <p className="text-lg text-gray-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
            Бесплатная платформа для прослушивания и скачивания музыки. Миллионы треков, плейлисты и открытия ждут тебя.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              className="gradient-primary text-white font-semibold px-8 py-4 rounded-xl neon-glow hover:scale-105 transition-all duration-300 hover-lift"
              onClick={scrollToCatalog}
            >
              <Play className="w-5 h-5 mr-2" />
              Начать слушать
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center p-6 rounded-xl transition-all duration-300 hover:bg-white/5 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10">
              <div className="text-3xl font-bold text-cyan-400 mb-2 neon-text">
                {stats ? formatNumber(stats.totalTracks) : "10M+"}
              </div>
              <div className="text-gray-600 dark:text-slate-400">Треков</div>
            </div>
            <div className="text-center p-6 rounded-xl transition-all duration-300 hover:bg-white/5 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="text-3xl font-bold text-purple-400 mb-2 neon-text">
                {stats ? formatNumber(stats.totalUsers) : "500K+"}
              </div>
              <div className="text-gray-600 dark:text-slate-400">Пользователей</div>
            </div>
            <div className="text-center p-6 rounded-xl transition-all duration-300 hover:bg-white/5 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/10">
              <div className="text-3xl font-bold text-pink-400 mb-2 neon-text">24/7</div>
              <div className="text-gray-600 dark:text-slate-400">Доступность</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
