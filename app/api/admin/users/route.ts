import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function GET(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Базовый запрос
    let query = `
      SELECT 
        u.*,
        COUNT(DISTINCT d.id) as downloads_count,
        COUNT(DISTINCT p.id) as playlists_count
      FROM users u
      LEFT JOIN download_history d ON u.id = d.user_id
      LEFT JOIN playlists p ON u.id = p.user_id
    `

    const params: any[] = []
    let whereConditions = []

    // Добавляем условие поиска
    if (search) {
      params.push(`%${search}%`)
      whereConditions.push(`(
        u.email ILIKE $${params.length} OR 
        u.name ILIKE $${params.length}
      )`)
    }

    // Добавляем WHERE условия, если они есть
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }

    // Добавляем группировку и сортировку
    query += `
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(limit, offset)

    // Выполняем запрос
    const client = await pool.connect()
    try {
      const result = await client.query(query, params)

      // Получаем общее количество пользователей для пагинации
      let countQuery = `SELECT COUNT(*) FROM users u`
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ')
      }
      const countResult = await client.query(countQuery, params.slice(0, -2))

      return NextResponse.json({
        users: result.rows,
        total: parseInt(countResult.rows[0].count)
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { userId, isActive } = data

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await pool.query(
      "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2",
      [isActive, userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
