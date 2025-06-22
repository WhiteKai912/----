import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Edit, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { Playlist } from "@/lib/database"
import { UploadCoverDialog } from "./upload-cover-dialog"

interface EditPlaylistDialogProps {
  playlist: Playlist
  onUpdate: (playlist: Playlist) => void
}

export function EditPlaylistDialog({ playlist, onUpdate }: EditPlaylistDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [description, setDescription] = useState(playlist.description || "")
  const [isPublic, setIsPublic] = useState(playlist.is_public)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: description || null,
          isPublic,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Плейлист обновлен",
          description: "Изменения успешно сохранены",
        })
        onUpdate(data.playlist)
        setOpen(false)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Ошибка при обновлении плейлиста")
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось обновить плейлист",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCoverUpload = (coverUrl: string) => {
    onUpdate({
      ...playlist,
      cover_url: coverUrl,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="sm" className="gap-2 active:scale-95 transition-transform">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Редактировать</span>
            <span className="sm:hidden">Ред.</span>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Редактировать плейлист
          </DialogTitle>
        </DialogHeader>
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Название
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название плейлиста"
              required
              className="h-10 sm:h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание плейлиста"
              rows={3}
              className="min-h-[80px] sm:min-h-[100px] resize-y"
            />
          </div>
          <motion.div
            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            whileTap={{ scale: 0.98 }}
          >
            <Label
              htmlFor="public"
              className="cursor-pointer text-sm sm:text-base flex items-center gap-2"
            >
              Публичный плейлист
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-cyan-500"
            />
          </motion.div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Обложка плейлиста</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <UploadCoverDialog
                playlistId={playlist.id}
                onUpload={handleCoverUpload}
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Загрузите изображение для обложки плейлиста
              </span>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto active:scale-95 transition-transform"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Сохранение...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Сохранить</span>
                  <span className="sm:hidden">OK</span>
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
} 