"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ban, CheckCircle, Loader2 } from "lucide-react"

interface AdminUser {
  id: string
  email: string
  name?: string
  role: string
  is_active: boolean
  created_at: string
  downloads_count: number
  playlists_count: number
}

interface AdminUsersProps {
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export default function AdminUsers({ onError, onSuccess }: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userSearch, setUserSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 500) // Debounce search

    return () => clearTimeout(timer)
  }, [userSearch, page])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(userSearch && { search: userSearch }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users)
      setTotalUsers(data.total)
    } catch (error) {
      console.error("Error fetching users:", error)
      onError("Ошибка при загрузке пользователей")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      })

      if (response.ok) {
        setUsers(users.map((user) => (user.id === userId ? { ...user, is_active: isActive } : user)))
        onSuccess(`Пользователь ${isActive ? "активирован" : "заблокирован"}`)
      } else {
        onError("Ошибка при изменении статуса пользователя")
      }
    } catch (error) {
      onError("Ошибка при изменении статуса пользователя")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>Список всех зарегистрированных пользователей</CardDescription>
          </div>
          <div className="w-full md:w-auto">
            <Input
              placeholder="Поиск пользователей..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Пользователь
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Роль
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Регистрация
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`
                      border-b border-gray-100 dark:border-gray-800 
                      hover:bg-gray-50 dark:hover:bg-gray-800/50
                      ${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-gray-800/20'}
                    `}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || "Без имени"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {user.role === "admin" ? "Администратор" : "Пользователь"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          user.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }
                      >
                        {user.is_active ? "Активен" : "Заблокирован"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant={user.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        className="w-full"
                      >
                        {user.is_active ? (
                          <>
                            <Ban className="w-4 h-4 mr-2" />
                            Заблокировать
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Активировать
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 