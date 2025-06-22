"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, Download, Settings, Heart, ArrowLeft, Calendar, Shield } from "lucide-react"
import { Loading } from "@/components/loading"
import { MobileNavigation } from "@/components/mobile-navigation"
import Link from "next/link"
import type { CustomSession } from "@/types/session"

// Динамический импорт компонентов
const ProfileSettings = dynamic(() => import('@/components/profile-settings'), {
  loading: () => <Loading />,
  ssr: false
})

const DownloadHistory = dynamic(() => import('@/components/download-history'), {
  loading: () => <Loading />,
  ssr: false
})

const ActivityChart = dynamic(() => import('@/components/admin/activity-chart').then(mod => mod.ActivityChart), {
  loading: () => <Loading />,
  ssr: false
})

interface UserProfile {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: string
  created_at: string
}

interface UserStats {
  totalDownloads: number
  totalPlaylists: number
  joinDate: string
  weeklyActivity: Array<{
    date: string
    plays: number
    downloads: number
  }>
}

interface DownloadHistoryItem {
  id: string
  track_title: string
  artist_name: string
  downloaded_at: string
  file_size?: number
}

interface FavoriteTrack {
  id: string
  title: string
  artist_name: string
  album_title?: string
  duration: number
  cover_url?: string
  favorited_at: string
}

// Кэширование данных профиля
let cachedProfileData: any = null
let cacheTime: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export default function ProfilePage() {
  const { data: session, status } = useSession() as { data: CustomSession | null; status: string }
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistoryItem[]>([])
  const [favorites, setFavorites] = useState<FavoriteTrack[]>([])
  const [activeTab, setActiveTab] = useState<string>("activity")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      fetchInitialData()
    }
  }, [status, session, router])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError("")

      // Проверяем кэш
      if (cachedProfileData && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
        setUserProfile(cachedProfileData.profile)
        setUserStats(cachedProfileData.stats)
        setDownloadHistory(cachedProfileData.downloads)
        setFavorites(cachedProfileData.favorites)
        setLoading(false)
        return
      }

      console.log("Fetching profile data...")
      
      // Сначала получаем профиль
      const profileRes = await fetch("/api/user/profile")
      console.log("Profile response status:", profileRes.status)
      
      if (!profileRes.ok) {
        const errorText = await profileRes.text()
        console.error("Profile response error:", errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || "Ошибка при загрузке профиля")
        } catch (e) {
          throw new Error(`Ошибка сервера: ${profileRes.status}`)
        }
      }

      const profileData = await profileRes.json()
      console.log("Profile data received:", {
        hasUser: !!profileData.user,
        userId: profileData.user?.id,
        timestamp: profileData.timestamp
      })

      if (!profileData.user) {
        throw new Error("Данные профиля отсутствуют")
      }

      // Затем получаем остальные данные
      const [statsRes, downloadsRes, favoritesRes] = await Promise.all([
        fetch("/api/user/stats"),
        fetch("/api/user/download-history"),
        fetch("/api/user/favorites")
      ])

      // Проверяем каждый ответ
      const checkResponse = async (res: Response, name: string) => {
        if (!res.ok) {
          const errorText = await res.text()
          console.error(`${name} response error:`, errorText)
          try {
            const errorData = JSON.parse(errorText)
            throw new Error(errorData.error || `Ошибка при загрузке ${name}`)
          } catch (e) {
            throw new Error(`Ошибка сервера при загрузке ${name}: ${res.status}`)
          }
        }
        return res.json()
      }

      const [stats, downloads, favorites] = await Promise.all([
        checkResponse(statsRes, "stats"),
        checkResponse(downloadsRes, "downloads"),
        checkResponse(favoritesRes, "favorites")
      ])

      // Обновляем кэш
      cachedProfileData = {
        profile: profileData.user,
        stats,
        downloads: downloads.downloads,
        favorites: favorites.favorites
      }
      cacheTime = Date.now()

      setUserProfile(profileData.user)
      setUserStats(stats)
      setDownloadHistory(downloads.downloads)
      setFavorites(favorites.favorites)
    } catch (error) {
      console.error("Error fetching profile data:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке данных профиля")
      setUserProfile(null)
    } finally {
      setLoading(false)
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
        body: JSON.stringify({ name: data.name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при обновлении профиля")
      }

      const updatedProfile = await response.json()
      setUserProfile(updatedProfile.user)
      setSuccess("Профиль успешно обновлен")
      await fetchInitialData() // Обновляем все данные
    } catch (error) {
      console.error("Profile update error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при обновлении профиля")
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
      setUserProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : null)
      setSuccess("Аватар успешно обновлен")
    } catch (error) {
      console.error("Avatar upload error:", error)
      setError(error instanceof Error ? error.message : "Ошибка при загрузке аватара")
    }
  }

  if (status === "loading" || loading) {
    return <Loading />
  }

  if (error) {
    return (
        <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад
            </Button>
          </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Профиль не найден</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8">
      {/* Верхняя панель профиля */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 dark:from-cyan-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center gap-6 text-white">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-xl">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback>{userProfile.name?.[0] || userProfile.email[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{userProfile.name || 'Пользователь'}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {userProfile.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  С {new Date(userProfile.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </div>
            {/* Кнопка "Вернуться на главную" только для ПК (md и выше) */}
            <div className="hidden md:block md:self-start">
              <Link href="/">
                <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <ArrowLeft className="w-4 h-4" />
                  Вернуться на главную
                </Button>
              </Link>
            </div>
            {userProfile.role === 'admin' && (
              <Link href="/admin" className="md:self-start">
                <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Shield className="w-4 h-4" />
                  Админ панель
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="container mx-auto px-4 -mt-6 md:-mt-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Music className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.totalPlaylists || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Плейлистов</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Download className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.totalDownloads || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Загрузок</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{favorites.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Избранных</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-4 text-center">
              <Settings className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userProfile.role === 'admin' ? 'Админ' : 'Юзер'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Статус</p>
                  </CardContent>
                </Card>
                          </div>
                        </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="activity" className="space-y-6">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 h-auto p-1 bg-slate-100 dark:bg-gray-800/50">
            <TabsTrigger value="activity" className="py-2">Активность</TabsTrigger>
            <TabsTrigger value="downloads" className="py-2">Загрузки</TabsTrigger>
            <TabsTrigger value="settings" className="py-2">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Активность за неделю</CardTitle>
                <CardDescription>График вашей активности за последние 7 дней</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <Suspense fallback={<Loading />}>
                  <ActivityChart data={userStats?.weeklyActivity || []} />
                </Suspense>
                      </CardContent>
                    </Card>
            </TabsContent>

            <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>История загрузок</CardTitle>
                <CardDescription>Последние загруженные треки</CardDescription>
              </CardHeader>
              <CardContent>
              <Suspense fallback={<Loading />}>
                <DownloadHistory />
              </Suspense>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Настройки профиля</CardTitle>
                <CardDescription>Управление вашим профилем</CardDescription>
              </CardHeader>
              <CardContent>
              <Suspense fallback={<Loading />}>
                  <ProfileSettings
                    userProfile={userProfile}
                    onSave={handleSaveProfile}
                    onAvatarUpload={handleAvatarUpload}
                    router={router}
                  />
                    </Suspense>
                  </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Navigation */}
      <div className="block md:hidden">
        <MobileNavigation />
      </div>
    </div>
  )
}
