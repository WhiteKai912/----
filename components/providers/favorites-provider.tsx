"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"

interface FavoritesContextType {
  likedTracks: Set<string>
  toggleLike: (trackId: string) => Promise<void>
  isLiked: (trackId: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      fetchUserFavorites()
    }
  }, [session])

  const fetchUserFavorites = async () => {
    try {
      const response = await fetch("/api/user/favorites")
      const data = await response.json()
      if (data.favorites) {
        const favoriteIds = new Set<string>(
          data.favorites.map((item: any) => item.id || item.trackId)
        )
        console.log('ID избранных:', Array.from(favoriteIds));
        setLikedTracks(favoriteIds)
      }
    } catch (error) {
      console.error("Error fetching favorites:", error)
    }
  }

  const toggleLike = async (trackId: string) => {
    if (!session?.user) return

    try {
      const isLiked = likedTracks.has(trackId)
      const response = await fetch("/api/user/favorites", {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (response.ok) {
        setLikedTracks(prev => {
          const newLikedTracks = new Set(prev)
          if (isLiked) {
            newLikedTracks.delete(trackId)
          } else {
            newLikedTracks.add(trackId)
          }
          return newLikedTracks
        })
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
    }
  }

  const isLiked = (trackId: string) => likedTracks.has(trackId)

  return (
    <FavoritesContext.Provider value={{ likedTracks, toggleLike, isLiked }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
} 