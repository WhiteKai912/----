"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import ProfileSettings from "@/components/profile-settings"
import { Loading } from "@/components/loading"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userProfile, setUserProfile] = useState<{
    id: string
    email: string
    name?: string
    avatar_url?: string
    role: string
  } | null>(null)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      const data = await response.json()
      setUserProfile(data.user)
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Ошибка при загрузке профиля")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      setError("")
      setSuccess("")

      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при загрузке аватара")
      }

      const data = await response.json()
      console.log("Avatar upload response:", data)
      
      // Обновляем локальное состояние
      setUserProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null)
      
      // Обновляем сессию
      await update()
      console.log("Session updated after avatar upload")
      
      setSuccess("Аватар успешно обновлен")
    } catch (error) {
      console.error("Avatar upload error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке аватара")
    }
  }

  const handleSaveProfile = async (data: { name: string }) => {
    try {
      setError("")
      setSuccess("")

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при обновлении профиля")
      }

      const updatedProfile = await response.json()
      setUserProfile(updatedProfile.user)
      
      // Обновляем сессию
      await update()
      
      setSuccess("Профиль успешно обновлен")
    } catch (error) {
      console.error("Profile update error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при обновлении профиля")
    }
  }

  if (status === "loading" || loading) {
    return <Loading />
  }

  if (!session) {
    return <div>Доступ запрещен</div>
  }

  return (
    <div className="container max-w-2xl py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
          {success}
        </div>
      )}
      {userProfile && (
        <ProfileSettings
          userProfile={userProfile}
          onSave={handleSaveProfile}
          onAvatarUpload={handleAvatarUpload}
        />
      )}
    </div>
  )
} 