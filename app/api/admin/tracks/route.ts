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
    const genre = searchParams.get('genre') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Базовый запрос
    let query = `
      SELECT 
        t.*,
        a.name as artist_name,
        al.title as album_title,
        COALESCE(t.plays_count, 0) as plays_count,
        COALESCE(t.downloads_count, 0) as downloads_count,
        STRING_AGG(g.name, ', ') as genres
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      LEFT JOIN albums al ON t.album_id = al.id
      LEFT JOIN track_genres tg ON t.id = tg.track_id
      LEFT JOIN genres g ON tg.genre_id = g.id
    `

    const params: any[] = []
    let whereConditions = []

    // Добавляем условие поиска
    if (search) {
      params.push(`%${search}%`)
      whereConditions.push(`(
        t.title ILIKE $${params.length} OR 
        a.name ILIKE $${params.length} OR 
        al.title ILIKE $${params.length}
      )`)
    }

    // Добавляем фильтр по жанру
    if (genre && genre !== 'all') {
      params.push(genre)
      whereConditions.push(`g.id = $${params.length}`)
    }

    // Добавляем WHERE условия, если они есть
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }

    // Добавляем группировку и сортировку
    query += `
      GROUP BY t.id, a.name, al.title
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(limit, offset)

    // Выполняем запрос
    const client = await pool.connect()
    try {
      const result = await client.query(query, params)

      // Получаем общее количество треков для пагинации
      let countQuery = `
        SELECT COUNT(DISTINCT t.id) 
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        LEFT JOIN track_genres tg ON t.id = tg.track_id
        LEFT JOIN genres g ON tg.genre_id = g.id
      `
      if (whereConditions.length > 0) {
        countQuery += ' WHERE ' + whereConditions.join(' AND ')
      }
      const countResult = await client.query(countQuery, params.slice(0, -2))

      return NextResponse.json({
        tracks: result.rows,
        total: parseInt(countResult.rows[0].count)
      })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const trackId = data.trackId

    if (!trackId) {
      return NextResponse.json(
        { error: "Track ID is required" },
        { status: 400 }
      )
    }

    // Начинаем транзакцию
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Удаляем связанные данные
      await client.query('DELETE FROM play_history WHERE track_id = $1', [trackId])
      await client.query('DELETE FROM download_history WHERE track_id = $1', [trackId])
      await client.query('DELETE FROM user_favorites WHERE track_id = $1', [trackId])
      await client.query('DELETE FROM playlist_tracks WHERE track_id = $1', [trackId])
      await client.query('DELETE FROM track_genres WHERE track_id = $1', [trackId])
      
      // Удаляем сам трек
      const result = await client.query('DELETE FROM tracks WHERE id = $1 RETURNING id', [trackId])
      
      if (result.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: "Track not found" },
          { status: 404 }
        )
      }

      await client.query('COMMIT')
      return NextResponse.json({ message: "Track deleted successfully" })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting track:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    const { id, title, artist_name, album_title, genre_id, is_active } = data

    if (!id || !title || !artist_name) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Получаем или создаем артиста
      const artistResult = await client.query(
        'INSERT INTO artists (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id',
        [artist_name]
      )
      const artistId = artistResult.rows[0].id

      // Получаем или создаем альбом, если он указан
      let albumId = null
      if (album_title) {
        const albumResult = await client.query(
          'INSERT INTO albums (title, artist_id) VALUES ($1, $2) ON CONFLICT (title, artist_id) DO UPDATE SET title = $1 RETURNING id',
          [album_title, artistId]
        )
        albumId = albumResult.rows[0].id
      }

      // Обновляем трек
      await client.query(
        `
        UPDATE tracks 
        SET title = $1,
            artist_id = $2,
            album_id = $3,
            is_active = $4,
            updated_at = NOW()
        WHERE id = $5
        `,
        [title, artistId, albumId, is_active, id]
      )

      // Обновляем жанры трека
      if (genre_id) {
        await client.query('DELETE FROM track_genres WHERE track_id = $1', [id])
        await client.query(
          'INSERT INTO track_genres (track_id, genre_id) VALUES ($1, $2)',
          [id, genre_id]
        )
      }

      await client.query('COMMIT')

      // Получаем обновленный трек со всеми связями
      const result = await client.query(
        `
        SELECT 
          t.*,
          a.name as artist_name,
          al.title as album_title,
          STRING_AGG(g.name, ', ') as genre_name
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        LEFT JOIN track_genres tg ON t.id = tg.track_id
        LEFT JOIN genres g ON tg.genre_id = g.id
        WHERE t.id = $1
        GROUP BY t.id, a.name, al.title
        `,
        [id]
      )

      return NextResponse.json(result.rows[0])
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating track:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// Обработчик для изменения статуса трека (активен/скрыт)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    const { trackId, isActive } = data

    if (!trackId || typeof isActive !== "boolean") {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query(
        "UPDATE tracks SET is_active = $1, updated_at = NOW() WHERE id = $2",
        [isActive, trackId]
      )
      return NextResponse.json({ success: true })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating track status:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
