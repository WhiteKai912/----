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
      const [tracksResult, usersResult, downloadsResult, playsResult, activeResult, recentActivityResult, activityResult] = await Promise.all([
        client.query("SELECT COUNT(*) as total FROM tracks WHERE is_active = true"),
        client.query("SELECT COUNT(*) as total FROM users WHERE is_active = true"),
        client.query("SELECT COUNT(*) as total FROM download_history"),
        client.query("SELECT SUM(plays_count) as total FROM tracks WHERE is_active = true"),
        client.query(`
          SELECT COUNT(DISTINCT user_id) as total 
          FROM play_history 
          WHERE played_at >= CURRENT_DATE
        `),
        client.query(`
          (
            SELECT 
              ph.id,
              'play' as type,
              t.title as track_title,
              u.name as user_name,
              ph.played_at as created_at
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
              dh.downloaded_at as created_at
            FROM download_history dh
            JOIN tracks t ON dh.track_id = t.id
            JOIN users u ON dh.user_id = u.id
            ORDER BY dh.downloaded_at DESC
            LIMIT 5
          )
          ORDER BY created_at DESC
          LIMIT 10
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
              COUNT(*) as plays
            FROM play_history
            WHERE played_at >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY DATE(played_at)
          ),
          downloads AS (
            SELECT 
              DATE(downloaded_at) as date,
              COUNT(*) as downloads
            FROM download_history
            WHERE downloaded_at >= CURRENT_DATE - INTERVAL '6 days'
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
        `)
      ])

      return NextResponse.json({
        totalTracks: parseInt(tracksResult.rows[0].total),
        totalUsers: parseInt(usersResult.rows[0].total),
        totalDownloads: parseInt(downloadsResult.rows[0].total || "0"),
        totalPlays: parseInt(playsResult.rows[0].total || "0"),
        activeToday: parseInt(activeResult.rows[0].total),
        recentActivity: recentActivityResult.rows,
        weeklyActivity: activityResult.rows
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching overview data:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 