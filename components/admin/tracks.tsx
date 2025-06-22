"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Ban, CheckCircle, Loader2, Upload, PlayCircle, Download, Edit, Trash2, ImageIcon } from "lucide-react"
import { TrackUpload } from "./track-upload"

interface AdminTrack {
  id: string
  title: string
  artist_name: string
  album_title?: string
  genre_name?: string
  duration: number
  plays_count: number
  downloads_count: number
  is_active: boolean
  created_at: string
  file_size?: number
  cover_url?: string
  cover_version?: number
  file_url?: string
}

interface EditTrackData {
  id: string
  title: string
  artist_name: string
  album_title?: string
  genre_id?: string
  is_active: boolean
  cover_url?: string
  cover_version?: number
  file_url?: string
}

interface Genre {
  id: string
  name: string
}

interface AdminTracksProps {
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export default function AdminTracks({ onError, onSuccess }: AdminTracksProps) {
  const [tracks, setTracks] = useState<AdminTrack[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [trackSearch, setTrackSearch] = useState("")
  const [genreFilter, setGenreFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalTracks, setTotalTracks] = useState(0)
  const [editTrackId, setEditTrackId] = useState<string | null>(null)
  const [editTrackData, setEditTrackData] = useState<EditTrackData | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchGenres()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTracks()
    }, 500) // Debounce search

    return () => clearTimeout(timer)
  }, [trackSearch, genreFilter, page])

  const fetchTracks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(trackSearch && { search: trackSearch }),
        ...(genreFilter !== 'all' && { genre: genreFilter }),
      })

      const response = await fetch(`/api/admin/tracks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tracks')
      
      const data = await response.json()
      setTracks(data.tracks)
      setTotalTracks(data.total)
    } catch (error) {
      console.error("Error fetching tracks:", error)
      onError("Ошибка при загрузке треков")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      if (response.ok) {
        const data = await response.json()
        setGenres(data.genres)
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
      onError("Ошибка при загрузке жанров")
    }
  }

  const toggleTrackStatus = async (trackId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/tracks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, isActive }),
      })

      if (response.ok) {
        setTracks(tracks.map((track) => (track.id === trackId ? { ...track, is_active: isActive } : track)))
        onSuccess(`Трек ${isActive ? "активирован" : "скрыт"}`)
      } else {
        onError("Ошибка при изменении статуса трека")
      }
    } catch (error) {
      onError("Ошибка при изменении статуса трека")
    }
  }

  const deleteTrack = async (trackId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот трек?")) return

    try {
      const response = await fetch("/api/admin/tracks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (response.ok) {
        setTracks(tracks.filter((track) => track.id !== trackId))
        onSuccess("Трек удален")
      } else {
        onError("Ошибка при удалении трека")
      }
    } catch (error) {
      onError("Ошибка при удалении трека")
    }
  }

  const handleEditTrack = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId)
    if (track) {
      setEditTrackData({
        id: track.id,
        title: track.title,
        artist_name: track.artist_name,
        album_title: track.album_title,
        genre_id: track.genre_name ? genres.find(g => g.name === track.genre_name)?.id : undefined,
        is_active: track.is_active,
        cover_url: track.cover_url,
        cover_version: track.cover_version,
        file_url: track.file_url
      })
      setEditTrackId(trackId)
    }
  }

  const handleSaveTrack = async () => {
    if (!editTrackData) return

    try {
      const response = await fetch("/api/admin/tracks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTrackData),
      })

      if (response.ok) {
        const updatedTrack = await response.json()
        setTracks(tracks.map(track => 
          track.id === updatedTrack.id ? updatedTrack : track
        ))
        onSuccess("Трек успешно обновлен")
        setEditTrackId(null)
        setEditTrackData(null)
      } else {
        onError("Ошибка при обновлении трека")
      }
    } catch (error) {
      onError("Ошибка при обновлении трека")
    }
  }

  const handleCoverUpload = async (file: File) => {
    if (!editTrackData) return
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("trackId", editTrackData.id)

      const response = await fetch("/api/admin/tracks/upload-cover", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setEditTrackData({
          ...editTrackData,
          cover_url: data.cover_url,
          cover_version: data.cover_version
        })
        
        // Обновляем трек в списке
        setTracks(tracks.map(track => 
          track.id === editTrackData.id 
            ? {
                ...track,
                cover_url: data.cover_url,
                cover_version: data.cover_version
              }
            : track
        ))
        
        onSuccess("Обложка успешно обновлена")
      } else {
        onError("Ошибка при загрузке обложки")
      }
    } catch (error) {
      onError("Ошибка при загрузке обложки")
    } finally {
      setUploadingCover(false)
    }
  }

  const handleAudioUpload = async (file: File) => {
    if (!editTrackData) return
    setUploadingAudio(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("trackId", editTrackData.id)

      const response = await fetch("/api/admin/tracks/upload-audio", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setEditTrackData({
          ...editTrackData,
          file_url: data.file_url
        })
        onSuccess("Аудио файл успешно обновлен")
      } else {
        onError("Ошибка при загрузке аудио файла")
      }
    } catch (error) {
      onError("Ошибка при загрузке аудио файла")
    } finally {
      setUploadingAudio(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Управление треками</CardTitle>
            <CardDescription>Список всех загруженных треков</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Поиск треков..."
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все жанры" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все жанры</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowUploadModal(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              Загрузить трек
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Трек
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Статистика
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => (
                  <tr
                    key={track.id}
                    className={`
                      border-b border-gray-100 dark:border-gray-800 
                      hover:bg-gray-50 dark:hover:bg-gray-800/50
                      ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-gray-800/20'}
                    `}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {track.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {track.artist_name} {track.album_title && `• ${track.album_title}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <PlayCircle className="w-4 h-4" />
                          {track.plays_count}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Download className="w-4 h-4" />
                          {track.downloads_count}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          track.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }
                      >
                        {track.is_active ? "Активен" : "Скрыт"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={track.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleTrackStatus(track.id, !track.is_active)}
                        >
                          {track.is_active ? (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Скрыть
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Показать
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTrack(track.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTrack(track.id)}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>

      {/* Модальное окно редактирования трека */}
      <Dialog open={!!editTrackId} onOpenChange={(open) => !open && setEditTrackId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Редактирование трека</DialogTitle>
            <DialogDescription>
              Измените информацию о треке. Вы можете обновить название, исполнителя, альбом, жанр и файлы.
            </DialogDescription>
          </DialogHeader>
          {editTrackData && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название трека</Label>
                    <Input
                      id="title"
                      value={editTrackData.title}
                      onChange={(e) => setEditTrackData({ ...editTrackData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Исполнитель</Label>
                    <Input
                      id="artist"
                      value={editTrackData.artist_name}
                      onChange={(e) => setEditTrackData({ ...editTrackData, artist_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="album">Альбом</Label>
                    <Input
                      id="album"
                      value={editTrackData.album_title || ""}
                      onChange={(e) => setEditTrackData({ ...editTrackData, album_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="genre">Жанр</Label>
                    <Select 
                      value={editTrackData.genre_id || "all"} 
                      onValueChange={(value) => setEditTrackData({ ...editTrackData, genre_id: value === "all" ? undefined : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите жанр" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Без жанра</SelectItem>
                        {genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Загрузка обложки */}
                  <div className="space-y-4">
                    <Label>Обложка трека</Label>
                    <div className="flex items-start gap-4">
                      {editTrackData.cover_url ? (
                        <img 
                          src={`/api/tracks/${editTrackData.id}/cover${editTrackData.cover_version ? `?v=${editTrackData.cover_version}` : ''}`}
                          alt="Cover" 
                          className="w-32 h-32 object-cover rounded-lg"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleCoverUpload(file)
                          }}
                          disabled={uploadingCover}
                        />
                        {uploadingCover && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Загрузка...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Загрузка аудио */}
                  <div className="space-y-4">
                    <Label>Аудио файл</Label>
                    <div className="space-y-2">
                      {editTrackData.file_url && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium">Текущий файл:</p>
                          <p className="text-sm text-gray-500 truncate">{editTrackData.file_url.split('/').pop()}</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleAudioUpload(file)
                        }}
                        disabled={uploadingAudio}
                      />
                      {uploadingAudio && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Загрузка...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditTrackId(null)}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleSaveTrack} 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600"
                  disabled={uploadingCover || uploadingAudio}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showUploadModal && (
        <TrackUpload
          genres={genres}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false)
            fetchTracks()
          }}
        />
      )}
    </Card>
  )
} 