import { NextResponse } from "next/server"
import pool from "@/lib/database"

export async function GET() {
  try {
    const client = await pool.connect()

    try {
      const [tracksResult, usersResult, downloadsResult] = await Promise.all([
        client.query("SELECT COUNT(*) as total FROM tracks WHERE is_active = true"),
        client.query("SELECT COUNT(*) as total FROM users WHERE is_active = true"),
        client.query("SELECT SUM(downloads_count) as total FROM tracks"),
      ])

      const stats = {
        totalTracks: Number.parseInt(tracksResult.rows[0].total),
        totalUsers: Number.parseInt(usersResult.rows[0].total),
        totalDownloads: Number.parseInt(downloadsResult.rows[0].total || "0"),
      }

      return NextResponse.json(stats)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
