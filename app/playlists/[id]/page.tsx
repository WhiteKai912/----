"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, Heart, Download, Music, Loader2, Globe, Lock, Edit, Trash2, ArrowLeft, Users, GripVertical } from "lucide-react"
import { useAudio } from "@/components/providers/audio-provider"
import { AdaptivePlayer } from "@/components/adaptive-player"
import Image from "next/image"
import type { Track } from "@/lib/database"
import { PlaylistCover } from "@/components/playlist-cover"
import { EditPlaylistDialog } from "@/components/playlist/edit-playlist-dialog"
import { DeletePlaylistDialog } from "@/components/playlist/delete-playlist-dialog"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { cn } from "@/lib/utils"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"

interface PlaylistTrack extends Track {}

interface Playlist {
  id: string
  name: string
  description: string | null
  is_public: boolean
  user_id: string
  user_name?: string
  tracks_count?: number
  total_duration?: number
  created_at: string
  updated_at: string
  cover_data?: string | null
  cover_type?: string | null
  tracks?: PlaylistTrack[]
}

interface ExtendedSession {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

interface PlaylistPageProps {
  params: Promise<{ id: string }>
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const { id: playlistId } = use(params)
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string }
  const router = useRouter()
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()

  useEffect(() => {
    if (status === "loading") return
    fetchPlaylistData()
  }, [playlistId, status])

  const fetchPlaylistData = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching playlist:", playlistId)
      const [playlistRes, tracksRes] = await Promise.all([
        fetch(`/api/playlists/${playlistId}`),
        fetch(`/api/playlists/${playlistId}/tracks`),
      ])

      if (!playlistRes.ok) {
        const error = await playlistRes.json()
        setError(error.error || "Плейлист не найден")
        return
      }

      const playlistData = await playlistRes.json()
      console.log("Playlist data:", playlistData)

      if (tracksRes.ok) {
        const tracksData = await tracksRes.json()
        console.log("Tracks data:", tracksData)
        setTracks(tracksData.tracks)
        setPlaylist({
          ...playlistData.playlist,
          tracks: tracksData.tracks
        })
      } else {
        setPlaylist(playlistData.playlist)
      }
    } catch (error) {
      console.error("Error fetching playlist data:", error)
      setError("Ошибка при загрузке плейлиста")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayTrack = (track: PlaylistTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause()
    } else {
      playTrack(track, tracks)
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist || playlist.user_id !== session?.user?.id) return

    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId }),
      })

      if (response.ok) {
        setTracks(tracks.filter((track) => track.id !== trackId))
        setSuccess("Трек удален из плейлиста")
      } else {
        setError("Ошибка при удалении трека")
      }
    } catch (error) {
      console.error("Error removing track:", error)
      setError("Ошибка при удалении трека")
    }
  }

  const handleDownload = async (trackId: string) => {
    try {
      const response = await fetch(`/api/tracks/${trackId}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
      })

      const data = await response.json()
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank")
      }
    } catch (error) {
      console.error("Error downloading track:", error)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isCurrentTrack = (track: PlaylistTrack) => currentTrack?.id === track.id
  const isOwner = playlist?.user_id === session?.user?.id

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !isOwner) return

    const items = Array.from(tracks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setTracks(items)

    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trackId: result.draggableId,
          newPosition: result.destination.index,
        }),
      })

      if (!response.ok) {
        setError("Ошибка при изменении порядка треков")
        fetchPlaylistData() // Восстанавливаем исходный порядок
      }
    } catch (error) {
      console.error("Error reordering tracks:", error)
      setError("Ошибка при изменении порядка треков")
      fetchPlaylistData() // Восстанавливаем исходный порядок
    }
  }

  if (loading) {
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

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Плейлист не найден</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-6">{error}</p>
            <Button asChild className="gradient-primary text-white">
              <Link href="/playlists">Вернуться к плейлистам</Link>
            </Button>
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
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild className="hover:bg-gray-100 dark:hover:bg-gray-800">
              <Link href="/playlists">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
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

          {/* Playlist Header */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Cover */}
            <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-slate-100 dark:to-dark-700 rounded-2xl overflow-hidden">
              <PlaylistCover playlist={playlist} size="lg" className="w-full h-full" />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-400/20 text-green-600 dark:bg-green-400/30 dark:text-green-300">
                  <Globe className="w-3 h-3 mr-1" />
                  Публичный
                </Badge>
                <Badge variant="secondary">
                  <Music className="w-3 h-3 mr-1" />
                  {playlist.tracks_count || 0} треков
                </Badge>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-gray-600 dark:text-slate-400">
                    {playlist.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-400 to-cyan-400 text-white hover:shadow-lg hover:shadow-purple-400/20 transition-all duration-300"
                  onClick={() => tracks.length > 0 && handlePlayTrack(tracks[0])}
                  disabled={tracks.length === 0}
                >
                  {isPlaying && currentTrack?.id === tracks[0]?.id ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Пауза
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Слушать
                    </>
                  )}
                </Button>

                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <EditPlaylistDialog
                        playlist={playlist}
                        onUpdate={fetchPlaylistData}
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                      />
                    </Dialog>
                    <DeletePlaylistDialog
                      playlistId={playlist.id}
                      playlistName={playlist.name}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {playlist.user_name || "Неизвестен"}
                </div>
                <span>•</span>
                <div>
                  Создан {formatDate(playlist.created_at)}
                </div>
                {playlist.updated_at !== playlist.created_at && (
                  <>
                    <span>•</span>
                    <div>
                      Обновлен {formatDate(playlist.updated_at)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tracks List */}
          <div className="space-y-4">
            {tracks.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-dark-800 rounded-2xl">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Плейлист пуст
                </h3>
                <p className="text-gray-600 dark:text-slate-400">
                  В этом плейлисте пока нет треков
                </p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tracks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-white dark:bg-dark-800 rounded-2xl overflow-hidden"
                    >
                      {tracks.map((track, index) => (
                        <Draggable
                          key={track.id}
                          draggableId={track.id}
                          index={index}
                          isDragDisabled={!isOwner}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors",
                                isCurrentTrack(track) ? "bg-purple-50 dark:bg-purple-900/20" : "",
                                snapshot.isDragging ? "bg-gray-100 dark:bg-dark-600" : ""
                              )}
                            >
                              {isOwner && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                              )}

                              <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-slate-100 dark:to-dark-700" />
                                {track.cover_url ? (
                                  <Image
                                    src={track.cover_url}
                                    alt={track.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Music className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <button
                                  onClick={() => handlePlayTrack(track)}
                                  className={cn(
                                    "absolute inset-0 flex items-center justify-center bg-black/40",
                                    isCurrentTrack(track) ? "opacity-100" : "opacity-0 hover:opacity-100",
                                    "transition-opacity"
                                  )}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    "bg-white text-purple-600 shadow-lg",
                                    "transform transition-transform",
                                    "hover:scale-110 active:scale-95"
                                  )}>
                                    {isCurrentTrack(track) && isPlaying ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                  </div>
                                </button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                  {track.title}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-slate-400 truncate">
                                  {track.artist_name}
                                </div>
                              </div>

                              <div className="text-sm text-gray-600 dark:text-slate-400">
                                {formatDuration(track.duration)}
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                                  onClick={() => handleDownload(track.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {isOwner && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => handleRemoveTrack(track.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
      <AdaptivePlayer />
    </>
  )
}
