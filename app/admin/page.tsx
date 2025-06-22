"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, BarChart3, Users, Music, Loader2 } from "lucide-react"
import { Loading } from "@/components/loading"
import type { CustomSession } from "@/types/session"

// Динамический импорт компонентов с приоритетами
const AdminOverview = dynamic(() => import('@/components/admin/overview'), {
  loading: () => <Loading />,
  ssr: false
})

const AdminUsers = dynamic(() => import('@/components/admin/users'), {
  loading: () => <Loading />,
  ssr: false
})

const AdminTracks = dynamic(() => import('@/components/admin/tracks'), {
  loading: () => <Loading />,
  ssr: false
})

// Кэширование данных админ-панели
let cachedAdminData: any = null
let cacheTime: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export default function AdminPage() {
  const { data: session, status } = useSession() as { data: CustomSession | null; status: string }
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      if (session.user.role !== "admin") {
        router.push("/")
        return
      }
    }
  }, [status, session, router])

  // Предварительная загрузка других вкладок
  useEffect(() => {
    if (activeTab === "overview") {
      // Предзагружаем компоненты других вкладок
      const preloadOtherTabs = async () => {
        const [usersModule, tracksModule] = await Promise.all([
          import('@/components/admin/users'),
          import('@/components/admin/tracks')
        ])
      }
      preloadOtherTabs()
    }
  }, [activeTab])

  if (status === "loading") {
    return <Loading />
  }

  if (session?.user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Доступ запрещен</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400 mb-6">У вас нет прав для доступа к админ-панели</p>
            <Button onClick={() => router.push("/")} className="gradient-primary text-white">
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 pt-20">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Верхняя панель */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Панель администратора
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление пользователями, треками и аналитикой
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="group flex items-center gap-2 border-gray-300 dark:border-gray-700"
          >
            <Shield className="w-4 h-4 text-cyan-500" />
            <span>Вернуться на сайт</span>
          </Button>
        </div>

        {/* Алерты */}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="inline-flex p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <TabsTrigger value="overview" className="rounded-md px-4 py-2">
              <BarChart3 className="w-4 h-4 mr-2" />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-md px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="tracks" className="rounded-md px-4 py-2">
              <Music className="w-4 h-4 mr-2" />
              Треки
            </TabsTrigger>
          </TabsList>

          <Suspense fallback={<Loading />}>
            <TabsContent value="overview">
              <AdminOverview onError={setError} onSuccess={setSuccess} />
          </TabsContent>

            <TabsContent value="users">
              <AdminUsers onError={setError} onSuccess={setSuccess} />
          </TabsContent>

            <TabsContent value="tracks">
              <AdminTracks onError={setError} onSuccess={setSuccess} />
          </TabsContent>
          </Suspense>
        </Tabs>
      </div>
    </div>
  )
}
