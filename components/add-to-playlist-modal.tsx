"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Music, Check, Loader2 } from "lucide-react"
import type { Playlist } from "@/lib/database"

interface AddToPlaylistModalProps {
  trackId: string
  onClose?: () => void
  children: React.ReactNode
}

export function AddToPlaylistModal({ trackId, onClose, children }: AddToPlaylistModalProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [trackInPlaylists, setTrackInPlaylists] = useState<Set<string>>(new Set())

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    isPublic: false,
  })

  useEffect(() => {
    if (isOpen && session) {
      fetchPlaylists()
      checkTrackInPlaylists()
    }
  }, [isOpen, session, trackId])

  const fetchPlaylists = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/playlists")
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.playlists)
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
      setError("Ошибка при загрузке плейлистов")
    } finally {
      setLoading(false)
    }
  }

  const checkTrackInPlaylists = async () => {
    try {
      const response = await fetch(`/api/tracks/${trackId}/playlists`)
      if (response.ok) {
        const data = await response.json()
        setTrackInPlaylists(new Set(data.playlistIds))
      }
    } catch (error) {
      console.error("Error checking track in playlists:", error)
    }
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      setError("")
      setSuccess("")
      
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (response.ok) {
        setTrackInPlaylists((prev) => new Set(prev).add(playlistId))
        setSuccess("Трек добавлен в плейлист")
        
        // Обновляем список плейлистов после добавления трека
        await fetchPlaylists()
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка при добавлении трека")
      }
    } catch (error) {
      console.error("Error adding track to playlist:", error)
      setError("Ошибка при добавлении трека")
    }
  }

  const handleRemoveFromPlaylist = async (playlistId: string) => {
    try {
      setError("")
      setSuccess("")
      
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (response.ok) {
        setTrackInPlaylists((prev) => {
          const newSet = new Set(prev)
          newSet.delete(playlistId)
          return newSet
        })
        setSuccess("Трек удален из плейлиста")
        
        // Обновляем список плейлистов после удаления трека
        await fetchPlaylists()
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка при удалении трека")
      }
    } catch (error) {
      console.error("Error removing track from playlist:", error)
      setError("Ошибка при удалении трека")
    }
  }

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        const data = await response.json()
        setPlaylists((prev) => [data.playlist, ...prev])
        setCreateForm({ name: "", description: "", isPublic: false })
        setShowCreateForm(false)
        setSuccess("Плейлист создан")

        // Автоматически добавляем трек в новый плейлист
        await handleAddToPlaylist(data.playlist.id)
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка при создании плейлиста")
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      setError("Ошибка при создании плейлиста")
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>Войдите для добавления в плейлист</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить в плейлист
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить в плейлист</DialogTitle>
            <DialogDescription>Выберите плейлист или создайте новый</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {showCreateForm ? (
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Описание</Label>
                <Input
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={createForm.isPublic}
                  onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, isPublic: checked as boolean }))}
                />
                <Label htmlFor="isPublic">Публичный плейлист</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Создать
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full mb-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать новый плейлист
              </Button>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>У вас пока нет плейлистов</p>
                  </div>
                ) : (
                  playlists.map((playlist) => {
                    const isInPlaylist = trackInPlaylists.has(playlist.id)
                    return (
                      <div
                        key={playlist.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{playlist.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{playlist.tracks_count} треков</p>
                        </div>
                        <Button
                          variant={isInPlaylist ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => (isInPlaylist ? handleRemoveFromPlaylist(playlist.id) : handleAddToPlaylist(playlist.id))}
                        >
                          {isInPlaylist ? "Удалить" : "Добавить"}
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
