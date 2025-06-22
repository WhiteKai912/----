"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import type { Track } from "@/lib/database"

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  queue: Track[]
  currentIndex: number
  isRepeat: boolean
  isShuffle: boolean
  playTrack: (track: Track, queue?: Track[]) => void
  pauseTrack: () => void
  resumeTrack: () => void
  togglePlayPause: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  nextTrack: () => void
  previousTrack: () => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  closePlayer: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(30)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [shuffledQueue, setShuffledQueue] = useState<Track[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  const getActiveQueue = () => (isShuffle ? shuffledQueue : queue)

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (!audioRef.current) return

    setIsLoading(true)
    setCurrentTrack(track)

    if (newQueue) {
      setQueue(newQueue)
      const index = newQueue.findIndex((t) => t.id === track.id)
      setCurrentIndex(index >= 0 ? index : 0)
    } else if (queue.length === 0) {
      setQueue([track])
      setCurrentIndex(0)
    }

    try {
      audioRef.current.src = track.file_url
      audioRef.current.volume = isMuted ? 0 : volume / 100
      await audioRef.current.play()
      setIsPlaying(true)

      // Increment play count
      console.log("INCREMENT PLAY", track.id)
      await fetch(`/api/tracks/${track.id}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      })
    } catch (error) {
      console.error("Error playing track:", error)
      setIsLoading(false)
    }
  }

  const nextTrack = () => {
    const activeQueue = getActiveQueue()
    if (activeQueue.length === 0) return

    let nextIndex: number
    if (isShuffle) {
      const currentShuffledIndex = shuffledQueue.findIndex((t) => t.id === currentTrack?.id)
      nextIndex = (currentShuffledIndex + 1) % shuffledQueue.length
      const nextTrackInQueue = shuffledQueue[nextIndex]
      const originalIndex = queue.findIndex((t) => t.id === nextTrackInQueue.id)
      setCurrentIndex(originalIndex)
    } else {
      nextIndex = (currentIndex + 1) % queue.length
      setCurrentIndex(nextIndex)
    }

    playTrack(activeQueue[nextIndex])
  }

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = 0.3 // Устанавливаем начальную громкость 30%
    }
    
    const audio = audioRef.current

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const handleEnded = () => {
      if (isRepeat) {
        // Repeat current track
        audio.currentTime = 0
        audio.play().catch(console.error)
        setIsPlaying(true)
      } else {
        setIsPlaying(false)
        nextTrack()
      }
    }
    const handleError = (e: any) => {
      setIsLoading(false)
      console.error("Error playing track:", e)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.addEventListener("loadstart", handleLoadStart)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("timeupdate", handleTimeUpdate)

    // Установка начального уровня громкости
    audio.volume = isMuted ? 0 : volume / 100

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [isRepeat, nextTrack, volume, isMuted])

  // Remove the old progress interval
  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [isPlaying])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Shuffle queue when shuffle is toggled
  useEffect(() => {
    if (isShuffle && queue.length > 0) {
      const shuffled = [...queue]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      setShuffledQueue(shuffled)
    } else {
      setShuffledQueue([])
    }
  }, [isShuffle, queue])

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      const currentPosition = audioRef.current.currentTime
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          // Восстанавливаем позицию воспроизведения
          if (audioRef.current) {
            audioRef.current.currentTime = currentPosition
          }
        })
        .catch((error) => {
          console.error("Error resuming track:", error)
          setIsPlaying(false)
        })
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      const normalizedVolume = Math.pow(newVolume / 100, 1.5)
      audioRef.current.volume = normalizedVolume
      setVolumeState(newVolume)
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted
      const normalizedVolume = Math.pow(volume / 100, 1.5)
      audioRef.current.volume = newMutedState ? 0 : normalizedVolume
      setIsMuted(newMutedState)
    }
  }

  const previousTrack = () => {
    const activeQueue = getActiveQueue()
    if (activeQueue.length === 0) return

    let prevIndex: number
    if (isShuffle) {
      const currentShuffledIndex = shuffledQueue.findIndex((t) => t.id === currentTrack?.id)
      prevIndex = currentShuffledIndex === 0 ? shuffledQueue.length - 1 : currentShuffledIndex - 1
      const prevTrackInQueue = shuffledQueue[prevIndex]
      const originalIndex = queue.findIndex((t) => t.id === prevTrackInQueue.id)
      setCurrentIndex(originalIndex)
    } else {
      prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1
      setCurrentIndex(prevIndex)
    }

    playTrack(activeQueue[prevIndex])
  }

  const addToQueue = (track: Track) => {
    if (!queue.find(t => t.id === track.id)) {
      setQueue(prev => [...prev, track])
      // Если очередь была пуста, начинаем воспроизведение
      if (queue.length === 0) {
        playTrack(track)
      }
    }
  }

  const removeFromQueue = (index: number) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index)
      // Если удаляем текущий трек
      if (index === currentIndex) {
        if (newQueue.length > 0) {
          // Если есть следующие треки, воспроизводим следующий
          const nextTrackIndex = index < newQueue.length ? index : 0
          playTrack(newQueue[nextTrackIndex])
        } else {
          // Если очередь пуста, останавливаем воспроизведение
          closePlayer()
        }
      } else if (index < currentIndex) {
        // Если удаляем трек перед текущим, корректируем индекс
        setCurrentIndex(prev => prev - 1)
      }
      return newQueue
    })
  }

  const clearQueue = () => {
    setQueue([])
    setShuffledQueue([])
    setCurrentIndex(0)
    closePlayer()
  }

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat)
  }

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle)
  }

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setQueue([])
    setShuffledQueue([])
    setCurrentIndex(0)
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoading,
        queue,
        currentIndex,
        isRepeat,
        isShuffle,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        toggleMute,
        nextTrack,
        previousTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleRepeat,
        toggleShuffle,
        closePlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
}
