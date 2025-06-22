import { Pool } from "pg"

// Конфигурация подключения к PostgreSQL
const dbConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "ktunes_db",
  password: process.env.DB_PASSWORD || "1",
  port: Number.parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

console.log("Database configuration:", {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl,
  // Не логируем пароль по соображениям безопасности
})

export const pool = new Pool(dbConfig)

// Проверяем подключение при инициализации
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

pool.on('connect', () => {
  console.log('Connected to database successfully')
})

// Типы данных
export type Track = {
  id: string
  title: string
  artist_name: string
  album_title?: string
  genre_name?: string
  duration: number
  plays_count: number
  downloads_count: number
  cover_url?: string
  file_url: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  name: string | null
  avatar: Buffer | null
  avatar_url: string | null
  role: "user" | "admin"
  created_at: Date
  updated_at: Date
}

export interface UserStats {
  totalDownloads: number
  totalPlaylists: number
  joinDate: string
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  is_public: boolean
  user_id: string
  user_name?: string
  tracks_count?: number
  total_duration?: number
  created_at: string
  updated_at: string
  cover_url?: string | null
  cover_data?: Buffer | null
  cover_version?: string | null
  tracks?: Track[]
}

// Функции для работы с пользователями
export async function getUserById(id: string): Promise<User | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, email, name, role, is_active, created_at, avatar_url 
       FROM users WHERE id = $1`,
      [id]
    )
    return result.rows[0] || null
  } finally {
    client.release()
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, email, name, role, is_active, created_at, avatar_url 
       FROM users WHERE email = $1`,
      [email]
    )
    return result.rows[0] || null
  } finally {
    client.release()
  }
}

export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO users (id, email, password_hash, name, role, is_active) 
       VALUES (gen_random_uuid(), $1, crypt($2, gen_salt('bf')), $3, 'user', true) 
       RETURNING id, email, name, role, is_active, created_at`,
      [email, password, name]
    )
    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT id, email, name, role, is_active, created_at, avatar_url
       FROM users 
       WHERE email = $1 
       AND password_hash = crypt($2, password_hash) 
       AND is_active = true`,
      [email, password]
    )
    return result.rows[0] || null
  } finally {
    client.release()
  }
}

export async function updateUserProfile(userId: string, data: { name?: string; avatar_url?: string }): Promise<User> {
  const client = await pool.connect()
  try {
    // Проверяем, является ли avatar_url base64 строкой
    const avatar = data.avatar_url?.startsWith('data:image/') ? data.avatar_url : null

    const result = await client.query(
      `
      UPDATE users 
      SET name = COALESCE($2, name), 
          avatar_url = COALESCE($3, avatar_url),
          updated_at = NOW()
      WHERE id = $1 
      RETURNING id, email, name, avatar_url, role, is_active, created_at
    `,
      [userId, data.name, avatar],
    )

    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const client = await pool.connect()
  try {
    const [downloadsResult, playlistsResult, userResult] = await Promise.all([
      client.query("SELECT COUNT(*) as total FROM download_history WHERE user_id = $1", [userId]),
      client.query("SELECT COUNT(*) as total FROM playlists WHERE user_id = $1", [userId]),
      client.query("SELECT created_at FROM users WHERE id = $1", [userId]),
    ])

    return {
      totalDownloads: Number.parseInt(downloadsResult.rows[0].total),
      totalPlaylists: Number.parseInt(playlistsResult.rows[0].total),
      joinDate: userResult.rows[0].created_at,
    }
  } finally {
    client.release()
  }
}

// Функции для избранного
export async function getUserFavorites(userId: string): Promise<Track[]> {
  console.log("getUserFavorites called with userId:", userId)
  const client = await pool.connect()
  console.log("Database connection established")
  
  try {
    console.log("Executing favorites query...")
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.title,
        COALESCE(a.name, 'Unknown Artist') as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at,
        uf.created_at as favorited_at
      FROM user_favorites uf
      JOIN tracks t ON uf.track_id = t.id
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE uf.user_id = $1 AND t.is_active = true
      GROUP BY t.id, t.title, a.name, al.title, t.duration, t.plays_count, 
               t.downloads_count, t.cover_url, t.file_url, t.is_active, 
               t.created_at, uf.created_at
      ORDER BY uf.created_at DESC
    `,
      [userId],
    )
    console.log("Query executed successfully, rows returned:", result.rows.length)

    const tracks = result.rows.map(track => ({
      ...track,
      artist_name: track.artist_name || 'Unknown Artist',
      album_title: track.album_title || null,
      genre_name: track.genre_name || null,
      cover_url: track.cover_url || null,
    }))
    console.log("Tracks processed successfully")

    return tracks
  } catch (error) {
    console.error('Error in getUserFavorites:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  } finally {
    client.release()
  }
}

export async function addToFavorites(userId: string, trackId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
      userId,
      trackId,
    ])
  } finally {
    client.release()
  }
}

export async function removeFromFavorites(userId: string, trackId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2", [userId, trackId])
  } finally {
    client.release()
  }
}

export async function isTrackFavorited(userId: string, trackId: string): Promise<boolean> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT 1 FROM user_favorites WHERE user_id = $1 AND track_id = $2", [
      userId,
      trackId,
    ])
    return result.rows.length > 0
  } finally {
    client.release()
  }
}

// Функции для плейлистов
export async function getUserPlaylists(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{
  playlists: Playlist[]
  total: number
}> {
  const client = await pool.connect()
  try {
    // Получаем основную информацию о плейлистах
    const [playlistsResult, countResult] = await Promise.all([
      client.query(
        `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.user_id,
          u.name as user_name,
          p.is_public,
          p.cover_url,
          p.cover_data,
          p.cover_version,
          p.created_at,
          p.updated_at,
          COUNT(pt.track_id) as tracks_count,
          COALESCE(SUM(t.duration), 0) as total_duration
        FROM playlists p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        LEFT JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
        WHERE p.user_id = $1
        GROUP BY p.id, u.name
        ORDER BY p.updated_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset],
      ),
      client.query("SELECT COUNT(*) as total FROM playlists WHERE user_id = $1", [userId]),
    ])

    // Для каждого плейлиста получаем первые 4 трека
    const playlistsWithTracks = await Promise.all(
      playlistsResult.rows.map(async (playlist) => {
        const tracksResult = await client.query(
          `
          SELECT 
            t.id,
            t.title,
            t.cover_url,
            t.duration
          FROM playlist_tracks pt
          JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
          WHERE pt.playlist_id = $1
          ORDER BY pt.position
          LIMIT 4
          `,
          [playlist.id]
        )

        // Динамически формируем cover_url, если его нет, но есть cover_data
        let final_cover_url = playlist.cover_url
        if (!final_cover_url && playlist.cover_data && playlist.cover_version) {
          final_cover_url = `/api/playlists/${playlist.id}/cover?v=${playlist.cover_version}`
        }

        return {
          ...playlist,
          cover_url: final_cover_url,
          tracks: tracksResult.rows
        }
      })
    )

    return {
      playlists: playlistsWithTracks,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

export async function getPublicPlaylists(
  limit = 20,
  offset = 0,
): Promise<{
  playlists: Playlist[]
  total: number
}> {
  const client = await pool.connect()
  try {
    // Получаем основную информацию о плейлистах
    const [playlistsResult, countResult] = await Promise.all([
      client.query(
        `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.user_id,
          u.name as user_name,
          p.is_public,
          p.cover_url,
          p.cover_data,
          p.cover_version,
          p.created_at,
          p.updated_at,
          COUNT(pt.track_id) as tracks_count,
          COALESCE(SUM(t.duration), 0) as total_duration
        FROM playlists p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        LEFT JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
        WHERE p.is_public = true
        GROUP BY p.id, u.name
        ORDER BY p.updated_at DESC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset],
      ),
      client.query("SELECT COUNT(*) as total FROM playlists WHERE is_public = true"),
    ])

    // Для каждого плейлиста получаем первые 4 трека для отображения в качестве обложки-коллажа
    const playlistsWithTracks = await Promise.all(
      playlistsResult.rows.map(async (playlist) => {
        const tracksResult = await client.query(
          `
          SELECT 
            t.id,
            t.title,
            t.cover_url,
            t.duration
          FROM playlist_tracks pt
          JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
          WHERE pt.playlist_id = $1
          ORDER BY pt.position
          LIMIT 4
          `,
          [playlist.id]
        )

        const tracks = tracksResult.rows
        const coverUrls = tracks.map(t => t.cover_url).filter(Boolean).slice(0, 4)
        
        // Динамически генерируем URL обложки самого плейлиста
        let playlist_cover_url = playlist.cover_url
        if (!playlist_cover_url && playlist.cover_data && playlist.cover_version) {
          playlist_cover_url = `/api/playlists/${playlist.id}/cover?v=${playlist.cover_version}`
        }

        return {
          ...playlist,
          cover_url: playlist_cover_url,
          tracks: tracksResult.rows, // Возвращаем полный массив треков
        }
      })
    )

    return {
      playlists: playlistsWithTracks,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

export async function getPlaylistById(id: string): Promise<Playlist | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT p.*, u.name as user_name,
              COUNT(DISTINCT pt.track_id) as tracks_count,
              COALESCE(SUM(t.duration), 0) as total_duration
       FROM playlists p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       LEFT JOIN tracks t ON pt.track_id = t.id
       WHERE p.id = $1
       GROUP BY p.id, u.name`,
      [id]
    )
    const playlist = result.rows[0]
    if (!playlist) return null

    // Динамически формируем cover_url
    let cover_url = null
    if (playlist.cover_data && playlist.cover_version) {
      cover_url = `/api/playlists/${playlist.id}/cover?v=${playlist.cover_version}`
    }
    return {
      ...playlist,
      cover_url,
    }
  } finally {
    client.release()
  }
}

export async function createPlaylist(data: {
  name: string
  description?: string
  userId: string
  isPublic: boolean
}): Promise<Playlist> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `
      INSERT INTO playlists (id, name, description, user_id, is_public)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING id, name, description, user_id, is_public, created_at, updated_at
    `,
      [data.name, data.description, data.userId, data.isPublic],
    )

    // Получаем дополнительную информацию о плейлисте
    const playlistInfo = await client.query(
      `
      SELECT 
        p.*,
        u.name as user_name,
        COUNT(DISTINCT pt.track_id) as tracks_count,
        COALESCE(SUM(t.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      LEFT JOIN tracks t ON pt.track_id = t.id
      WHERE p.id = $1
      GROUP BY p.id, u.name
    `,
      [result.rows[0].id]
    )

    return playlistInfo.rows[0]
  } finally {
    client.release()
  }
}

export async function updatePlaylist(
  id: string,
  data: {
    name?: string
    description?: string
    isPublic?: boolean
    coverUrl?: string | null
  },
): Promise<Playlist> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `
      UPDATE playlists 
      SET name = COALESCE($2, name), 
          description = COALESCE($3, description),
          is_public = COALESCE($4, is_public),
          cover_url = COALESCE($5, cover_url),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, description, user_id, is_public, cover_url, created_at, updated_at
      `,
      [id, data.name, data.description, data.isPublic, data.coverUrl],
    )

    return result.rows[0]
  } finally {
    client.release()
  }
}

export async function deletePlaylist(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Delete playlist tracks first
    await client.query("DELETE FROM playlist_tracks WHERE playlist_id = $1", [id])

    // Delete playlist
    await client.query("DELETE FROM playlists WHERE id = $1", [id])

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function getPlaylistTracks(playlistId: string): Promise<Track[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT 
         t.id,
         t.title,
         t.artist_id,
         t.album_id,
         t.duration,
         t.file_url,
         t.cover_url,
         t.plays_count,
         t.downloads_count,
         t.is_active,
         t.created_at,
         a.name as artist_name,
         al.title as album_title,
         pt.position
       FROM playlist_tracks pt
       JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
       LEFT JOIN artists a ON t.artist_id = a.id
       LEFT JOIN albums al ON t.album_id = al.id
       WHERE pt.playlist_id = $1
       GROUP BY 
         t.id, t.title, t.artist_id, t.album_id, t.duration, t.file_url,
         t.cover_url, t.plays_count, t.downloads_count,
         t.is_active, t.created_at, a.name, al.title, pt.position
       ORDER BY pt.position`,
      [playlistId],
    )
    return result.rows
  } finally {
    client.release()
  }
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Проверяем существование трека
    const trackExists = await client.query("SELECT id FROM tracks WHERE id = $1 AND is_active = true", [trackId])
    if (trackExists.rows.length === 0) {
      throw new Error("Track not found or inactive")
    }

    // Проверяем существование плейлиста
    const playlistExists = await client.query("SELECT id FROM playlists WHERE id = $1", [playlistId])
    if (playlistExists.rows.length === 0) {
      throw new Error("Playlist not found")
    }

    // Получаем максимальную текущую позицию
    const maxPositionResult = await client.query(
      "SELECT COALESCE(MAX(position), -1) as max_position FROM playlist_tracks WHERE playlist_id = $1",
      [playlistId]
    )
    const nextPosition = maxPositionResult.rows[0].max_position + 1

    // Добавляем трек в плейлист с новой позицией
    await client.query(
      "INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1, $2, $3) ON CONFLICT (playlist_id, track_id) DO UPDATE SET position = $3",
      [playlistId, trackId, nextPosition]
    )

    // Обновляем время последнего изменения плейлиста
    await client.query("UPDATE playlists SET updated_at = NOW() WHERE id = $1", [playlistId])

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Проверяем существование записи в playlist_tracks
    const trackInPlaylist = await client.query(
      "SELECT 1 FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
      [playlistId, trackId]
    )
    if (trackInPlaylist.rows.length === 0) {
      throw new Error("Track not found in playlist")
    }

    // Удаляем трек из плейлиста
    await client.query(
      "DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
      [playlistId, trackId]
    )

    // Обновляем время последнего изменения плейлиста
    await client.query("UPDATE playlists SET updated_at = NOW() WHERE id = $1", [playlistId])

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Функции для истории скачиваний
export async function getUserDownloadHistory(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<{
  downloads: Array<{
    id: string
    track_title: string
    artist_name: string
    downloaded_at: string
    file_size?: number
  }>
  total: number
}> {
  const client = await pool.connect()
  try {
    const [downloadsResult, countResult] = await Promise.all([
      client.query(
        `
        SELECT 
          dh.id,
          t.title as track_title,
          a.name as artist_name,
          dh.downloaded_at,
          t.file_size
        FROM download_history dh
        JOIN tracks t ON dh.track_id = t.id
        LEFT JOIN artists a ON t.artist_id = a.id
        WHERE dh.user_id = $1
        ORDER BY dh.downloaded_at DESC
        LIMIT $2 OFFSET $3
      `,
        [userId, limit, offset],
      ),
      client.query("SELECT COUNT(*) as total FROM download_history WHERE user_id = $1", [userId]),
    ])

    return {
      downloads: downloadsResult.rows,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

// Админ функции
export async function getAdminStats(): Promise<{
  totalTracks: number
  totalUsers: number
  totalDownloads: number
  activeToday: number
  newUsersThisWeek: number
  topGenres: Array<{ genre: string; count: number }>
  dailyActivity: Array<{ date: string; downloads: number; plays: number }>
}> {
  const client = await pool.connect()
  try {
    const [tracksResult, usersResult, downloadsResult, activeResult, newUsersResult, genresResult, activityResult] =
      await Promise.all([
        client.query("SELECT COUNT(*) as total FROM tracks WHERE is_active = true"),
        client.query("SELECT COUNT(*) as total FROM users WHERE is_active = true"),
        client.query("SELECT COUNT(*) as total FROM download_history"),
        client.query(`
          SELECT COUNT(DISTINCT user_id) as total 
          FROM play_history 
          WHERE played_at >= CURRENT_DATE
        `),
        client.query(`
          SELECT COUNT(*) as total 
          FROM users 
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        `),
        client.query(`
          SELECT g.name as genre, COUNT(DISTINCT tg.track_id) as count
          FROM genres g
          LEFT JOIN track_genres tg ON g.id = tg.genre_id
          LEFT JOIN tracks t ON tg.track_id = t.id AND t.is_active = true
          GROUP BY g.name
          ORDER BY count DESC
          LIMIT 5
        `),
        client.query(`
          WITH dates AS (
            SELECT generate_series(
              CURRENT_DATE - INTERVAL '6 days',
              CURRENT_DATE,
              '1 day'::interval
            )::date as date
          ),
          plays AS (
            SELECT 
              DATE(played_at) as date,
              COUNT(*) as count
            FROM play_history
            WHERE played_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(played_at)
          ),
          downloads AS (
            SELECT 
              DATE(downloaded_at) as date,
              COUNT(*) as count
            FROM download_history
            WHERE downloaded_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(downloaded_at)
          )
          SELECT 
            dates.date,
            COALESCE(downloads.count, 0) as downloads,
            COALESCE(plays.count, 0) as plays
          FROM dates
          LEFT JOIN downloads ON dates.date = downloads.date
          LEFT JOIN plays ON dates.date = plays.date
          ORDER BY dates.date
        `)
      ])

    return {
      totalTracks: Number.parseInt(tracksResult.rows[0].total),
      totalUsers: Number.parseInt(usersResult.rows[0].total),
      totalDownloads: Number.parseInt(downloadsResult.rows[0].total || "0"),
      activeToday: Number.parseInt(activeResult.rows[0].total),
      newUsersThisWeek: Number.parseInt(newUsersResult.rows[0].total),
      topGenres: genresResult.rows,
      dailyActivity: activityResult.rows,
    }
  } finally {
    client.release()
  }
}

export async function getAllUsersAdmin(
  limit = 20,
  offset = 0,
  search = "",
): Promise<{
  users: Array<{
    id: string
    email: string
    name?: string
    role: string
    is_active: boolean
    created_at: string
    downloads_count: number
    playlists_count: number
  }>
  total: number
}> {
  const client = await pool.connect()
  try {
    let query = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        u.created_at,
        COALESCE(SUM(CASE WHEN dh.track_id IS NOT NULL THEN 1 ELSE 0 END), 0) as downloads_count,
        COALESCE(COUNT(DISTINCT p.id), 0) as playlists_count
      FROM users u
      LEFT JOIN download_history dh ON u.id = dh.user_id
      LEFT JOIN playlists p ON u.id = p.user_id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` GROUP BY u.id`

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await client.query(query, params)

    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM users
      WHERE 1=1
      ${search ? ` AND (email ILIKE $1 OR name ILIKE $1)` : ''}
    `, search ? [`%${search}%`] : [])

    return {
      users: result.rows,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

export async function getAllTracksAdmin(
  limit = 20,
  offset = 0,
  search = "",
  genre = "",
): Promise<{
  tracks: Array<{
    id: string
    title: string
    artist_name: string
    album_title?: string
    genre_name?: string
    duration: number
    plays_count: number
    downloads_count: number
    is_active: boolean
    created_at: string
    file_size?: number
    cover_url?: string | null
  }>
  total: number
}> {
  const client = await pool.connect()
  try {
    let query = `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.is_active,
        t.created_at,
        t.file_size,
        t.cover_url
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (t.title ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex} OR al.title ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (genre && genre !== "all") {
      query += ` AND g.name = $${paramIndex}`
      params.push(genre)
      paramIndex++
    }

    query += ` GROUP BY t.id, a.name, al.title`

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await client.query(query, params)

    const countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tracks t
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE 1=1
      ${search ? ` AND (t.title ILIKE $1 OR a.name ILIKE $1 OR al.title ILIKE $1)` : ''}
      ${genre && genre !== "all" ? ` AND g.name = ${search ? '$2' : '$1'}` : ''}
    `
    const countParams: any[] = []
    if (search) countParams.push(`%${search}%`)
    if (genre && genre !== "all") countParams.push(genre)

    const countResult = await client.query(countQuery, countParams)

    return {
      tracks: result.rows,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

export async function updateUserStatus(userId: string, isActive: boolean): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1", [userId, isActive])
  } finally {
    client.release()
  }
}

export async function updateTrackStatus(trackId: string, isActive: boolean): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("UPDATE tracks SET is_active = $2, updated_at = NOW() WHERE id = $1", [trackId, isActive])
  } finally {
    client.release()
  }
}

export async function deleteTrack(trackId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("DELETE FROM tracks WHERE id = $1", [trackId])
  } finally {
    client.release()
  }
}

// Функции для создания треков
export async function createTrack(data: {
  title: string
  artistName: string
  albumTitle?: string | null
  genreId?: string | null
  fileUrl: string
  coverUrl?: string | null
  duration: number
  fileSize: number
}): Promise<Track> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Get or create artist
    const artistResult = await client.query("SELECT id FROM artists WHERE name = $1", [data.artistName])
    let artistId: string

    if (artistResult.rows.length === 0) {
      const newArtistResult = await client.query(
        "INSERT INTO artists (name) VALUES ($1) RETURNING id",
        [data.artistName]
      )
      artistId = newArtistResult.rows[0].id
    } else {
      artistId = artistResult.rows[0].id
    }

    // Get or create album if provided
    let albumId: string | null = null
    if (data.albumTitle) {
      const albumResult = await client.query(
        "SELECT id FROM albums WHERE title = $1 AND artist_id = $2",
        [data.albumTitle, artistId]
      )

      if (albumResult.rows.length === 0) {
        const newAlbumResult = await client.query(
          "INSERT INTO albums (title, artist_id, cover_url) VALUES ($1, $2, $3) RETURNING id",
          [data.albumTitle, artistId, data.coverUrl || null]
        )
        albumId = newAlbumResult.rows[0].id
      } else {
        albumId = albumResult.rows[0].id
      }
    }

    // Create track
    const trackResult = await client.query(
      `
      INSERT INTO tracks (
        title,
        artist_id,
        album_id,
        file_url,
        cover_url,
        duration,
        file_size,
        plays_count,
        downloads_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title, created_at
    `,
      [
        data.title,
        artistId,
        albumId,
        data.fileUrl,
        data.coverUrl || null,
        data.duration,
        data.fileSize,
        0, // plays_count
        0  // downloads_count
      ]
    )

    // Add genre if provided
    if (data.genreId) {
      await client.query(
        "INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)",
        [trackResult.rows[0].id, data.genreId]
      )
    }

    await client.query("COMMIT")

    // Get complete track info
    const trackInfoResult = await client.query(
      `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        g.name as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.id = $1
    `,
      [trackResult.rows[0].id]
    )

    return trackInfoResult.rows[0]
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Остальные функции из предыдущего файла...
export async function getTrendingTracks(limit = 10): Promise<Track[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.is_active = true
      GROUP BY t.id, a.name, al.title, t.cover_url
      ORDER BY t.plays_count DESC, t.created_at DESC
      LIMIT $1
    `,
      [limit],
    )
    return result.rows || []
  } catch (error) {
    console.error("Error in getTrendingTracks:", error)
    return []
  } finally {
    client.release()
  }
}

export async function searchTracks(query: string): Promise<Track[]> {
  console.log('Starting searchTracks with query:', query)
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT DISTINCT
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.is_active = true 
        AND (
          t.title ILIKE $1
          OR a.name ILIKE $1
          OR al.title ILIKE $1
          OR g.name ILIKE $1
        )
      GROUP BY 
        t.id,
        t.title,
        a.name,
        al.title,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      ORDER BY t.plays_count DESC, t.created_at DESC
      LIMIT 50
    `, [`%${query}%`])

    console.log(`Found ${result.rows.length} tracks`)
    return result.rows
  } catch (error) {
    console.error('Error in searchTracks:', error)
    throw error
  } finally {
    console.log('Releasing database connection')
    client.release()
  }
}

export async function searchPlaylists(query: string): Promise<Playlist[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.user_id,
        u.name as user_name,
        p.is_public,
        p.cover_url,
        p.cover_data,
        p.cover_version,
        p.created_at,
        p.updated_at,
        COUNT(pt.track_id) as tracks_count,
        COALESCE(SUM(t.duration), 0) as total_duration
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      LEFT JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
      WHERE p.is_public = true 
        AND (
          p.name ILIKE $1
          OR p.description ILIKE $1
          OR u.name ILIKE $1
        )
      GROUP BY p.id, u.name, p.cover_url
      HAVING COUNT(pt.track_id) > 0
      ORDER BY COUNT(pt.track_id) DESC, p.updated_at DESC
      LIMIT 20
    `, [`%${query}%`])

    return result.rows
  } finally {
    client.release()
  }
}

export async function getAllTracks(
  limit = 20,
  offset = 0,
  genre?: string,
  sortBy = "created_at",
): Promise<{ tracks: Track[]; total: number }> {
  const client = await pool.connect()
  try {
    let query = `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.is_active = true
    `

    const params: any[] = []
    let paramIndex = 1

    if (genre && genre !== "all") {
      query += ` AND g.name = $${paramIndex}`
      params.push(genre)
      paramIndex++
    }

    // Добавляем GROUP BY перед ORDER BY
    query += ` GROUP BY t.id, a.name, al.title, t.cover_url`

    // Сортировка
    switch (sortBy) {
      case "popularity":
        query += " ORDER BY t.plays_count DESC"
        break
      case "newest":
        query += " ORDER BY t.created_at DESC"
        break
      case "alphabetical":
        query += " ORDER BY t.title ASC"
        break
      default:
        query += " ORDER BY t.created_at DESC"
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await client.query(query, params)

    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tracks t
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.is_active = true
    `

    const countParams: any[] = []
    if (genre && genre !== "all") {
      countQuery += " AND g.name = $1"
      countParams.push(genre)
    }

    const countResult = await client.query(countQuery, countParams)

    return {
      tracks: result.rows,
      total: Number.parseInt(countResult.rows[0].total),
    }
  } finally {
    client.release()
  }
}

export async function getTrackById(id: string): Promise<Track | null> {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.title,
        a.name as artist_name,
        al.title as album_title,
        STRING_AGG(g.name, ', ') as genre_name,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
      WHERE t.id = $1 AND t.is_active = true
      GROUP BY 
        t.id,
        t.title,
        a.name,
        al.title,
        t.duration,
        t.plays_count,
        t.downloads_count,
        t.cover_url,
        t.file_url,
        t.is_active,
        t.created_at
    `,
      [id],
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

export async function incrementPlayCount(trackId: string, userId?: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Обновляем счетчик прослушиваний в таблице tracks
    const result = await client.query(
      `UPDATE tracks 
       SET plays_count = COALESCE(plays_count, 0) + 1,
           updated_at = NOW() 
       WHERE id = $1 AND is_active = true 
       RETURNING id`,
      [trackId]
    )

    if (result.rowCount === 0) {
      throw new Error("Track not found or inactive")
    }

    // Добавляем запись в историю прослушиваний (теперь всегда, даже если userId = null)
    await client.query(
      "INSERT INTO play_history (user_id, track_id) VALUES ($1, $2)",
      [userId, trackId]
    )

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error incrementing play count:", error)
    throw error
  } finally {
    client.release()
  }
}

export async function incrementDownloadCount(trackId: string, userId?: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Проверяем существование трека и увеличиваем счетчик скачиваний
    const result = await client.query(
      "UPDATE tracks SET downloads_count = COALESCE(downloads_count, 0) + 1, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING id",
      [trackId]
    )

    if (result.rowCount === 0) {
      throw new Error("Track not found or inactive")
    }

    // Добавляем в историю скачиваний если пользователь авторизован
    if (userId) {
      await client.query("INSERT INTO download_history (user_id, track_id) VALUES ($1, $2)", [userId, trackId])
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// Функции для работы с жанрами
export async function getAllGenres(): Promise<{ id: string; name: string }[]> {
  const client = await pool.connect()
  try {
    const result = await client.query("SELECT id, name FROM genres ORDER BY name")
    return result.rows
  } finally {
    client.release()
  }
}

export async function getFeaturedPlaylists(limit = 8): Promise<Playlist[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.user_id,
        u.name as user_name,
        p.is_public,
        p.cover_url,
        p.cover_data,
        p.cover_version,
        p.created_at,
        p.updated_at,
        COUNT(pt.track_id) as tracks_count,
        COALESCE(SUM(t.duration), 0) as total_duration,
        JSON_AGG(JSONB_BUILD_OBJECT(
          'id', t.id,
          'title', t.title,
          'cover_url', t.cover_url,
          'duration', t.duration
        ) ORDER BY pt.position) FILTER (WHERE t.id IS NOT NULL) as tracks
      FROM playlists p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      LEFT JOIN tracks t ON pt.track_id = t.id AND t.is_active = true
      WHERE p.is_public = true
      GROUP BY p.id, u.name
      ORDER BY p.updated_at DESC
      LIMIT $1
    `, [limit])

    return result.rows.map(p => ({
      ...p,
      tracks: p.tracks?.map((t: { id: string; title: string; cover_url: string | null; duration: number }) => ({
        id: t.id,
        title: t.title,
        cover_url: t.cover_url,
        duration: t.duration
      }))
    }))
  } finally {
    client.release()
  }
}

export default pool
