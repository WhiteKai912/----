"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, ImageIcon } from "lucide-react"

interface Genre {
  id: string
  name: string
}

interface TrackUploadProps {
  genres: Genre[]
  onClose: () => void
  onUploadComplete: () => void
}

export function TrackUpload({ genres, onClose, onUploadComplete }: TrackUploadProps) {
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [album, setAlbum] = useState("")
  const [genreId, setGenreId] = useState<string>("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) {
      setError("Пожалуйста, выберите аудио файл")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("artistName", artist)
      if (album) formData.append("albumTitle", album)
      if (genreId) formData.append("genreId", genreId)
      if (coverFile) formData.append("file", coverFile)
      formData.append("audioFile", audioFile)

      const audio = document.createElement("audio")
      audio.src = URL.createObjectURL(audioFile)
      
      await new Promise((resolve) => {
        audio.addEventListener("loadedmetadata", () => {
          formData.append("duration", Math.round(audio.duration).toString())
          URL.revokeObjectURL(audio.src)
          resolve(null)
        })
      })

      const response = await fetch("/api/admin/tracks/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Ошибка при загрузке трека")
      }

      onUploadComplete()
      onClose()
    } catch (error) {
      console.error("Upload error:", error)
      setError("Произошла ошибка при загрузке трека")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Загрузка нового трека</DialogTitle>
          <DialogDescription>
            Заполните информацию о треке и загрузите необходимые файлы
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название трека</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="artist">Исполнитель</Label>
                <Input
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="album">Альбом</Label>
                <Input
                  id="album"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Жанр</Label>
                <Select value={genreId} onValueChange={setGenreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите жанр" />
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
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Обложка трека</Label>
                <div className="flex items-start gap-4">
                  {coverPreview ? (
                    <img 
                      src={coverPreview} 
                      alt="Cover preview" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Аудио файл</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Загрузить трек
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
