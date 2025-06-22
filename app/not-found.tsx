"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music, Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-purple-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-700 flex items-center justify-center">
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
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="flex items-center justify-center text-8xl md:text-9xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                4
                <span className="zero-with-logo mx-2">
                  <span className="zero-outline"></span>
                  <span className="logo-anim">
                  <Music className="w-8 h-8 text-white" />
                  </span>
                </span>
                4
              </div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Трек не найден</h1>

          <p className="text-xl text-gray-600 dark:text-slate-300 mb-4">Похоже, эта страница ушла в офлайн</p>

          <p className="text-lg text-gray-500 dark:text-slate-400 mb-12 max-w-lg mx-auto">
            Возможно, ссылка устарела или страница была перемещена. Давайте найдем что-то лучше!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              asChild
              size="lg"
              className="gradient-primary text-white font-semibold px-8 py-4 rounded-xl neon-glow hover:scale-105 transition-all duration-300"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                На главную
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-white px-8 py-4 rounded-xl transition-all duration-300"
            >
              <Link href="/search">
                <Search className="w-5 h-5 mr-2" />
                Поиск музыки
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-gray-600 dark:text-slate-400 hover:text-cyan-400 px-8 py-4 rounded-xl transition-all duration-300"
              onClick={() => window.history.back()}
            >
              <span>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад
              </span>
            </Button>
          </div>

          {/* Popular Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <Link
              href="/playlists"
              className="p-6 bg-white/50 dark:bg-dark-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-dark-700/70 transition-all duration-300 hover-lift"
            >
              <Music className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Плейлисты</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Исследуйте музыкальные коллекции</p>
            </Link>

            <Link
              href="/favorites"
              className="p-6 bg-white/50 dark:bg-dark-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-dark-700/70 transition-all duration-300 hover-lift"
            >
              <div className="w-8 h-8 text-purple-400 mx-auto mb-3 flex items-center justify-center">❤️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Избранное</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Ваши любимые треки</p>
            </Link>

            <Link
              href="/profile"
              className="p-6 bg-white/50 dark:bg-dark-700/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/20 hover:bg-white/70 dark:hover:bg-dark-700/70 transition-all duration-300 hover-lift"
            >
              <div className="w-8 h-8 text-pink-400 mx-auto mb-3 flex items-center justify-center">👤</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Профиль</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">Управление аккаунтом</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
