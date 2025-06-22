"use client"

import { useState, useEffect, useCallback } from 'react'
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
  ChevronDown,
  X,
} from "lucide-react"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useSession } from "next-auth/react"
import { QueueSheet } from "@/components/queue-sheet"
import { motion, AnimatePresence } from "framer-motion"

export function MobilePlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoading,
    queue,
    isRepeat,
    isShuffle,
    togglePlayPause,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    toggleRepeat,
    toggleShuffle,
    closePlayer,
  } = useAudio()

  const [showFullPlayer, setShowFullPlayer] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [localProgress, setLocalProgress] = useState(() => 
    duration > 0 ? (currentTime / duration) * 100 : 0
  )
  const [localVolume, setLocalVolume] = useState(() => volume)

  // Обновляем локальный прогресс при изменении времени воспроизведения
  useEffect(() => {
    if (duration > 0) {
      setLocalProgress((currentTime / duration) * 100)
    }
  }, [currentTime, duration])

  // Обновляем локальную громкость при изменении громкости
  useEffect(() => {
    setLocalVolume(volume)
  }, [volume])

  const handleProgressChange = useCallback((value: number[]) => {
    const newProgress = value[0]
    setLocalProgress(newProgress)
    if (duration > 0) {
      seekTo((newProgress / 100) * duration)
    }
  }, [duration, seekTo])

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0]
    setLocalVolume(newVolume)
    setVolume(newVolume)
  }, [setVolume])

  const formatTime = useCallback((time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  if (!currentTrack) {
    return null
  }

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Предотвращаем всплытие события
    togglePlayPause()
  }

  return (
    <>
      <div className="fixed bottom-[4.5rem] left-0 right-0 bg-gradient-to-r from-slate-900/95 to-gray-900/95 backdrop-blur-xl border-t border-slate-700 shadow-2xl z-layer-player">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" 
              onClick={() => setShowFullPlayer(true)}
            >
              <div className="relative flex-shrink-0 w-10 h-10">
                <Image
                  src={currentTrack.cover_url || "/placeholder.svg"}
                  alt={currentTrack.title}
                  fill
                  className="rounded-lg object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                    <div className="music-bars scale-50">
                      <div className="music-bar bg-cyan-400"></div>
                      <div className="music-bar bg-cyan-400"></div>
                      <div className="music-bar bg-cyan-400"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate max-w-[200px]">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-slate-400 truncate max-w-[180px]">
                  {currentTrack.artist_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlayPauseClick}
                className="w-10 h-10 text-white hover:bg-white/20 active:scale-95 transition-transform"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showFullPlayer} onOpenChange={setShowFullPlayer}>
        <SheetContent 
          side="bottom" 
          className="p-0 bg-gradient-to-r from-slate-900/95 to-gray-900/95 backdrop-blur-xl border-t border-slate-700 z-layer-modal"
        >
          <div className="h-[calc(100vh-env(safe-area-inset-bottom))] flex flex-col pb-[env(safe-area-inset-bottom)]">
            {/* Кнопка закрытия */}
            <div className="flex justify-between items-center p-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowFullPlayer(false)}
                className="w-12 h-12 text-white hover:bg-white/20 active:scale-95 transition-transform"
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={closePlayer}
                className="w-12 h-12 text-white hover:bg-white/20 active:scale-95 transition-transform"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Cover Art */}
            <div className="relative w-full max-w-md mx-auto p-4 sm:p-8 aspect-square touch-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <Image
                    src={currentTrack.cover_url || "/placeholder.svg"}
                    alt={currentTrack.title}
                    fill
                    className="rounded-2xl object-cover shadow-xl select-none"
                    priority
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Track Info */}
            <div className="px-6 py-4 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 line-clamp-2">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400 line-clamp-1">
                    {currentTrack.artist_name}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4">
              <Slider
                value={[localProgress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="my-4"
              />
              <div className="flex justify-between text-sm text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleShuffle}
                  className={`w-14 h-14 transition-all duration-300 active:scale-95 ${
                    isShuffle
                      ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20"
                      : "text-slate-400 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <Shuffle className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={previousTrack}
                  className="w-14 h-14 text-white hover:bg-white/20 active:scale-95 transition-transform"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handlePlayPauseClick}
                  className="w-20 h-20 bg-white/10 text-white hover:bg-white/20 rounded-full active:scale-95 transition-transform"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-10 h-10" />
                  ) : (
                    <Play className="w-10 h-10 ml-1" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={nextTrack}
                  className="w-14 h-14 text-white hover:bg-white/20 active:scale-95 transition-transform"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleRepeat}
                  className={`w-14 h-14 transition-all duration-300 active:scale-95 ${
                    isRepeat
                      ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/20"
                      : "text-slate-400 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <Repeat className="w-6 h-6" />
                </Button>
              </div>

              {/* Volume and Queue */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleMute}
                    className="w-10 h-10 text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <Slider
                    value={[localVolume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowQueue(true)}
                  className="w-10 h-10 text-white hover:bg-white/20"
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <QueueSheet open={showQueue} onOpenChange={setShowQueue} />
    </>
  )
}

export default MobilePlayer
