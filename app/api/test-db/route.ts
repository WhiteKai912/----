import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const client = await pool.connect()
    try {
      // Проверяем подключение простым запросом
      const result = await client.query('SELECT NOW()')
      
      // Проверяем существование необходимых таблиц
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)
      
      const tables = tablesResult.rows.map(row => row.table_name)
      
      return NextResponse.json({ 
        status: 'connected',
        timestamp: result.rows[0].now,
        tables: tables,
        dbConfig: {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          port: process.env.DB_PORT
        }
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, { status: 500 })
  }
} 