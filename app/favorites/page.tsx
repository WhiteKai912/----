"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, Heart, Download, Music, Clock, Loader2, ArrowLeft } from "lucide-react"
import { useAudio, AudioProvider } from "@/components/providers/audio-provider"
import { AdaptivePlayer } from "@/components/adaptive-player"
import Image from "next/image"
import type { Track } from "@/lib/database"
import type { CustomSession } from "@/types/session"
import { useDownloadTrack } from "@/hooks/useDownloadTrack"

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set())

  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()
  const { downloadTrack, isDownloading } = useDownloadTrack()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      console.log("Session in FavoritesPage:", { 
        status, 
        userId: (session as unknown as CustomSession)?.user?.id,
        userEmail: (session as unknown as CustomSession)?.user?.email ? "[REDACTED]" : null,
        hasSession: !!session 
      })
      fetchFavorites()
    }
  }, [status, router])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching favorites - start")
      
      const response = await fetch("/api/user/favorites")
      console.log("Fetch response status:", response.status)

        const data = await response.json()
      console.log("Response data:", {
        ok: response.ok,
        status: response.status,
        error: data.error,
        favoritesCount: data.favorites?.length || 0
      })

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке избранного")
      }

      setFavorites(data.favorites || [])
      console.log("Favorites loaded successfully:", data.favorites?.length || 0, "tracks")
    } catch (error) {
      console.error("Error fetching favorites:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке избранного")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      playTrack(track, favorites)
    }
  }

  const handleRemoveFromFavorites = async (trackId: string) => {
    try {
      setError("")
      const response = await fetch("/api/user/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении из избранного")
      }

        setFavorites(favorites.filter((track) => track.id !== trackId))
        setSuccess("Трек удален из избранного")
    } catch (error) {
      console.error("Error removing from favorites:", error)
      setError(error instanceof Error ? error.message : "Ошибка при удалении из избранного")
    }
  }

  const handleDownload = (trackId: string) => {
    downloadTrack(trackId)
  }

  // Исправим функцию formatDuration для корректного отображения времени
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Войдите в аккаунт</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-6">
              Для просмотра избранных треков необходимо войти в систему
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="gradient-primary text-white">
                <Link href="/auth/login">Войти</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Регистрация</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20 pb-32">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100 dark:hover:bg-gray-800">
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Избранное</h1>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-slate-400 ml-14">Ваши любимые треки в одном месте</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Favorites List */}
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Нет избранных треков</h3>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Добавьте треки в избранное, чтобы они появились здесь
                </p>
                <Button asChild className="gradient-primary text-white">
                  <Link href="/">Найти музыку</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-slate-400 mb-6">
                <div className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {favorites.length} треков
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.floor(favorites.reduce((total, track) => total + track.duration, 0) / 60)} минут
                </div>
              </div>

              {/* Play All Button */}
              <div className="mb-6">
                <Button
                  onClick={() => favorites.length > 0 && playTrack(favorites[0], favorites)}
                  className="gradient-primary text-white"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Воспроизвести все
                </Button>
              </div>

              {/* Tracks List */}
              {favorites.map((track, index) => (
                <Card
                  key={track.id}
                  className={`group hover-lift bg-white dark:bg-dark-700 ${
                    isCurrentTrack(track) ? "ring-2 ring-cyan-400 shadow-cyan-400/20" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Track Number */}
                      <div className="w-8 text-center">
                        <span className="text-sm text-gray-500 dark:text-slate-500">{index + 1}</span>
                      </div>

                      {/* Play Button */}
                      <Button
                        size="icon"
                        onClick={() => handlePlayTrack(track)}
                        className={`w-10 h-10 rounded-full transition-all duration-300 ${
                          isCurrentTrack(track) && isPlaying
                            ? "bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/30"
                            : "gradient-primary hover:scale-110 shadow-lg shadow-cyan-500/30"
                        } text-white`}
                      >
                        {isCurrentTrack(track) && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Cover */}
                      <div className="relative flex-shrink-0">
                        <Image
                          src={track.cover_url ? `/api/tracks/${track.id}/cover${track.cover_version ? `?v=${track.cover_version}` : ''}` : "/placeholder.svg?height=60&width=60"}
                          alt={track.title}
                          width={60}
                          height={60}
                          className="w-[60px] h-[60px] object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=60&width=60";
                            e.currentTarget.srcset = "";
                          }}
                        />
                        {isCurrentTrack(track) && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                            <div className="music-bars scale-75">
                              <div className="music-bar bg-white"></div>
                              <div className="music-bar bg-white"></div>
                              <div className="music-bar bg-white"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-cyan-400 transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                          {track.artist_name} {track.album_title && `• ${track.album_title}`}
                        </p>
                        {track.genre_name && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {track.genre_name}
                          </Badge>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="hidden md:block text-sm text-gray-500 dark:text-slate-500">
                        {formatDuration(track.duration)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveFromFavorites(track.id)}
                          className="w-10 h-10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all duration-300"
                        >
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500 scale-110" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(track.id)}
                          disabled={downloadingTracks.has(track.id)}
                          className="w-10 h-10 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 transition-all duration-300"
                        >
                          {downloadingTracks.has(track.id) ? (
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                          ) : (
                            <Download className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <AdaptivePlayer />
    </>
  )
}
