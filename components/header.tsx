"use client"

import type React from "react"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Menu, User, Music, Heart, Settings, LogOut, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CustomSession } from "@/types/session"

export function Header() {
  const { data: session, status } = useSession() as { data: CustomSession | null; status: string }
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  console.log("Session in header:", session) // Временное логирование для отладки

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-slate-200">K-Tunes</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Поиск треков, исполнителей, альбомов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
              />
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors">
              Главная
            </Link>
            <Link href="/playlists" className="text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors">
              Плейлисты
            </Link>
            {session && (
              <Link
                href="/favorites"
                className="text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Избранное
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Auth Section */}
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-gray-800">
                      <AvatarImage 
                        src={session.user.avatar_url || ''} 
                        alt={session.user.name || 'Avatar'}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white font-semibold">
                        {session.user.name ? session.user.name[0].toUpperCase() : session.user.email?.[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user.name && <p className="font-medium">{session.user.name}</p>}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Личный кабинет
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favorites" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Избранное
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Админ-панель
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Настройки
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Войти</Link>
                </Button>
                <Button className="bg-cyan-400 hover:bg-cyan-300 text-white" asChild>
                  <Link href="/auth/register">Регистрация</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4 px-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Поиск треков, плейлистов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700"
            />
          </form>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 px-2 space-y-1">
            <Link
              href="/"
              className="block py-3 px-2 text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Главная
            </Link>
            <Link
              href="/playlists"
              className="block py-3 px-2 text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Плейлисты
            </Link>
            {session && (
              <Link
                href="/favorites"
                className="block py-3 px-2 text-gray-600 dark:text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Избранное
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
