"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import type { Track } from "@/lib/database"
import { useSession } from "next-auth/react"
import type { CustomSession } from "@/types/session"

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
  error: string | null
  togglePlayPause: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  nextTrack: () => void
  previousTrack: () => void
  toggleRepeat: () => void
  toggleShuffle: () => void
  closePlayer: () => void
  playTrack: (track: Track, playlist?: Track[]) => void
  removeFromQueue: (index: number) => void
  addToQueue: (track: Track) => void
  clearQueue: () => void
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession() as { data: CustomSession | null }
  const [audio] = useState(() => {
    if (typeof window !== "undefined") {
      const audioElement = new Audio();
      audioElement.volume = 0.3; // 30%
      return audioElement;
    }
    return null;
  });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(30); // Храним громкость в процентах (0-100)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Мемоизированные функции управления
  const togglePlayPause = useCallback(async () => {
    if (audio) {
      try {
        if (isPlaying) {
          // Сохраняем текущую позицию перед паузой
          const currentPosition = audio.currentTime;
          await audio.pause();
          setIsPlaying(false);
          // Убеждаемся, что позиция сохранена
          audio.currentTime = currentPosition;
        } else if (currentTrack) {
          // Восстанавливаем воспроизведение с текущей позиции
          const currentPosition = audio.currentTime;
          try {
            await audio.play();
            // Если воспроизведение началось с начала, восстанавливаем позицию
            if (Math.abs(audio.currentTime - currentPosition) > 1) {
              audio.currentTime = currentPosition;
            }
            setIsPlaying(true);
          } catch (playError) {
            console.error("Error playing audio:", playError);
            setError("Ошибка воспроизведения");
            setIsPlaying(false);
          }
        }
        setError(null);
      } catch (err) {
        console.error("Error toggling playback:", err);
        setError("Ошибка воспроизведения");
        setIsPlaying(false);
      }
    }
  }, [audio, isPlaying, currentTrack]);

  const seekTo = useCallback((time: number) => {
    if (audio) {
      try {
        audio.currentTime = time
        setError(null)
      } catch (err) {
        console.error("Error seeking:", err)
        setError("Ошибка перемотки")
      }
    }
  }, [audio])

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audio) {
      try {
        const normalizedVolume = newVolume / 100;
        audio.volume = normalizedVolume;
        setVolume(newVolume); // Сохраняем значение в процентах
        if (newVolume > 0) {
          setIsMuted(false);
        }
        setError(null);
      } catch (err) {
        console.error("Error changing volume:", err);
        setError("Ошибка изменения громкости");
      }
    }
  }, [audio]);

  const toggleMute = useCallback(() => {
    if (audio) {
      try {
        if (isMuted) {
          audio.volume = volume / 100; // Преобразуем проценты в значение от 0 до 1
        } else {
          audio.volume = 0;
        }
        setIsMuted(!isMuted);
        setError(null);
      } catch (err) {
        console.error("Error toggling mute:", err);
        setError("Ошибка отключения звука");
      }
    }
  }, [audio, isMuted, volume]);

  const playTrack = useCallback(async (track: Track, playlist?: Track[]) => {
    if (!track.file_url) {
      console.error("Cannot play track: audio URL is missing", {
        track_id: track.id,
        title: track.title
      });
      setError("Ошибка: отсутствует URL аудио файла");
      return;
    }

    if (playlist) {
      setQueue(playlist);
      const trackIndex = playlist.findIndex(t => t.id === track.id);
      setCurrentIndex(trackIndex !== -1 ? trackIndex : 0);
    } else if (!queue.find(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
      setCurrentIndex(queue.length);
    }

    if (audio) {
      try {
        setIsLoading(true);
        
        // Проверяем, нужно ли загружать новый трек
        if (audio.src !== track.file_url) {
          audio.src = track.file_url;
          await audio.load();
        }
        
        await audio.play();
        setCurrentTrack(track);
        setIsPlaying(true);
        setError(null);

        // Инкрементируем play count с передачей userId
        await fetch(`/api/tracks/${track.id}/play`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session?.user?.id || null }),
        });
      } catch (err: unknown) {
        console.error("Error playing track:", err);
        setError(`Ошибка воспроизведения трека: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, [audio, queue, session]);

  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      let nextIndex;
      if (isShuffle) {
        // В режиме перемешивания выбираем случайный трек
        nextIndex = Math.floor(Math.random() * queue.length);
        while (nextIndex === currentIndex && queue.length > 1) {
          nextIndex = Math.floor(Math.random() * queue.length);
        }
      } else {
        // В обычном режиме берем следующий трек
        nextIndex = (currentIndex + 1) % queue.length;
      }
      setCurrentIndex(nextIndex);
      const nextTrack = queue[nextIndex];
      if (nextTrack) {
        playTrack(nextTrack);
      }
    }
  }, [queue, currentIndex, isShuffle, playTrack]);

  const previousTrack = useCallback(() => {
    if (queue.length > 0) {
      let prevIndex;
      if (isShuffle) {
        // В режиме перемешивания выбираем случайный трек
        prevIndex = Math.floor(Math.random() * queue.length);
        while (prevIndex === currentIndex && queue.length > 1) {
          prevIndex = Math.floor(Math.random() * queue.length);
        }
      } else {
        // В обычном режиме берем предыдущий трек
        prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
      }
      setCurrentIndex(prevIndex);
      const prevTrack = queue[prevIndex];
      if (prevTrack) {
        playTrack(prevTrack);
      }
    }
  }, [queue, currentIndex, isShuffle, playTrack]);

  const toggleRepeat = useCallback(() => {
    setIsRepeat(!isRepeat)
  }, [isRepeat])

  const toggleShuffle = useCallback(() => {
    setIsShuffle(!isShuffle)
  }, [isShuffle])

  const closePlayer = useCallback(() => {
    if (audio) {
      audio.pause()
      setIsPlaying(false)
      setCurrentTrack(null)
      setQueue([])
      setCurrentIndex(0)
      setError(null)
    }
  }, [audio])

  const removeFromQueue = useCallback((index: number) => {
    if (queue.length > 0) {
      const newQueue = queue.filter((_, i) => i !== index);
      setQueue(newQueue);
      if (currentIndex >= index) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  }, [queue, currentIndex]);

  const addToQueue = useCallback((track: Track) => {
    if (!queue.find(t => t.id === track.id)) {
      setQueue(prev => [...prev, track]);
      setCurrentIndex(queue.length);
    }
  }, [queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
  }, []);

  // Эффекты для управления аудио
  useEffect(() => {
    if (audio) {
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleDurationChange = () => setDuration(audio.duration);
      const handleEnded = () => {
        if (isRepeat) {
          audio.currentTime = 0;
          audio.play().catch(err => {
            console.error("Error replaying track:", err);
            setError(`Ошибка повторного воспроизведения: ${err.message || 'Неизвестная ошибка'}`);
            setIsPlaying(false);
          });
        } else {
          nextTrack();
        }
      };
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);
      const handleError = (e: ErrorEvent) => {
        console.error("Audio error:", e);
        setError(`Ошибка воспроизведения: ${audio.error?.message || 'Неизвестная ошибка'}`);
        setIsPlaying(false);
        setIsLoading(false);
      };

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("durationchange", handleDurationChange);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("durationchange", handleDurationChange);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
      };
    }
  }, [audio, isRepeat, nextTrack]);

  const value = useMemo(
    () => ({
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
      error,
      togglePlayPause,
      seekTo,
      setVolume: handleVolumeChange,
      toggleMute,
      nextTrack,
      previousTrack,
      toggleRepeat,
      toggleShuffle,
      closePlayer,
      playTrack,
      removeFromQueue,
      addToQueue,
      clearQueue,
    }),
    [
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
      error,
      togglePlayPause,
      seekTo,
      handleVolumeChange,
      toggleMute,
      nextTrack,
      previousTrack,
      toggleRepeat,
      toggleShuffle,
      closePlayer,
      playTrack,
      removeFromQueue,
      addToQueue,
      clearQueue,
    ]
  )

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider")
  }
  return context
} 