"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Heart, TrendingUp, Clock, Loader2, MoreHorizontal, Download } from "lucide-react"
import { useAudio } from "@/components/providers/audio-provider"
import Image from "next/image"
import type { Track } from "@/types/track"
import { AddToPlaylistModal } from "@/components/add-to-playlist-modal"
import { formatDuration } from "@/lib/utils"
import { useDownloadTrack } from "@/hooks/useDownloadTrack"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { useFavorites } from "@/components/providers/favorites-provider"

export function TrendingTracks() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllTracks, setShowAllTracks] = useState(false)
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()
  const { data: session } = useSession() as { data: Session | null }
  const { downloadTrack, isDownloading } = useDownloadTrack()
  const router = useRouter()
  const { isLiked, toggleLike } = useFavorites()

  useEffect(() => {
    fetchTrendingTracks()
  }, [showAllTracks])

  useEffect(() => {
    if (tracks.length) {
      console.log('Треки в топе:', tracks);
    }
  }, [tracks]);

  useEffect(() => {
    if (typeof isLiked === 'function' && tracks.length) {
      const ids = tracks.map(t => t.id)
      console.log('ID треков в топе:', ids)
    }
  }, [tracks, isLiked]);

  const fetchTrendingTracks = async () => {
    try {
      const limit = showAllTracks ? 50 : 5
      const response = await fetch(`/api/tracks/trending?limit=${limit}`)
      const data = await response.json()
      setTracks(data.tracks || [])
    } catch (error) {
      console.error("Error fetching trending tracks:", error)
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  const handlePlayTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      playTrack(track, tracks)
    }
  }

  const handleDownload = (trackId: string) => {
    downloadTrack(trackId)
  }

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id

  if (loading) {
    return (
      <section className="py-16 bg-slate-50 dark:bg-dark-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 sm:py-16 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-slate-50 dark:from-cyan-500/10 dark:via-purple-500/10 dark:to-dark-900 overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center shadow-lg shadow-cyan-400/20 ring-4 ring-white dark:ring-dark-800 flex-shrink-0">
              <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent truncate">В тренде сейчас</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 truncate">Топ {tracks.length} треков недели</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-2 border-cyan-400/50 text-cyan-500 hover:bg-cyan-400 hover:text-white transition-all duration-300 font-medium"
            onClick={() => setShowAllTracks(!showAllTracks)}
          >
            {showAllTracks ? "Показать меньше" : "Посмотреть все"}
          </Button>
        </div>

        <div className="grid gap-3">
          {tracks.map((track, index) => (
            <Card
              key={track.id}
              className={`group hover:scale-[1.01] transition-all duration-300 bg-white dark:bg-dark-800 border-0 shadow-md hover:shadow-xl ${
                isCurrentTrack(track) ? "ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/20" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden w-full">
                  {/* Track Number */}
                  <span className={`hidden sm:block text-lg font-bold min-w-[2rem] flex-shrink-0 ${
                    index < 3 
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" 
                      : "text-gray-400"
                  }`}>
                    #{index + 1}
                  </span>

                  {/* Play Button */}
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <Button
                      size="icon"
                      onClick={() => handlePlayTrack(track)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg transition-all duration-300 ${
                        isCurrentTrack(track) && isPlaying
                          ? "bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/30"
                          : "bg-gradient-to-r from-cyan-400 to-purple-400 hover:shadow-lg hover:shadow-cyan-400/20"
                      } text-white relative z-10`}
                    >
                      {isCurrentTrack(track) && isPlaying ? (
                        <Pause className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>

                  {/* Cover */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={track.cover_url ? `/api/tracks/${track.id}/cover${track.cover_version ? `?v=${track.cover_version}` : ''}` : "/placeholder.svg?height=56&width=56"}
                      alt={track.title}
                      width={56}
                      height={56}
                      className="w-14 h-14 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=56&width=56";
                        e.currentTarget.srcset = "";
                      }}
                    />
                    {isCurrentTrack(track) && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="music-bars scale-[0.35] sm:scale-[0.4]">
                          <div className="music-bar bg-white"></div>
                          <div className="music-bar bg-white"></div>
                          <div className="music-bar bg-white"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0 px-1.5 sm:px-2 overflow-hidden">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate max-w-[120px] xs:max-w-[160px] md:max-w-[220px] lg:max-w-none group-hover:text-cyan-500 transition-colors flex-1 min-w-0">
                        {track.title}
                      </h3>
                      {index < 2 && (
                        <Badge className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          HOT
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 truncate">
                      {track.artist_name} {track.album_title && `• ${track.album_title}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500 flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full">
                      <Play className="w-3.5 h-3.5" />
                      {(track.plays_count || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-dark-700 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(track.duration)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 xs:gap-1 md:gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleLike(track.id)}
                      className="w-8 h-8 xs:w-9 xs:h-9 md:w-10 md:h-10 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                          isLiked(track.id)
                            ? "fill-rose-500 text-rose-500 scale-110"
                            : "text-gray-400 hover:text-rose-400"
                        }`}
                      />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(track.id)}
                      disabled={isDownloading(track.id)}
                      className="w-8 h-8 xs:w-9 xs:h-9 md:w-10 md:h-10 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                    >
                      {isDownloading(track.id) ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-cyan-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-cyan-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
