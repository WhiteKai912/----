"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Download, Heart, MoreHorizontal, Loader2, Pause, Grid, List, Clock } from "lucide-react"
import { useAudio } from "@/components/providers/audio-provider"
import { useSession } from "next-auth/react"
import Image from "next/image"
import type { Track } from "@/types/track"
import { AddToPlaylistModal } from "@/components/add-to-playlist-modal"
import { formatDuration } from "@/lib/utils"
import { useDownloadTrack } from "@/hooks/useDownloadTrack"
import { useFavorites } from "@/components/providers/favorites-provider"

interface MusicCatalogProps {
  initialTracks?: Track[]
}

export function MusicCatalog({ initialTracks = [] }: MusicCatalogProps) {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("created_at")
  const [filterGenre, setFilterGenre] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set())

  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()
  const { data: session } = useSession()
  const { downloadTrack, isDownloading } = useDownloadTrack()
  const { isLiked, toggleLike } = useFavorites()

  // Загрузка жанров при монтировании
  useEffect(() => {
    fetchGenres()
  }, [])

  // Загрузка треков при изменении фильтров
  useEffect(() => {
    fetchTracks()
  }, [sortBy, filterGenre, pagination.page])

  useEffect(() => {
    if (tracks.length) {
      console.log('Треки в каталоге:', tracks);
    }
  }, [tracks]);

  useEffect(() => {
    if (typeof isLiked === 'function' && tracks.length) {
      const ids = tracks.map(t => t.id)
      console.log('ID треков в каталоге:', ids)
    }
  }, [tracks, isLiked]);

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      const data = await response.json()
      if (data.genres) {
      setGenres(data.genres)
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const fetchTracks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        ...(filterGenre !== "all" && { genre: filterGenre }),
      })

      const response = await fetch(`/api/tracks?${params}`)
      const data = await response.json()

      if (data.tracks) {
      setTracks(data.tracks)
      }
      if (data.pagination) {
      setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching tracks:", error)
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

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterGenre} onValueChange={setFilterGenre}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
              <SelectValue placeholder="Выберите жанр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все жанры</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.name}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">По популярности</SelectItem>
              <SelectItem value="newest">По новизне</SelectItem>
              <SelectItem value="alphabetical">По алфавиту</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1">
            <Button
              size="icon"
              variant={viewMode === "grid" ? "default" : "ghost"}
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-cyan-400 text-white hover:bg-cyan-500" : ""}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-cyan-400 text-white hover:bg-cyan-500" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Найдено треков: {pagination.total}
          </div>
        </div>
      </div>

      {/* Tracks Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className={`group hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover-lift ${
                isCurrentTrack(track) ? "ring-2 ring-cyan-400 shadow-cyan-400/20" : ""
              }`}
            >
              <CardContent className="p-2 xs:p-3 sm:p-4">
                {/* Album Cover */}
                <div className="relative mb-4">
                  <Image
                    src={track.cover_url ? `/api/tracks/${track.id}/cover${track.cover_version ? `?v=${track.cover_version}` : ''}` : "/placeholder.svg?height=200&width=200"}
                    alt={`${track.album_title || track.title} cover`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=200&width=200";
                      e.currentTarget.srcset = "";
                    }}
                  />

                  {/* Overlay with Play Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    <Button
                      size="icon"
                      className={`w-12 h-12 rounded-full transition-all duration-300 ${
                        isCurrentTrack(track) && isPlaying
                          ? "bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/30"
                          : "bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/30"
                      } text-white`}
                      onClick={() => handlePlayTrack(track)}
                    >
                      {isCurrentTrack(track) && isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 fill-current" />
                      )}
                    </Button>
                  </div>

                  {/* Currently Playing Indicator */}
                  {isCurrentTrack(track) && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        {isPlaying ? (
                          <>
                            <div className="music-bars scale-50">
                              <div className="music-bar bg-white"></div>
                              <div className="music-bar bg-white"></div>
                              <div className="music-bar bg-white"></div>
                            </div>
                            Играет
                          </>
                        ) : (
                          "На паузе"
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="space-y-1 xs:space-y-2">
                  <h3 className="font-semibold text-base xs:text-base sm:text-lg text-gray-900 dark:text-white truncate group-hover:text-cyan-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs xs:text-sm sm:text-sm text-gray-600 dark:text-slate-400 truncate">
                    {track.artist_name} {track.album_title && `• ${track.album_title}`}
                  </p>
                </div>

                {/* Track Actions */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleLike(track.id)}
                      className={`w-8 h-8 transition-all duration-300 ${
                        isLiked(track.id)
                          ? "bg-rose-100 dark:bg-rose-900/20 hover:bg-rose-200 dark:hover:bg-rose-900/30"
                          : "hover:bg-rose-100 dark:hover:bg-rose-900/20"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all duration-300 ${
                          isLiked(track.id)
                            ? "fill-rose-500 text-rose-500 scale-110"
                            : "text-gray-400 hover:text-rose-400"
                        }`}
                      />
                    </Button>

                    <AddToPlaylistModal trackId={track.id}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </Button>
                    </AddToPlaylistModal>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(track.id)}
                      className="w-8 h-8 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 transition-all duration-300"
                      disabled={downloadingTracks.has(track.id)}
                    >
                      <Download
                        className={`w-4 h-4 ${
                          downloadingTracks.has(track.id)
                            ? "text-cyan-400 animate-bounce"
                            : "text-gray-400 hover:text-cyan-400"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className={`group hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors ${
                isCurrentTrack(track) ? "ring-2 ring-cyan-400" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Play Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handlePlayTrack(track)}
                    className={`w-12 h-12 rounded-xl transition-all duration-300 ${
                      isCurrentTrack(track) && isPlaying
                        ? "bg-rose-500 hover:bg-rose-400 text-white"
                        : "bg-cyan-400/10 hover:bg-cyan-400 hover:text-white"
                    }`}
                  >
                    {isCurrentTrack(track) && isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </Button>

                  {/* Cover */}
                  <div className="relative flex-shrink-0">
                    <Image
                      src={track.cover_url ? `/api/tracks/${track.id}/cover${track.cover_version ? `?v=${track.cover_version}` : ''}` : "/placeholder.svg?height=56&width=56"}
                      alt={track.title}
                      width={56}
                      height={56}
                      className="rounded-xl shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=56&width=56";
                        e.currentTarget.srcset = "";
                      }}
                    />
                    {isCurrentTrack(track) && isPlaying && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <div className="music-bars scale-50">
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
                  <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500">
                    <Clock className="w-4 h-4" />
                    {formatDuration(track.duration)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleLike(track.id)}
                      className={`w-8 h-8 transition-all duration-300 ${
                        isLiked(track.id)
                          ? "bg-rose-100 dark:bg-rose-900/20 hover:bg-rose-200 dark:hover:bg-rose-900/30"
                          : "hover:bg-rose-100 dark:hover:bg-rose-900/20"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all duration-300 ${
                          isLiked(track.id)
                            ? "fill-rose-500 text-rose-500 scale-110"
                            : "text-gray-400 hover:text-rose-400"
                        }`}
                      />
                    </Button>

                    <AddToPlaylistModal trackId={track.id}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </Button>
                    </AddToPlaylistModal>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(track.id)}
                      className="w-8 h-8 hover:bg-cyan-100 dark:hover:bg-cyan-900/20"
                      disabled={downloadingTracks.has(track.id)}
                    >
                      <Download
                        className={`w-4 h-4 ${
                          downloadingTracks.has(track.id)
                            ? "text-cyan-400 animate-bounce"
                            : "text-gray-400 hover:text-cyan-400"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="border-slate-200 dark:border-gray-700"
          >
            Предыдущая
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={
                    pageNum === pagination.page
                      ? "bg-cyan-400 hover:bg-cyan-300"
                      : "border-slate-200 dark:border-gray-700"
                  }
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="border-slate-200 dark:border-gray-700"
          >
            Следующая
          </Button>
        </div>
      )}

      {/* No Results */}
      {!loading && tracks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Треки не найдены</h3>
          <p className="text-gray-600 dark:text-slate-400">Попробуйте изменить фильтры или поисковый запрос</p>
        </div>
      )}
    </div>
  )
}
