import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await pool.connect()
    try {
      const [trackResult, downloadsResult, playlistsResult, favoritesResult] = await Promise.all([
        // Получаем количество прослушиваний из таблицы tracks
        client.query(`
          SELECT plays_count
          FROM tracks
          WHERE id = $1
        `, [params.id]),

        // Получаем количество скачиваний
        client.query(`
          SELECT COUNT(*) as total
          FROM download_history
          WHERE track_id = $1
        `, [params.id]),

        // Получаем количество плейлистов
        client.query(`
          SELECT COUNT(DISTINCT playlist_id) as total
          FROM playlist_tracks
          WHERE track_id = $1
        `, [params.id]),

        // Получаем количество добавлений в избранное
        client.query(`
          SELECT COUNT(*) as total
          FROM user_favorites
          WHERE track_id = $1
        `, [params.id])
      ])

      // Получаем статистику по дням за последнюю неделю
      const weeklyStats = await client.query(`
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
          WHERE track_id = $1
          AND played_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY DATE(played_at)
        ),
        downloads AS (
          SELECT 
            DATE(downloaded_at) as date,
            COUNT(*) as count
          FROM download_history
          WHERE track_id = $1
          AND downloaded_at >= CURRENT_DATE - INTERVAL '6 days'
          GROUP BY DATE(downloaded_at)
        )
        SELECT 
          dates.date,
          COALESCE(plays.count, 0) as plays,
          COALESCE(downloads.count, 0) as downloads
        FROM dates
        LEFT JOIN plays ON dates.date = plays.date
        LEFT JOIN downloads ON dates.date = downloads.date
        ORDER BY dates.date
      `, [params.id])

      return NextResponse.json({
        totalPlays: parseInt(trackResult.rows[0].plays_count),
        totalDownloads: parseInt(downloadsResult.rows[0].total),
        inPlaylists: parseInt(playlistsResult.rows[0].total),
        inFavorites: parseInt(favoritesResult.rows[0].total),
        weeklyStats: weeklyStats.rows
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching track stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 