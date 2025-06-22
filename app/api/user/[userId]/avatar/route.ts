import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        SELECT avatar
        FROM users
        WHERE id = $1
        `,
        [params.userId]
      )

      if (result.rows.length === 0 || !result.rows[0].avatar) {
        return new NextResponse(null, { status: 404 })
      }

      const avatar = result.rows[0].avatar

      return new NextResponse(avatar, {
        headers: {
          "Content-Type": "image/*",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching avatar:", error)
    return new NextResponse(null, { status: 500 })
  }
} 