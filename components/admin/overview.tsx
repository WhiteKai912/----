"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Music, Users, Download, PlayCircle, Loader2 } from "lucide-react"
import { ActivityChart } from "@/components/admin/activity-chart"

interface AdminStats {
  totalTracks: number
  totalUsers: number
  totalDownloads: number
  totalPlays: number
  activeToday: number
  weeklyActivity: Array<{
    date: string
    plays: number
    downloads: number
  }>
  recentActivity: Array<{
    id: string
    type: "play" | "download"
    track_title: string
    user_name: string
    created_at: string
  }>
}

interface AdminOverviewProps {
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export default function AdminOverview({ onError, onSuccess }: AdminOverviewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/overview")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        onError("Ошибка при загрузке статистики")
      }
    } catch (error) {
      console.error("Error fetching overview stats:", error)
      onError("Ошибка при загрузке статистики")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <Music className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего треков</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTracks}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Пользователей</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Скачиваний</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-white/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/20">
                <PlayCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Прослушиваний</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPlays}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Графики и активность */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Активность за неделю</CardTitle>
            <CardDescription>График прослушиваний и скачиваний</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart data={stats.weeklyActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние действия</CardTitle>
            <CardDescription>Недавняя активность пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  {activity.type === "play" ? (
                    <PlayCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Download className="w-5 h-5 text-blue-500" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.track_title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.user_name} • {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 