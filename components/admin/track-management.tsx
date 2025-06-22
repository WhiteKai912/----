"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, MoreVertical, Loader2, BarChart2 } from "lucide-react"
import { formatDuration, formatBytes } from "@/lib/utils"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface EditTrackData {
  id: string
  title: string
  artist_name?: string
  album_title?: string
  genre_ids?: string[]
  is_active?: boolean
  cover_url?: string
  file_url?: string
  duration?: number
  file_size?: number
  plays_count?: number
  downloads_count?: number
}

interface TrackStats {
  totalPlays: number
  totalDownloads: number
  inPlaylists: number
  inFavorites: number
  weeklyStats: Array<{
    date: string
    plays: number
    downloads: number
  }>
}

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
  file_url: string
}

export function TrackManagement() {
  const [tracks, setTracks] = useState<AdminTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("adminTrackSearch") || ""
    }
    return ""
  })
  const [deleteTrack, setDeleteTrack] = useState<string | null>(null)
  const [editTrack, setEditTrack] = useState<EditTrackData | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminEditTrack")
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const [showStats, setShowStats] = useState<AdminTrack | null>(null)
  const [trackStats, setTrackStats] = useState<TrackStats | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminTrackStats")
      return saved ? JSON.parse(saved) : null
    }
    return null
  })
  const [activeTab, setActiveTab] = useState<"info" | "stats">("info")
  const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [audioUploadType, setAudioUploadType] = useState<"file" | "url">("file")
  const [coverUploadType, setCoverUploadType] = useState<"file" | "url">("file")

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminTrackSearch", searchQuery)
    }
  }, [searchQuery])

  useEffect(() => {
    if (typeof window !== "undefined" && editTrack) {
      localStorage.setItem("adminEditTrack", JSON.stringify(editTrack))
    }
  }, [editTrack])

  useEffect(() => {
    if (typeof window !== "undefined" && trackStats) {
      localStorage.setItem("adminTrackStats", JSON.stringify(trackStats))
    }
  }, [trackStats])

  const handleCloseDialog = () => {
    setEditTrack(null)
    setTrackStats(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminEditTrack")
      localStorage.removeItem("adminTrackStats")
    }
  }

  const handleCloseStats = () => {
    setShowStats(null)
    setTrackStats(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminTrackStats")
    }
  }

  useEffect(() => {
    fetchTracks()
    fetchGenres()
  }, [])

  const fetchTracks = async () => {
    try {
      const response = await fetch("/api/admin/tracks")
      const data = await response.json()
      if (response.ok) {
        setTracks(data.tracks)
      } else {
        setError(data.error || "Ошибка при загрузке треков")
      }
    } catch (error) {
      setError("Ошибка при загрузке треков")
    } finally {
      setLoading(false)
    }
  }

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/genres")
      const data = await response.json()
      if (response.ok) {
        setGenres(data.genres)
      } else {
        console.error("Error fetching genres:", data.error)
      }
    } catch (error) {
      console.error("Error fetching genres:", error)
    }
  }

  const handleDeleteTrack = async () => {
    if (!deleteTrack) return

    try {
      const response = await fetch(`/api/admin/tracks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackId: deleteTrack }),
      })

      const data = await response.json()

      if (response.ok) {
        setTracks(tracks.filter(track => track.id !== deleteTrack))
        setDeleteTrack(null)
        setSuccess("Трек успешно удален")
        setError("")
      } else {
        setError(data.error || "Ошибка при удалении трека")
      }
    } catch (error) {
      setError("Ошибка при удалении трека")
    }
  }

  const handleEditClick = (track: AdminTrack) => {
    setAudioUploadType(track.file_url ? "url" : "file")
    setCoverUploadType(track.cover_url ? "url" : "file")
    setEditTrack({
      id: track.id,
      title: track.title,
      artist_name: track.artist_name,
      album_title: track.album_title,
      is_active: track.is_active,
      cover_url: track.cover_url || "",
      file_url: track.file_url,
      duration: track.duration,
      file_size: track.file_size,
      plays_count: track.plays_count,
      downloads_count: track.downloads_count,
    })
  }

  const handleStatsClick = (track: AdminTrack) => {
    setShowStats(track)
    // Загружаем статистику трека
    fetch(`/api/tracks/${track.id}/stats`)
      .then((response) => response.json())
      .then((stats) => setTrackStats(stats))
      .catch((error) => console.error("Error fetching track stats:", error))
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })
      
      const data = await response.json()
      if (response.ok && editTrack) {
        setEditTrack({
          ...editTrack,
          cover_url: data.url,
        })
      } else {
        setError("Ошибка при загрузке изображения")
      }
    } catch (error) {
      setError("Ошибка при загрузке изображения")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      })
      
      const data = await response.json()
      if (response.ok && editTrack) {
        setEditTrack({
          ...editTrack,
          file_url: data.url,
        })
      } else {
        setError("Ошибка при загрузке аудио")
      }
    } catch (error) {
      setError("Ошибка при загрузке аудио")
    } finally {
      setUploadingAudio(false)
    }
  }

  const handleSaveTrack = async () => {
    if (!editTrack) return
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/tracks/${editTrack.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTrack.title.trim(),
          artist_name: editTrack.artist_name?.trim(),
          album_title: editTrack.album_title?.trim(),
          genre_ids: editTrack.genre_ids,
          is_active: editTrack.is_active,
          cover_url: editTrack.cover_url,
          file_url: editTrack.file_url,
          duration: editTrack.duration,
          file_size: editTrack.file_size
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTracks(tracks.map(track => 
          track.id === editTrack.id 
            ? {
                ...track,
                ...data.track,
                title: data.track.title,
                artist_name: data.track.artist_name,
                album_title: data.track.album_title,
                cover_url: data.track.cover_url,
                file_url: data.track.file_url,
                duration: data.track.duration,
                file_size: data.track.file_size,
                is_active: data.track.is_active,
                plays_count: data.track.plays_count,
                downloads_count: data.track.downloads_count
              }
            : track
        ))
        setEditTrack(null)
        setTrackStats(null)
        setSuccess("Трек успешно обновлен")
      } else {
        setError(data.error || "Ошибка при обновлении трека")
      }
    } catch (error) {
      setError("Ошибка при обновлении трека")
    } finally {
      setLoading(false)
    }
  }

  const filteredTracks = tracks.filter(track => 
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление треками</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md">
            {success}
          </div>
        )}
        <div className="mb-4">
          <Input
            placeholder="Поиск по названию или исполнителю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>Альбом</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Прослушивания</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTracks.map((track) => (
                <TableRow key={track.id}>
                  <TableCell className="font-medium">{track.title}</TableCell>
                  <TableCell>{track.artist_name}</TableCell>
                  <TableCell>{track.album_title || "-"}</TableCell>
                  <TableCell>{formatDuration(track.duration)}</TableCell>
                  <TableCell>{track.plays_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleStatsClick(track)}
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onSelect={() => handleEditClick(track)}
                          >
                            <Pencil className="w-4 h-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 text-red-600"
                            onClick={() => setDeleteTrack(track.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Edit Track Dialog */}
        <Dialog open={!!editTrack} onOpenChange={(open) => { 
          if (!open) handleCloseDialog()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактирование трека</DialogTitle>
              <DialogDescription>
                Измените информацию о треке или загрузите новые файлы
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    value={editTrack?.title || ""}
                    onChange={(e) => setEditTrack(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artist">Исполнитель</Label>
                  <Input
                    id="artist"
                    value={editTrack?.artist_name || ""}
                    onChange={(e) => setEditTrack(prev => prev ? { ...prev, artist_name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="album">Альбом</Label>
                  <Input
                    id="album"
                    value={editTrack?.album_title || ""}
                    onChange={(e) => setEditTrack(prev => prev ? { ...prev, album_title: e.target.value } : null)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Аудио файл</Label>
                  <RadioGroup 
                    value={audioUploadType}
                    onValueChange={(value: "file" | "url") => {
                      setAudioUploadType(value);
                      if (value === "file") {
                        setEditTrack(prev => prev ? { ...prev, file_url: "" } : null);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="file" id="audio-file" />
                      <Label htmlFor="audio-file">Загрузить файл</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="url" id="audio-url" />
                      <Label htmlFor="audio-url">Указать ссылку</Label>
                    </div>
                  </RadioGroup>

                  {audioUploadType === "url" ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="URL аудио файла"
                        value={editTrack?.file_url || ""}
                        onChange={(e) => setEditTrack(prev => prev ? { ...prev, file_url: e.target.value } : null)}
                      />
                      <div className="text-sm text-gray-500">
                        {editTrack?.file_url ? `Текущий файл: ${editTrack.file_url.split("/").pop()}` : 'Файл не выбран'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleAudioUpload(file)
                          }
                        }}
                        disabled={uploadingAudio}
                      />
                      {uploadingAudio && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Загрузка...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Обложка</Label>
                  <RadioGroup 
                    value={coverUploadType}
                    onValueChange={(value: "file" | "url") => {
                      setCoverUploadType(value);
                      if (value === "file") {
                        setEditTrack(prev => prev ? { ...prev, cover_url: "" } : null);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="file" id="cover-file" />
                      <Label htmlFor="cover-file">Загрузить файл</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="url" id="cover-url" />
                      <Label htmlFor="cover-url">Указать ссылку</Label>
                    </div>
                  </RadioGroup>

                  {coverUploadType === "url" ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="URL обложки"
                        value={editTrack?.cover_url || ""}
                        onChange={(e) => setEditTrack(prev => prev ? { ...prev, cover_url: e.target.value } : null)}
                      />
                      <div className="flex items-center gap-4">
                        {editTrack?.cover_url && (
                          <img 
                            src={editTrack.cover_url} 
                            alt="Preview" 
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              img.src = "/placeholder.svg"
                            }}
                          />
                        )}
                        <span className="text-sm text-gray-500">
                          {editTrack?.cover_url ? editTrack.cover_url.split("/").pop() : 'Обложка не выбрана'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Загрузка...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Жанры</Label>
                  <Select
                    value={editTrack?.genre_ids?.join(",") || ""}
                    onValueChange={(value) => setEditTrack(prev => prev ? { 
                      ...prev, 
                      genre_ids: value ? value.split(",") : [] 
                    } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите жанры" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={editTrack?.is_active}
                    onCheckedChange={(checked) => 
                      setEditTrack(prev => prev ? { ...prev, is_active: !!checked } : null)
                    }
                  />
                  <Label htmlFor="is_active">Активный трек</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Отмена
              </Button>
              <Button onClick={handleSaveTrack} disabled={loading || uploadingAudio || uploadingImage}>
                {(loading || uploadingAudio || uploadingImage) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Track Stats Dialog */}
        <Dialog open={!!showStats} onOpenChange={(open) => {
          if (!open) handleCloseStats()
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Статистика трека</DialogTitle>
              <DialogDescription>
                {showStats ? `${showStats.title} - ${showStats.artist_name}` : 'Загрузка...'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {trackStats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trackStats.totalPlays}</div>
                          <p className="text-sm text-gray-500">Прослушиваний</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trackStats.totalDownloads}</div>
                          <p className="text-sm text-gray-500">Скачиваний</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trackStats.inPlaylists}</div>
                          <p className="text-sm text-gray-500">В плейлистах</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trackStats.inFavorites}</div>
                          <p className="text-sm text-gray-500">В избранном</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Активность за неделю</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] w-full">
                        <div className="space-y-2">
                          {trackStats.weeklyStats.map((stat) => (
                            <div key={stat.date} className="flex items-center justify-between text-sm">
                              <span>{new Date(stat.date).toLocaleDateString()}</span>
                              <div className="flex items-center gap-4">
                                <span>👂 {stat.plays}</span>
                                <span>⬇️ {stat.downloads}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseStats}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Track Dialog */}
        <AlertDialog open={!!deleteTrack} onOpenChange={() => setDeleteTrack(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить трек?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Трек будет удален из базы данных и всех плейлистов.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTrack}
                className="bg-red-600 hover:bg-red-500"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
} 