import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const genres = await pool.query(`
      SELECT id, name 
      FROM genres 
      ORDER BY name ASC
    `)

    return NextResponse.json({ genres: genres.rows })
  } catch (error) {
    console.error("Error fetching genres:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
