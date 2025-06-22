"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Pause, Download, Heart, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudio } from "@/components/providers/audio-provider"
import type { Track } from "@/lib/database"

interface TrackItemProps {
  track: Track
  showArtist?: boolean
  showAlbum?: boolean
  showDuration?: boolean
  showDownload?: boolean
  onPlay?: () => void
}

export function TrackItem({
  track,
  showArtist = true,
  showAlbum = true,
  showDuration = true,
  showDownload = true,
  onPlay
}: TrackItemProps) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    playTrack,
    togglePlayPause
  } = useAudio()

  const isCurrentTrack = currentTrack?.id === track.id
  const [isDownloading, setIsDownloading] = useState(false)

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlayPause()
    } else {
      playTrack(track)
    }
    onPlay?.()
  }

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(track.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${track.title}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading track:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="group flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="relative flex-shrink-0">
        <Image
          src={track.cover_url || "/placeholder.svg"}
          alt={track.title}
          width={48}
          height={48}
          className="rounded-md object-cover"
        />
        {isCurrentTrack && isPlaying && (
          <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center">
            <div className="music-bars scale-75">
              <div className="music-bar bg-cyan-400"></div>
              <div className="music-bar bg-cyan-400"></div>
              <div className="music-bar bg-cyan-400"></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate max-w-[200px]">
            {track.title}
          </span>
          {showArtist && track.artist_name && (
            <span className="text-sm text-slate-400 truncate">
              • {track.artist_name}
            </span>
          )}
        </div>
        {(showAlbum || showDuration) && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {showAlbum && track.album && (
              <span className="truncate max-w-[150px]">{track.album}</span>
            )}
            {showDuration && track.duration && (
              <span className="flex-shrink-0">
                {showAlbum && "•"} {formatDuration(track.duration)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlay}
          className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
          disabled={isLoading && isCurrentTrack}
        >
          {isLoading && isCurrentTrack ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying && isCurrentTrack ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>

        {showDownload && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all"
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
} 