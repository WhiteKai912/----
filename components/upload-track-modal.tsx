"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface UploadTrackModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export default function UploadTrackModal({ isOpen, onClose, onComplete }: UploadTrackModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      setSelectedFile(file)
      // Попытка извлечь название и исполнителя из имени файла
      const fileName = file.name.replace(/\.[^/.]+$/, "") // Убираем расширение
      const parts = fileName.split(" - ")
      if (parts.length >= 2) {
        setArtist(parts[0].trim())
        setTitle(parts[1].trim())
      } else {
        setTitle(fileName)
      }
    } else {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите аудио файл",
        variant: "destructive"
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title || !artist) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все поля",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("title", title)
    formData.append("artist", artist)

    try {
      const response = await fetch("/api/tracks/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Трек успешно загружен"
        })
        onComplete()
        handleClose()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Ошибка при загрузке")
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при загрузке",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setTitle("")
    setArtist("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Загрузить трек</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Аудио файл</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Выбран файл: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Название трека</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название трека"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="artist">Исполнитель</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Введите имя исполнителя"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile || !title || !artist}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Загрузить
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 