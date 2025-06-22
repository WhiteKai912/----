import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

// GET endpoint для получения обложки плейлиста
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id
    const url = new URL(request.url)
    const version = url.searchParams.get('v')

    // Получаем данные обложки из базы
    const result = await pool.query(
      `SELECT cover_data, cover_type, cover_version 
       FROM playlists 
       WHERE id = $1 AND cover_data IS NOT NULL`,
      [playlistId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Обложка не найдена" },
        { status: 404 }
      )
    }

    const { cover_data, cover_type, cover_version } = result.rows[0]

    // Проверяем версию
    const requestedVersion = version ? parseInt(version) : null
    const currentVersion = cover_version ? parseInt(cover_version.toString()) : null

    // Если запрошена конкретная версия и она не совпадает с текущей,
    // возвращаем 304 Not Modified
    if (requestedVersion && currentVersion && requestedVersion !== currentVersion) {
      return new NextResponse(null, { status: 304 })
    }

    // Конвертируем base64 обратно в бинарные данные
    const buffer = Buffer.from(cover_data, 'base64')

    // Возвращаем изображение с правильным Content-Type и заголовками кэширования
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': cover_type,
        'Cache-Control': currentVersion ? 'public, max-age=31536000' : 'no-cache',
        'ETag': currentVersion ? `"${currentVersion}"` : 'no-cache',
        'Last-Modified': new Date().toUTCString()
      },
    })
  } catch (error) {
    console.error("Error fetching playlist cover:", error)
    return NextResponse.json(
      { error: "Ошибка при получении обложки плейлиста" },
      { status: 500 }
    )
  }
}

// POST endpoint для загрузки обложки плейлиста
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    // Проверяем права на редактирование плейлиста
    const playlist = await pool.query(
      "SELECT user_id FROM playlists WHERE id = $1",
      [params.id]
    )

    if (playlist.rowCount === 0) {
      return NextResponse.json(
        { error: "Плейлист не найден" },
        { status: 404 }
      )
    }

    if (playlist.rows[0].user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Нет прав на редактирование плейлиста" },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Файл не предоставлен" },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Разрешены только изображения" },
        { status: 400 }
      )
    }

    // Конвертируем файл в base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Сохраняем в базу данных
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Обновляем обложку плейлиста и добавляем версию
      const version = Date.now()
      const result = await client.query(
        `UPDATE playlists 
         SET cover_data = $1, 
             cover_type = $2,
             cover_version = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING id, cover_version`,
        [base64Image, file.type, version, params.id]
      )

      if (result.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: "Плейлист не найден" },
          { status: 404 }
        )
      }

      await client.query('COMMIT')

      // Возвращаем URL для доступа к обложке через API с версией
      const coverUrl = `/api/playlists/${params.id}/cover?v=${version}`
      
      return NextResponse.json({ 
        cover_url: coverUrl,
        cover_version: version
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error uploading playlist cover:", error)
    return NextResponse.json(
      { error: "Ошибка при загрузке обложки плейлиста" },
      { status: 500 }
    )
  }
} 