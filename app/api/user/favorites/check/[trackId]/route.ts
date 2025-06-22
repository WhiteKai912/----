import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM user_favorites 
          WHERE user_id = $1 AND track_id = $2
        )`,
        [session.user.id, params.trackId]
      )

      return NextResponse.json({
        isInFavorites: result.rows[0].exists,
        timestamp: new Date().toISOString()
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return NextResponse.json(
      { 
        error: "Failed to check favorite status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 