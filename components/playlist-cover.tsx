import { Music } from "lucide-react"
import type { Playlist } from "@/lib/database"
import Image from "next/image"
import { motion } from "framer-motion"

interface PlaylistCoverProps {
  playlist: Playlist
  size?: "sm" | "md" | "lg"
  className?: string
  onPress?: () => void
}

export function PlaylistCover({ playlist, size = "md", className = "", onPress }: PlaylistCoverProps) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-full h-full"
  }

  const coverSize = sizeClasses[size]

  // Если у плейлиста есть треки, подготовим первые 4 для сетки
  const coverTracks = playlist.tracks?.slice(0, 4) || []

  let customCoverUrl: string | null | undefined = playlist.cover_url; // По умолчанию используем URL из БД

  if (playlist.cover_data) {
    let buffer: Buffer | null = null;
    // Данные могут быть либо уже Buffer (на сервере), либо объектом {type: 'Buffer', data: [...]} (на клиенте)
    if (Buffer.isBuffer(playlist.cover_data)) {
      buffer = playlist.cover_data;
    } else if (typeof playlist.cover_data === 'object' && (playlist.cover_data as any)?.type === 'Buffer' && Array.isArray((playlist.cover_data as any)?.data)) {
      buffer = Buffer.from((playlist.cover_data as any).data);
    }
    
    if (buffer) {
      customCoverUrl = `data:image/webp;base64,${buffer.toString('base64')}?v=${playlist.cover_version}`;
    }
  }

  console.log('PlaylistCover props:', playlist);

  return (
    <motion.div
      whileHover={{ scale: onPress ? 1.05 : 1 }}
      whileTap={{ scale: onPress ? 0.95 : 1 }}
      onClick={onPress}
      className={`relative ${coverSize} ${className} rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20`}
    >
      {customCoverUrl ? (
        // Если есть прямая ссылка на обложку — всегда показываем её
        <div className="absolute inset-0">
          <Image
            src={customCoverUrl}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        </div>
      ) : coverTracks.length > 0 ? (
        // Если cover_url нет, строим сетку из обложек треков
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 bg-gray-900/50 p-0.5">
          {coverTracks.map((track, index) => (
            <div key={`${playlist.id}-${track.id}-${index}`} className="relative w-full h-full">
              {track.cover_url ? (
                <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Music className="w-1/2 h-1/2 text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {/* Заполняем оставшиеся ячейки, если треков меньше 4 */}
          {Array.from({ length: 4 - coverTracks.length }).map((_, index) => (
            <div
              key={`empty-${playlist.id}-${index}`}
              className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center"
            >
              <Music className="w-1/3 h-1/3 text-white/60" />
            </div>
          ))}
        </div>
      ) : (
        // Если нет ни обложки, ни треков
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30">
          <Music className="w-1/3 h-1/3 text-white/60" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60" />
    </motion.div>
  )
} 