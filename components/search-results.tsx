"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Music, Clock, Users, Globe, ListMusic, Download, Plus, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useDownloadTrack } from "@/hooks/useDownloadTrack"
import { PlaylistCover } from "@/components/playlist-cover"
import { useAudio } from "@/components/providers/audio-provider"
import { AddToPlaylistModal } from "@/components/add-to-playlist-modal"
import { motion } from "framer-motion"
import type { Track, Playlist } from "@/lib/database"

interface SearchResultsProps {
  query: string
  tracks: Track[]
  playlists: Playlist[]
  activeTab: "all" | "tracks" | "playlists"
}

export function SearchResults({ query, tracks, playlists, activeTab }: SearchResultsProps) {
  const { data: session } = useSession()
  const { downloadTrack } = useDownloadTrack()
  const { playTrack } = useAudio()
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const EmptyState = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Tracks Section */}
      {(activeTab === "tracks" || activeTab === "all") && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1"
        >
          {tracks.length === 0 ? (
            <EmptyState
              icon={Music}
              title="Треки не найдены"
              description="Попробуйте изменить поисковый запрос"
            />
          ) : (
            <div className="grid gap-1">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div 
                    onClick={() => playTrack(track)}
                    className="group px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/40 active:bg-gray-800/60 transition-colors cursor-pointer rounded-lg"
                  >
                    {/* Cover */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={track.cover_url || "/placeholder.svg"}
                        alt={track.title}
                        className="w-10 h-10 rounded-md object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-white truncate">
                        {track.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {track.artist_name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTrack(track.id);
                        }}
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {session && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrack(track);
                          }}
                          className="h-8 w-8 text-gray-400 hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Playlists Section */}
      {(activeTab === "playlists" || activeTab === "all") && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-1"
        >
          {playlists.length === 0 ? (
            <EmptyState
              icon={ListMusic}
              title="Плейлисты не найдены"
              description="Попробуйте изменить поисковый запрос"
            />
          ) : (
            <div className="grid gap-1">
              {playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/playlists/${playlist.id}`}>
                    <div className="group px-4 py-2.5 flex items-center gap-3 hover:bg-gray-800/40 active:bg-gray-800/60 transition-colors cursor-pointer rounded-lg">
                      {/* Cover */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-800">
                          {playlist.cover_data ? (
                            <img
                              src={`data:${playlist.cover_type};base64,${playlist.cover_data}`}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                              <ListMusic className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Playlist Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-white truncate">
                          {playlist.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            <span>{playlist.tracks_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{playlist.user_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Public Badge */}
                      {playlist.is_public && (
                        <div className="flex-shrink-0">
                          <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Публичный</span>
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Add to Playlist Modal */}
      {selectedTrack && (
        <AddToPlaylistModal
          trackId={selectedTrack.id}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </div>
  )
}
