"use client"

import { useState } from "react"
import { Camera, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import type { CustomSession } from "@/types/session"

interface ProfileFormProps {
  user: CustomSession["user"]
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [avatar, setAvatar] = useState<string | null>(user.avatar_url || null)
  const [name, setName] = useState(user.name || "")

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]
    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, загрузите изображение")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при загрузке аватара")
      }

      setAvatar(data.url)
      setSuccess("Аватар успешно обновлен")
    } catch (error) {
      console.error("Avatar upload error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке аватара")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при обновлении профиля")
      }

      setSuccess("Профиль успешно обновлен")
    } catch (error) {
      console.error("Profile update error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при обновлении профиля")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Аватар */}
      <div className="space-y-2">
        <Label>Аватар</Label>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name || "Avatar"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="text-3xl font-bold text-gray-400">
                  {name ? name[0].toUpperCase() : "?"}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <Camera className="w-6 h-6 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
              />
            </label>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Загрузите новый аватар или оставьте текущий
          </p>
        </div>
      </div>

      {/* Имя */}
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-900/50"
          disabled={loading}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email || ""}
          disabled
          className="bg-gray-900/50 text-gray-400"
        />
        <p className="text-xs text-gray-500">Email нельзя изменить</p>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-500/10 text-green-400">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Кнопка сохранения */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Сохранение...
          </>
        ) : (
          "Сохранить изменения"
        )}
      </Button>
    </form>
  )
} 