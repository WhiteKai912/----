import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const client = await pool.connect()
    try {
      // Базовый запрос
      let query = `
        SELECT 
          dh.id,
          t.id as track_id,
          t.title as track_title,
          a.name as artist_name,
          dh.downloaded_at,
          t.file_url
        FROM download_history dh
        JOIN tracks t ON dh.track_id = t.id
        JOIN artists a ON t.artist_id = a.id
        WHERE dh.user_id = $1
      `

      const params: any[] = [session.user.id]

      // Добавляем условие поиска
      if (search) {
        params.push(`%${search}%`)
        query += ` AND (t.title ILIKE $${params.length} OR a.name ILIKE $${params.length})`
      }

      // Добавляем сортировку и пагинацию
      query += `
        ORDER BY dh.downloaded_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      params.push(limit, offset)

      // Выполняем запрос
      const result = await client.query(query, params)

      // Получаем общее количество записей для пагинации
      let countQuery = `
        SELECT COUNT(*) 
        FROM download_history dh
        JOIN tracks t ON dh.track_id = t.id
        JOIN artists a ON t.artist_id = a.id
        WHERE dh.user_id = $1
      `
      if (search) {
        countQuery += ` AND (t.title ILIKE $2 OR a.name ILIKE $2)`
      }

      const countResult = await client.query(
        countQuery,
        search ? [session.user.id, `%${search}%`] : [session.user.id]
      )

      return NextResponse.json({
        downloads: result.rows,
        total: parseInt(countResult.rows[0].count)
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching download history:", error)
    return NextResponse.json(
      { error: "Failed to fetch download history" },
      { status: 500 }
    )
  }
}
