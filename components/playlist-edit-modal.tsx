"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Image as ImageIcon, X } from "lucide-react"
import type { Playlist } from "@/lib/database"

interface PlaylistEditModalProps {
  playlist: Playlist
  onClose: () => void
  onUpdate: (updatedPlaylist: Playlist) => void
}

export function PlaylistEditModal({ playlist, onClose, onUpdate }: PlaylistEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: playlist.name,
    description: playlist.description || "",
    isPublic: playlist.is_public,
    coverData: playlist.cover_data || "",
    coverType: playlist.cover_type || "",
  })

  const [previewUrl, setPreviewUrl] = useState<string>(
    playlist.cover_data ? `data:${playlist.cover_type};base64,${playlist.cover_data}` : ""
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5MB")
      return
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })

      const [header, data] = base64.split(",")
      const type = header.split(";")[0].split(":")[1]

      setFormData((prev) => ({
        ...prev,
        coverData: data,
        coverType: type,
      }))
      setPreviewUrl(base64)
      setError("")
    } catch (error) {
      setError("Ошибка при загрузке изображения")
    }
  }

  const handleRemoveCover = () => {
    setFormData((prev) => ({
      ...prev,
      coverData: "",
      coverType: "",
    }))
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        onUpdate(data.playlist)
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка при обновлении плейлиста")
      }
    } catch (error) {
      setError("Ошибка при обновлении плейлиста")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: playlist.name,
      description: playlist.description || "",
      isPublic: playlist.is_public,
      coverData: playlist.cover_data || "",
      coverType: playlist.cover_type || "",
    })
    setPreviewUrl(playlist.cover_data ? `data:${playlist.cover_type};base64,${playlist.cover_data}` : "")
    setError("")
    onClose()
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать плейлист</DialogTitle>
          <DialogDescription>Измените информацию о плейлисте</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="name">Название плейлиста *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название плейлиста"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Опишите ваш плейлист"
              disabled={loading}
            />
          </div>

          <div>
            <Label>Обложка плейлиста</Label>
            <div className="mt-2 space-y-3">
              {previewUrl ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={loading}
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-32 h-32 flex flex-col items-center justify-center gap-2 border-dashed"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Выбрать файл</span>
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Рекомендуемый размер: 512x512px. Максимальный размер файла: 5MB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: !!checked })}
              disabled={loading}
            />
            <Label htmlFor="isPublic" className="text-sm">
              Сделать плейлист публичным
            </Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="gradient-primary text-white flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
