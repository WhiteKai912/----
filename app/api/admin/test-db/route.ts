import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT NOW()")
      return NextResponse.json({ 
        status: "success",
        timestamp: result.rows[0].now,
        connection: {
          database: pool.options.database,
          host: pool.options.host,
          port: pool.options.port,
          user: pool.options.user,
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ 
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 