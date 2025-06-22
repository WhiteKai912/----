import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      // Получаем статистику пользователя
      const [downloadsResult, playlistsResult, activityResult] = await Promise.all([
        // Количество скачиваний
        client.query(
          "SELECT COUNT(*) as total FROM download_history WHERE user_id = $1",
          [session.user.id]
        ),
        // Количество плейлистов
        client.query(
          "SELECT COUNT(*) as total FROM playlists WHERE user_id = $1",
          [session.user.id]
        ),
        // Активность за неделю
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
              COUNT(*) as plays
            FROM play_history
            WHERE user_id = $1
            AND played_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(played_at)
          ),
          downloads AS (
            SELECT 
              DATE(downloaded_at) as date,
              COUNT(*) as downloads
            FROM download_history
            WHERE user_id = $1
            AND downloaded_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(downloaded_at)
          )
          SELECT 
            dates.date,
            COALESCE(plays.plays, 0) as plays,
            COALESCE(downloads.downloads, 0) as downloads
          FROM dates
          LEFT JOIN plays ON dates.date = plays.date
          LEFT JOIN downloads ON dates.date = downloads.date
          ORDER BY dates.date ASC
        `, [session.user.id])
      ])

      return NextResponse.json({
        totalDownloads: parseInt(downloadsResult.rows[0].total),
        totalPlaylists: parseInt(playlistsResult.rows[0].total),
        weeklyActivity: activityResult.rows
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    )
  }
} 