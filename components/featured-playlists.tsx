"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Music, Clock, Users, Globe, Loader2, ListMusic } from "lucide-react"
import Link from "next/link"
import type { Playlist } from "@/lib/database"
import { PlaylistCover } from "@/components/playlist-cover"

export function FeaturedPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedPlaylists()
  }, [])

  const fetchFeaturedPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists/featured", {
        headers: {
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        }
      })
      if (!response.ok) {
        throw new Error("Ошибка при загрузке плейлистов")
      }
      
      const data = await response.json()
      console.log("Featured playlists response:", {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data
      })
      
      // Если playlists не определен, используем пустой массив
      setPlaylists(data.playlists || [])
      setError(null)
    } catch (error) {
      console.error("Error fetching featured playlists:", error)
      setError("Не удалось загрузить плейлисты")
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-slate-50 dark:from-purple-500/10 dark:via-cyan-500/10 dark:to-dark-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-slate-50 dark:from-purple-500/10 dark:via-cyan-500/10 dark:to-dark-900">
        <div className="container mx-auto px-4">
          <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-400 flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Ошибка загрузки</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            <Button 
              onClick={() => {
                setLoading(true)
                setError(null)
                fetchFeaturedPlaylists()
              }}
              className="bg-gradient-to-r from-purple-400 to-cyan-400 text-white hover:shadow-lg hover:shadow-purple-400/20 transition-all duration-300"
            >
              Попробовать снова
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-500/5 via-cyan-500/5 to-slate-50 dark:from-purple-500/10 dark:via-cyan-500/10 dark:to-dark-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12 gap-4 md:gap-0">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-400/20 ring-4 ring-white dark:ring-dark-800">
                <ListMusic className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  Популярные плейлисты
                </h2>
                <p className="text-gray-600 dark:text-slate-400">
                  Откройте для себя лучшие музыкальные коллекции
                </p>
              </div>
            </div>
            <div className="block md:hidden mt-2">
              <Button
                variant="outline"
                className="w-full border-2 border-purple-400/50 text-purple-500 hover:bg-purple-400 hover:text-white transition-all duration-300 font-medium"
                asChild
              >
                <Link href="/playlists">Посмотреть все</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <Button
              variant="outline"
              className="border-2 border-purple-400/50 text-purple-500 hover:bg-purple-400 hover:text-white transition-all duration-300 font-medium"
              asChild
            >
              <Link href="/playlists">Посмотреть все</Link>
            </Button>
          </div>
        </div>

        {(!playlists || playlists.length === 0) ? (
          <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Пока нет плейлистов</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">Станьте первым, кто создаст публичный плейлист!</p>
            <Button asChild className="bg-gradient-to-r from-purple-400 to-cyan-400 text-white hover:shadow-lg hover:shadow-purple-400/20 transition-all duration-300">
              <Link href="/playlists">Создать плейлист</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="group hover:scale-[1.02] transition-all duration-300 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl">
                <CardContent className="p-0">
                  <Link href={`/playlists/${playlist.id}`}>
                    <div className="relative">
                      {/* Cover */}
                      <div className="aspect-square bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-slate-100 dark:to-dark-700">
                        <PlaylistCover playlist={playlist} size="lg" className="w-full h-full rounded-none" />
                      </div>

                      {/* Play Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center">
                        <Button
                          size="icon"
                          className="w-16 h-16 rounded-full bg-white/90 text-purple-500 hover:scale-110 hover:bg-white transition-all duration-300 shadow-xl"
                        >
                          <Play className="w-8 h-8 fill-current ml-1" />
                        </Button>
                      </div>

                      {/* Public Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-400/20 text-green-600 dark:bg-green-400/30 dark:text-green-300 backdrop-blur-sm">
                          <Globe className="w-3 h-3 mr-1" />
                          Публичный
                        </Badge>
                      </div>
                    </div>

                    {/* Playlist Info */}
                    <div className="p-6">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-purple-500 transition-colors">
                        {playlist.name}
                      </h3>
                      {playlist.description && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-500">
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full">
                          <Music className="w-3 h-3" />
                          {Number(playlist.tracks_count) || 0}
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {playlist.total_duration ? formatDuration(Number(playlist.total_duration)) : "0м"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-500 mt-3 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full w-fit">
                        <Users className="w-3 h-3" />
                        {playlist.user_name || "Неизвестен"}
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
