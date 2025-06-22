import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET() {
  try {
    console.log("GET /api/user/profile - Start")
    const session = await getServerSession(authOptions) as CustomSession | null
    console.log("Session:", { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email ? '[REDACTED]' : null
    })

    if (!session?.user?.id) {
      console.log("Unauthorized - no user ID in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
      console.log("Executing database query...")
      const result = await client.query(
        `
        SELECT 
          id,
          email,
          name,
          avatar_url,
          role,
          created_at,
          updated_at
        FROM users 
        WHERE id = $1
        `,
        [session.user.id]
      )
      console.log("Query executed, rows:", result.rowCount)

      if (result.rows.length === 0) {
        console.log("User not found in database")
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const user = result.rows[0]
      console.log("User found:", {
        id: user.id,
        email: '[REDACTED]',
        hasName: !!user.name,
        hasAvatar: !!user.avatar_url,
        role: user.role
      })

      return NextResponse.json({ 
        user,
        timestamp: new Date().toISOString()
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error in GET /api/user/profile:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch user profile",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { name } = data

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required and must be a string" },
        { status: 400 }
      )
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        UPDATE users 
        SET 
          name = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, name, avatar_url, role
        `,
        [name, session.user.id]
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({ user: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    )
  }
}
