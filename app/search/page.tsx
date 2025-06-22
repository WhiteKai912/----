"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchResults } from "@/components/search-results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Track, Playlist } from "@/lib/database"
import { Loader2, ArrowLeft, Search, Music, ListMusic } from "lucide-react"
import { MobileNavigation } from "@/components/mobile-navigation"
import { MobilePlayer } from "@/components/mobile-player"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""
  const [tracks, setTracks] = useState<Track[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeTab, setActiveTab] = useState<"all" | "tracks" | "playlists">("all")

  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      searchContent(query)
    }
  }, [query])

  const searchContent = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tracks/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setTracks(data.tracks || [])
      setPlaylists(data.playlists || [])
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const totalResults = tracks.length + playlists.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">Поиск контента...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-4 pb-24 md:pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 w-full">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white p-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">На главную</span>
          </Button>

          <div className="flex-1 w-full sm:max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Поиск треков, плейлистов, исполнителей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 w-full"
              />
            </form>
          </div>
        </div>

        {query && (
          <div className="w-full overflow-x-hidden">
            {/* Search Info */}
            <div className="mb-4">
              <h1 className="text-xl font-medium text-white mb-1">Результаты поиска</h1>
              <p className="text-sm text-gray-400">
                По запросу "{query}" найдено {totalResults} результатов
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mb-6 w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                  activeTab === "all"
                    ? "border-cyan-400 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                Все ({totalResults})
              </button>
              <button
                onClick={() => setActiveTab("tracks")}
                className={`py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                  activeTab === "tracks"
                    ? "border-cyan-400 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Music className="w-4 h-4 inline mr-1" />
                Треки ({tracks.length})
              </button>
              <button
                onClick={() => setActiveTab("playlists")}
                className={`py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 border-b-2 ${
                  activeTab === "playlists"
                    ? "border-cyan-400 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <ListMusic className="w-4 h-4 inline mr-1" />
                Плейлисты ({playlists.length})
              </button>
            </div>

            {/* Results */}
            <div className="w-full overflow-x-hidden">
              <SearchResults query={query} tracks={tracks} playlists={playlists} activeTab={activeTab} />
            </div>
          </div>
        )}

        {!query && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Найдите свою музыку</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto px-4">
              Ищите треки, плейлисты, исполнителей и альбомы в нашей огромной коллекции
            </p>
          </div>
        )}
      </div>

      {/* Mobile Player */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 block md:hidden">
        <MobilePlayer />
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
        <MobileNavigation />
      </div>
    </div>
  )
}
