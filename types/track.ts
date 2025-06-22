export interface Track {
  id: string
  title: string
  artist_name: string
  album_title?: string
  cover_url?: string | null
  cover_version?: number
  file_url: string
  duration: number
  genre_name?: string
  created_at: string
  updated_at?: string
  plays_count: number
  downloads_count: number
  is_active: boolean
  cover_data?: string | null
  cover_type?: string | null
} 