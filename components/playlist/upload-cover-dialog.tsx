import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePlus, Loader2, X } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface UploadCoverDialogProps {
  playlistId: string
  onUpload: (coverUrl: string) => void
}

export function UploadCoverDialog({ playlistId, onUpload }: UploadCoverDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение")
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError("")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch(`/api/playlists/${playlistId}/cover`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Ошибка при загрузке обложки")
      }

      const data = await response.json()
      onUpload(data.cover_url)
      setIsOpen(false)
    } catch (error) {
      console.error("Error uploading cover:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке обложки")
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setError("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="active:scale-95 transition-transform"
          >
            <ImagePlus className="w-4 h-4" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Загрузить обложку
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Выберите изображение для обложки плейлиста. Рекомендуемый размер: 512x512 пикселей.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="cover" className="text-sm font-medium">
              Изображение
            </Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                dragOver
                  ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                  : "border-gray-200 dark:border-gray-800"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <Label
                htmlFor="cover"
                className="flex flex-col items-center gap-2 cursor-pointer text-center"
              >
                <ImagePlus className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Перетащите изображение сюда или нажмите для выбора
                </span>
              </Label>
            </div>
          </div>

          <AnimatePresence>
            {previewUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative"
              >
                <div className="relative aspect-square w-full max-w-[256px] mx-auto rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
            className="w-full sm:w-auto active:scale-95 transition-transform"
          >
            Отмена
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white active:scale-95 transition-transform"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Загрузка...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Загрузить</span>
                <span className="sm:hidden">OK</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 