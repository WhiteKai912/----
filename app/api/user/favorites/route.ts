import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getUserFavorites, addToFavorites, removeFromFavorites } from "@/lib/database"
import type { CustomSession } from "@/types/session"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT 
          t.id,
          t.title,
          a.name as artist_name,
          al.title as album_title,
          t.duration,
          t.cover_url,
          t.file_url,
          f.created_at as favorited_at
        FROM user_favorites f
        JOIN tracks t ON f.track_id = t.id
        JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        `,
        [session.user.id]
      )

      return NextResponse.json({
        favorites: result.rows,
        timestamp: new Date().toISOString()
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch favorites",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/user/favorites - Start")
    const session = await getServerSession(authOptions) as CustomSession | null
    console.log("Session:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id
    })

    if (!session?.user?.id) {
      console.log("Unauthorized - no user ID in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)

    const { trackId } = body
    if (!trackId) {
      console.log("Bad request - no trackId in body")
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      console.log("Adding to favorites:", { userId: session.user.id, trackId })
      await client.query(
        "INSERT INTO user_favorites (user_id, track_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [session.user.id, trackId]
      )
      console.log("Successfully added to favorites")
      return NextResponse.json({ message: "Добавлено в избранное" })
    } catch (error) {
      console.error("Database error:", error)
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Add to favorites error:", error)
    return NextResponse.json(
      { 
        error: "Failed to add to favorites",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { trackId } = await request.json()

    const client = await pool.connect()
    try {
      await client.query(
        "DELETE FROM user_favorites WHERE user_id = $1 AND track_id = $2",
        [session.user.id, trackId]
      )
      return NextResponse.json({ message: "Удалено из избранного" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Remove from favorites error:", error)
    return NextResponse.json(
      { 
        error: "Failed to remove from favorites",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
