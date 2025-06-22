import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      // Получение общей статистики
      const stats = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM tracks WHERE is_active = true) as total_tracks,
          (SELECT SUM(plays_count) FROM tracks WHERE is_active = true) as total_plays,
          (SELECT COUNT(*) FROM download_history) as total_downloads,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users
      `)

      // Получение топ-5 треков
      const topTracks = await client.query(`
        SELECT 
          t.id,
          t.title,
          a.name as artist_name,
          al.title as album,
          COALESCE(t.plays_count, 0) as plays_count
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        WHERE t.is_active = true
        ORDER BY t.plays_count DESC NULLS LAST
        LIMIT 5
      `)

      // Получение последней активности
      const recentActivity = await client.query(`
        (
          SELECT 
            ph.id,
            'play' as type,
            t.title as track_title,
            u.name as user_name,
            ph.played_at as activity_time
          FROM play_history ph
          JOIN tracks t ON ph.track_id = t.id
          JOIN users u ON ph.user_id = u.id
          ORDER BY ph.played_at DESC
          LIMIT 5
        )
        UNION ALL
        (
          SELECT 
            dh.id,
            'download' as type,
            t.title as track_title,
            u.name as user_name,
            dh.downloaded_at as activity_time
          FROM download_history dh
          JOIN tracks t ON dh.track_id = t.id
          JOIN users u ON dh.user_id = u.id
          ORDER BY dh.downloaded_at DESC
          LIMIT 5
        )
        ORDER BY activity_time DESC
        LIMIT 10
      `)

      return NextResponse.json({
        totalTracks: parseInt(stats.rows[0].total_tracks),
        totalPlays: parseInt(stats.rows[0].total_plays || "0"),
        totalDownloads: parseInt(stats.rows[0].total_downloads),
        totalUsers: parseInt(stats.rows[0].total_users),
        topTracks: topTracks.rows,
        recentActivity: recentActivity.rows.map(row => ({
          ...row,
          created_at: row.activity_time
        }))
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 