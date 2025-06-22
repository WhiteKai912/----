"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAudio } from "@/components/providers/audio-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, X, Loader2 } from "lucide-react"
import Image from "next/image"

interface QueueSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  const {
    queue,
    currentTrack,
    isPlaying,
    isLoading,
    playTrack,
    togglePlayPause,
    removeFromQueue,
  } = useAudio()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom"
        className="p-0 bg-gradient-to-r from-slate-900/95 to-gray-900/95 backdrop-blur-xl border-t border-slate-700 z-layer-modal"
      >
        <div className="h-[calc(100vh-env(safe-area-inset-bottom))] flex flex-col pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="p-4 text-left border-b border-slate-700">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold text-white">
                Очередь воспроизведения
              </SheetTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {queue.length === 0 ? (
                <p className="text-center text-slate-400 py-8">
                  Очередь воспроизведения пуста
                </p>
              ) : (
                <div className="space-y-2">
                  {queue.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        currentTrack?.id === track.id
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="relative flex-shrink-0 w-12 h-12">
                        <Image
                          src={track.cover_url || "/placeholder.svg"}
                          alt={track.title}
                          fill
                          className="rounded-md object-cover"
                        />
                        {currentTrack?.id === track.id && isPlaying && (
                          <div className="absolute inset-0 bg-black/30 rounded-md flex items-center justify-center">
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
                          {track.title}
                        </p>
                        <p className="text-sm text-slate-400 truncate max-w-[180px]">
                          {track.artist_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentTrack?.id === track.id ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePlayPause()
                            }}
                            className="w-10 h-10 text-white hover:bg-white/20"
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
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              playTrack(track)
                            }}
                            className="w-10 h-10 text-white hover:bg-white/20"
                          >
                            <Play className="w-5 h-5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromQueue(index)
                          }}
                          className="w-10 h-10 text-white hover:bg-white/20"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
} 