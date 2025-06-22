import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  const client = await pool.connect()
  try {
    // Проверяем наличие таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `)
    const tables = tablesResult.rows.map(row => row.table_name)

    // Проверяем наличие расширений
    const extensionsResult = await client.query(`
      SELECT extname 
      FROM pg_extension
    `)
    const extensions = extensionsResult.rows.map(row => row.extname)

    // Проверяем количество жанров
    const genresResult = await client.query('SELECT COUNT(*) as count FROM genres')
    const genresCount = parseInt(genresResult.rows[0].count)

    // Проверяем наличие админа
    const adminResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE role = 'admin'
    `)
    const adminCount = parseInt(adminResult.rows[0].count)

    return NextResponse.json({
      status: "success",
      database: pool.options.database,
      tables: {
        expected: [
          "users",
          "genres",
          "artists",
          "albums",
          "tracks",
          "playlists",
          "playlist_tracks",
          "user_favorites",
          "play_history",
          "download_history"
        ],
        found: tables
      },
      extensions: {
        expected: ["uuid-ossp", "pgcrypto"],
        found: extensions
      },
      data: {
        genresCount,
        adminCount
      }
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json({ 
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  } finally {
    client.release()
  }
} 