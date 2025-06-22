"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PlayCircle, Download, Users, Music } from "lucide-react"
import { ActivityChart } from "./activity-chart"

interface AnalyticsData {
  totalTracks: number
  totalPlays: number
  totalDownloads: number
  totalUsers: number
  topTracks: Array<{
    id: string
    title: string
    artist_name: string
    album: string | null
    plays_count: number
  }>
  recentActivity: Array<{
    id: string
    type: "play" | "download"
    track_title: string
    user_name: string
    created_at: string
  }>
}

interface AnalyticsDashboardProps {
  data: Array<{
    date: string
    plays: number
    downloads: number
  }>
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  return <ActivityChart data={data} />
}

export function AnalyticsDashboardOld() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics")
      const data = await response.json()
      if (response.ok) {
        setData(data)
      } else {
        setError(data.error || "Ошибка при загрузке аналитики")
      }
    } catch (error) {
      setError("Ошибка при загрузке аналитики")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-gray-500">
        Нет данных для отображения
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <Music className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Всего треков</p>
                <h3 className="text-2xl font-bold">{data.totalTracks}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <PlayCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Прослушиваний</p>
                <h3 className="text-2xl font-bold">{data.totalPlays}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Загрузок</p>
                <h3 className="text-2xl font-bold">{data.totalDownloads}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Пользователей</p>
                <h3 className="text-2xl font-bold">{data.totalUsers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tracks */}
      <Card>
        <CardHeader>
          <CardTitle>Популярные треки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topTracks.map((track) => (
              <div key={track.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{track.title}</p>
                  <p className="text-sm text-gray-500">{track.artist_name} • {track.album || 'Без альбома'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-gray-400" />
                  <span>{track.plays_count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{activity.track_title}</p>
                  <p className="text-sm text-gray-500">
                    {activity.user_name} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  {activity.type === "play" ? (
                    <PlayCircle className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Download className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 