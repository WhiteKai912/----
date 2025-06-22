import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trackId = params.id
    const { 
      title, 
      artist_name, 
      album_title,
      genre_ids,
      is_active,
      cover_url,
      file_url,
      duration,
      file_size 
    } = await request.json()

    // Проверка обязательных полей
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Начинаем транзакцию
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Если указано имя исполнителя, создаем или находим исполнителя
      let artistId = null
      if (artist_name) {
        const artistResult = await client.query(`
          INSERT INTO artists (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [artist_name])
        artistId = artistResult.rows[0].id
      }

      // Если указано название альбома, создаем или находим альбом
      let albumId = null
      if (album_title && artistId) {
        const albumResult = await client.query(`
          INSERT INTO albums (title, artist_id)
          VALUES ($1, $2)
          ON CONFLICT (title, artist_id) DO UPDATE SET title = EXCLUDED.title
          RETURNING id
        `, [album_title, artistId])
        albumId = albumResult.rows[0].id
      }

      // Обновляем информацию о треке
      const updateFields = []
      const updateValues = []
      let valueCounter = 1

      updateFields.push(`title = $${valueCounter}`)
      updateValues.push(title)
      valueCounter++

      if (artistId !== null) {
        updateFields.push(`artist_id = $${valueCounter}`)
        updateValues.push(artistId)
        valueCounter++
      }

      if (albumId !== null) {
        updateFields.push(`album_id = $${valueCounter}`)
        updateValues.push(albumId)
        valueCounter++
      }

      if (cover_url !== undefined) {
        updateFields.push(`cover_url = $${valueCounter}`)
        updateValues.push(cover_url)
        valueCounter++
      }

      if (file_url !== undefined) {
        updateFields.push(`file_url = $${valueCounter}`)
        updateValues.push(file_url)
        valueCounter++
      }

      if (duration !== undefined) {
        updateFields.push(`duration = $${valueCounter}`)
        updateValues.push(duration)
        valueCounter++
      }

      if (file_size !== undefined) {
        updateFields.push(`file_size = $${valueCounter}`)
        updateValues.push(file_size)
        valueCounter++
      }

      if (is_active !== undefined) {
        updateFields.push(`is_active = $${valueCounter}`)
        updateValues.push(is_active)
        valueCounter++
      }

      updateFields.push(`updated_at = NOW()`)

      // Добавляем id трека в конец массива значений
      updateValues.push(trackId)

      const updateTrackQuery = `
        UPDATE tracks 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueCounter}
        RETURNING *
      `
      console.log('Executing update track query:', updateTrackQuery)
      console.log('Query parameters:', updateValues)

      const result = await client.query(updateTrackQuery, updateValues)

      if (result.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: "Track not found" },
          { status: 404 }
        )
      }

      // Если предоставлены новые жанры, обновляем их
      if (genre_ids && Array.isArray(genre_ids) && genre_ids.length > 0) {
        // Удаляем старые связи с жанрами
        await client.query('DELETE FROM track_genres WHERE track_id = $1', [trackId])
        
        // Добавляем новые жанры
        const genreValues = genre_ids.map((_, i) => `($1, $${i + 2})`).join(', ')
        const genreQuery = `
          INSERT INTO track_genres (track_id, genre_id)
          VALUES ${genreValues}
        `
        console.log('Executing genre update query:', genreQuery)
        console.log('Genre parameters:', [trackId, ...genre_ids])
        
        await client.query(genreQuery, [trackId, ...genre_ids])
      }

      await client.query('COMMIT')

      // Получаем обновленные данные трека вместе с жанрами и связанной информацией
      const updatedTrack = await client.query(`
        SELECT 
          t.*,
          a.name as artist_name,
          al.title as album_title,
          STRING_AGG(g.name, ', ') as genres
        FROM tracks t
        LEFT JOIN artists a ON t.artist_id = a.id
        LEFT JOIN albums al ON t.album_id = al.id
        LEFT JOIN track_genres tg ON t.id = tg.track_id
        LEFT JOIN genres g ON tg.genre_id = g.id
        WHERE t.id = $1
        GROUP BY t.id, a.name, al.title
      `, [trackId])

      return NextResponse.json({
        message: "Track updated successfully",
        track: updatedTrack.rows[0]
      })
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error in transaction:', error)
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating track:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}