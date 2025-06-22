import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT id, title, plays_count, downloads_count 
      FROM tracks 
      WHERE plays_count > 0
      ORDER BY plays_count DESC 
      LIMIT 10
    `)
    
    return NextResponse.json({ tracks: result.rows })
  } catch (error) {
    console.error("Error checking track stats:", error)
    return NextResponse.json(
      { error: "Failed to check track stats" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
} 