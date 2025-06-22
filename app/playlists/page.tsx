"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Music,
  Plus,
  Play,
  Clock,
  Users,
  Lock,
  Globe,
  Loader2,
  Heart,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowLeft,
  ListMusic,
  ChevronLeft,
  User,
} from "lucide-react"
import type { Playlist } from "@/lib/database"
import { PlaylistEditModal } from "@/components/playlist-edit-modal"
import { PlaylistDeleteModal } from "@/components/playlist-delete-modal"
import { Player } from "@/components/player"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlaylistCover } from "@/components/playlist-cover"
import { EditPlaylistDialog } from "@/components/playlist/edit-playlist-dialog"

export default function PlaylistsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    isPublic: false,
  })

  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [deletingPlaylist, setDeletingPlaylist] = useState<Playlist | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchPlaylists()
    }
  }, [status, router])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const [userPlaylistsRes, publicPlaylistsRes] = await Promise.all([
        fetch("/api/playlists"),
        fetch("/api/playlists/public"),
      ])

      if (userPlaylistsRes.ok) {
        const userData = await userPlaylistsRes.json()
        setPlaylists(userData.playlists)
      }

      if (publicPlaylistsRes.ok) {
        const publicData = await publicPlaylistsRes.json()
        setPublicPlaylists(publicData.playlists)
      }
    } catch (error) {
      console.error("Error fetching playlists:", error)
      setError("Ошибка при загрузке плейлистов")
    } finally {
      setLoading(false)
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Плейлист успешно создан!")
        setCreateForm({ name: "", description: "", isPublic: false })
        setShowCreateForm(false)
        fetchPlaylists()
      } else {
        setError(data.error || "Ошибка при создании плейлиста")
      }
    } catch (error) {
      setError("Ошибка при создании плейлиста")
    } finally {
      setCreating(false)
    }
  }

  const handleUpdatePlaylist = (updatedPlaylist: Playlist) => {
    setPlaylists((prev) => prev.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p)))
    setSuccess("Плейлист обновлен")
  }

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
    setSuccess("Плейлист удален")
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}ч ${minutes}м`
    }
    return `${minutes}м`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (status === "loading" || loading) {
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

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Войдите в аккаунт</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-6">
              Для просмотра и создания плейлистов необходимо войти в систему
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="gradient-primary text-white">
                <Link href="/auth/login">Войти</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/register">Регистрация</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        {/* Верхняя навигация */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-gray-900/70 border-b border-gray-800">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Главная</span>
              </Link>
              <h1 className="text-xl font-bold text-white truncate">Плейлисты</h1>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shrink-0"
              size="sm"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Создать плейлист</span>
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Create Form */}
          {showCreateForm && (
            <Card className="mb-8 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Создать плейлист</CardTitle>
                <CardDescription>Создайте новый плейлист и добавляйте в него треки</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePlaylist} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPublic"
                      checked={createForm.isPublic}
                      onCheckedChange={(checked) => setCreateForm({ ...createForm, isPublic: checked as boolean })}
                    />
                    <Label htmlFor="isPublic">Сделать плейлист публичным</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Создать
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

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

          {/* My Playlists Section */}
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-xl blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Мои плейлисты</h2>
                    <p className="text-gray-400">Создавайте и управляйте своими музыкальными коллекциями</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {/* Карточка Избранное */}
                  <div
                    className="group relative bg-gradient-to-br from-rose-500/80 to-cyan-500/80 rounded-xl overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-rose-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <Link href="/favorites" className="block h-full">
                      <div className="flex flex-col items-center justify-center h-full p-6">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                          <Heart className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1 text-center">Избранное</h3>
                        <p className="text-xs text-white/80 text-center">Все ваши любимые треки</p>
                      </div>
                    </Link>
                  </div>
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="group relative bg-gray-800/40 rounded-xl overflow-hidden hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                    >
                      {/* Cover */}
                      <div className="aspect-square w-full">
                        <PlaylistCover playlist={playlist} size="lg" />
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <Link href={`/playlists/${playlist.id}`}>
                          <h3 className="font-medium text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                            {playlist.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                            <div className="flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              <span>{playlist.tracks_count || 0}</span>
                            </div>
                            {playlist.is_public ? (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>Публичный</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Личный</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* Actions */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingPlaylist(playlist)}
                          className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingPlaylist(playlist)}
                          className="h-8 w-8 bg-black/50 text-white hover:bg-black/70"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {playlists.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 bg-gray-800/30 rounded-xl backdrop-blur-sm">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Music className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        У вас пока нет плейлистов
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Создайте свой первый плейлист и начните собирать любимую музыку
                      </p>
                      <Button 
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Создать плейлист
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Public Playlists Section */}
            {publicPlaylists.length > 0 && (
              <div className="relative mt-12">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 rounded-xl blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <Users className="w-6 h-6 text-cyan-400" />
                        Публичные плейлисты
                      </h2>
                      <p className="text-gray-400">Откройте для себя музыкальные коллекции других пользователей</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {publicPlaylists.map((playlist) => (
                      <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                        <div className="group relative bg-gray-800/40 rounded-xl overflow-hidden hover:bg-gray-800/60 transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/10">
                          {/* Cover */}
                          <div className="aspect-square w-full">
                            <PlaylistCover playlist={playlist} size="lg" />
                          </div>

                          {/* Info */}
                          <div className="p-4">
                            <h3 className="font-medium text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                              {playlist.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                              <div className="flex items-center gap-1">
                                <Music className="w-3 h-3" />
                                <span>{playlist.tracks_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate">{playlist.user_name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-12 w-12 text-white hover:scale-110 transition-transform"
                            >
                              <Play className="w-6 h-6" />
                            </Button>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingPlaylist && (
        <EditPlaylistDialog
          playlist={editingPlaylist}
          open={!!editingPlaylist}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingPlaylist(null)
              fetchPlaylists()
            }
          }}
          onUpdate={(updatedPlaylist) => {
            handleUpdatePlaylist(updatedPlaylist)
            setEditingPlaylist(null)
          }}
        />
      )}

      {deletingPlaylist && (
        <PlaylistDeleteModal
          playlist={deletingPlaylist}
          onClose={() => setDeletingPlaylist(null)}
          onDelete={handleDeletePlaylist}
        />
      )}

      <Player />
    </>
  )
}
