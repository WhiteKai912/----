"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Playlist } from "@/lib/database"

interface PlaylistDeleteModalProps {
  playlist: Playlist
  onClose: () => void
  onDelete: (playlistId: string) => void
}

export function PlaylistDeleteModal({ playlist, onClose, onDelete }: PlaylistDeleteModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/playlists/${playlist.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDelete(playlist.id)
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка при удалении плейлиста")
      }
    } catch (error) {
      setError("Ошибка при удалении плейлиста")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError("")
    onClose()
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Удалить плейлист
          </DialogTitle>
          <DialogDescription>Это действие нельзя отменить. Плейлист будет удален навсегда.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white">{playlist.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {playlist.tracks_count} треков • {playlist.is_public ? "Публичный" : "Приватный"}
            </p>
            {playlist.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{playlist.description}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить плейлист"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
