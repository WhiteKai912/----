import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pool from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT DISTINCT p.id
        FROM playlists p
        JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE pt.track_id = $1 AND p.user_id = $2
      `,
        [params.id, session.user.id],
      )

      const playlistIds = result.rows.map((row) => row.id)
      return NextResponse.json({ playlistIds })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching track playlists:", error)
    return NextResponse.json({ error: "Failed to fetch track playlists" }, { status: 500 })
  }
}
