"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface DownloadHistoryItem {
  id: string
  track_id: string
  track_title: string
  artist_name: string
  downloaded_at: string
  file_url: string
}

export default function DownloadHistory() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const limit = 10

  const fetchHistory = async (pageNum: number, searchQuery: string = "") => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/user/download-history?${params}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Download history response error:", errorText)
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || "Ошибка при загрузке истории")
        } catch (e) {
          throw new Error(`Ошибка сервера: ${response.status}`)
        }
      }
      
      const data = await response.json()
      setHistory(data.downloads)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (error) {
      console.error("Error fetching download history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(page, search)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchHistory(1, search)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleDownloadClick = async (trackId: string) => {
    try {
      const res = await fetch(`/api/tracks/${trackId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null })
      })
      if (!res.ok) throw new Error('Ошибка при получении ссылки на скачивание')
      const data = await res.json()
      const response = await fetch(data.downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename || 'track.mp3'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Ошибка при скачивании файла')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>История загрузок</CardTitle>
        <CardDescription>
          Список всех скачанных вами треков
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            placeholder="Поиск по названию или исполнителю"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Search className="w-4 h-4 mr-2" />
            Поиск
          </Button>
        </form>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>Дата загрузки</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    {search ? "Ничего не найдено" : "История загрузок пуста"}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.track_title}</TableCell>
                    <TableCell>{item.artist_name}</TableCell>
                    <TableCell>{formatDate(item.downloaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadClick(item.track_id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Страница {page} из {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 