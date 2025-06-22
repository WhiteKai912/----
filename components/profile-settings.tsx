"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { AvatarUpload } from "@/components/avatar-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSession } from "next-auth/react"

interface ProfileSettingsProps {
  userProfile: {
    id: string
    email: string
    name?: string
    avatar_url?: string
    role: string
  }
  onSave: (data: { name: string }) => Promise<void>
  onAvatarUpload: (file: File) => Promise<void>
  router: any
}

export default function ProfileSettings({ userProfile, onSave, onAvatarUpload, router }: ProfileSettingsProps) {
  const { update } = useSession();
  const [name, setName] = useState(userProfile.name || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError("")
    setSuccess("")
    try {
      if (selectedAvatarFile) {
        await onAvatarUpload(selectedAvatarFile)
      }
      await onSave({ name: name.trim() })
      setSuccess("Профиль успешно обновлен")
      setSelectedAvatarFile(null)
      setSelectedAvatarUrl(null)
      // Получаем свежие данные пользователя и обновляем сессию
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        await update({
          name: data.user.name,
          avatar_url: data.user.avatar_url,
          email: data.user.email,
          role: data.user.role,
          id: data.user.id
        })
      }
      window.location.reload()
    } catch (error) {
      setError("Ошибка при обновлении профиля")
    } finally {
      setLoading(false)
    }
  }

  // Теперь просто сохраняем файл и превью в состояние
  const handleAvatarSelect = async (file: File, previewUrl: string) => {
    setSelectedAvatarFile(file)
    setSelectedAvatarUrl(previewUrl)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки профиля</CardTitle>
        <CardDescription>
          Обновите свои личные данные и настройки профиля
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 text-green-800 dark:text-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-4">
          <AvatarUpload 
            onSelect={handleAvatarSelect} 
            previewUrl={selectedAvatarUrl} 
            currentAvatarUrl={userProfile.avatar_url}
            name={userProfile.name}
          />
          <p className="text-sm text-gray-500">
            Нажмите на аватар, чтобы выбрать новое изображение. Изменения вступят в силу после сохранения.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userProfile.email}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
            />
          </div>
          <Button type="submit" disabled={loading}>
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
      </CardContent>
    </Card>
  )
} 