"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { useAudio } from "@/components/providers/audio-provider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  List,
  Loader2,
  AlertCircle,
} from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { QueueSheet } from "@/components/queue-sheet"

export function Player() {
  const { data: session } = useSession()
  const [isInFavorites, setIsInFavorites] = useState(false)
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    isRepeat,
    isShuffle,
    error,
    togglePlayPause,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    toggleRepeat,
    toggleShuffle,
  } = useAudio()

  // Проверяем, находится ли трек в избранном
  useEffect(() => {
    if (currentTrack && session?.user) {
      fetch(`/api/user/favorites/check/${currentTrack.id}`)
        .then(res => res.json())
        .then(data => setIsInFavorites(data.isInFavorites))
        .catch(console.error)
    }
  }, [currentTrack, session])

  // Функция для добавления/удаления из избранного
  const toggleFavorite = async () => {
    if (!currentTrack || !session?.user) return

    try {
      const response = await fetch('/api/user/favorites', {
        method: isInFavorites ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: currentTrack.id })
      })

      if (response.ok) {
        setIsInFavorites(!isInFavorites)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  if (!currentTrack) {
    return null
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="player-fixed border-t border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-layer-player">
      {error && (
        <div className="absolute top-0 left-0 right-0 transform -translate-y-full z-layer-toast">
          <div className="bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Image
                src={currentTrack.cover_url || "/placeholder.svg"}
                alt={currentTrack.title}
                width={48}
                height={48}
                className="rounded-lg"
              />
              {isPlaying && !error && (
                <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="music-bars scale-50">
                    <div className="music-bar"></div>
                    <div className="music-bar"></div>
                    <div className="music-bar"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{currentTrack.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentTrack.artist_name}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleShuffle}
                className={`w-8 h-8 ${
                  isShuffle
                    ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={previousTrack}
                className="w-8 h-8 text-gray-700 dark:text-gray-200"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className="w-10 h-10 text-gray-900 dark:text-white"
                disabled={isLoading || !!error}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : error ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={nextTrack}
                className="w-8 h-8 text-gray-700 dark:text-gray-200"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleRepeat}
                className={`w-8 h-8 ${
                  isRepeat
                    ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 w-full max-w-md">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(value) => seekTo((value[0] / 100) * duration)}
                disabled={!!error}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-gray-500 dark:text-gray-400"
                disabled={!!error}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                className="w-24"
                onValueChange={(value) => setVolume(value[0])}
                disabled={!!error}
              />
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className={`${
                isInFavorites 
                  ? "text-rose-500 hover:text-rose-600" 
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={toggleFavorite}
            >
              <Heart className={`w-4 h-4 ${isInFavorites ? "fill-current" : ""}`} />
            </Button>
            <QueueSheet />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Default export для совместимости
export default Player
