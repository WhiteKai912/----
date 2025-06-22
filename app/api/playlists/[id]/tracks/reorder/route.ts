import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getPlaylistById, pool } from "@/lib/database"

interface ExtendedSession {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as ExtendedSession | null
    if (!session?.user) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const playlist = await getPlaylistById(params.id)
    if (!playlist) {
      return NextResponse.json(
        { error: "Плейлист не найден" },
        { status: 404 }
      )
    }

    if (playlist.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Нет прав на редактирование плейлиста" },
        { status: 403 }
      )
    }

    const { trackId, newPosition } = await request.json()

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      // Получаем текущую позицию трека
      const currentPositionResult = await client.query(
        "SELECT position FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2",
        [params.id, trackId]
      )

      if (currentPositionResult.rows.length === 0) {
        throw new Error("Трек не найден в плейлисте")
      }

      const currentPosition = currentPositionResult.rows[0].position

      // Обновляем позиции других треков
      if (newPosition > currentPosition) {
        // Перемещение вниз: сдвигаем треки между старой и новой позицией вверх
        await client.query(
          `
          UPDATE playlist_tracks 
          SET position = position - 1 
          WHERE playlist_id = $1 
            AND position > $2 
            AND position <= $3
          `,
          [params.id, currentPosition, newPosition]
        )
      } else {
        // Перемещение вверх: сдвигаем треки между новой и старой позицией вниз
        await client.query(
          `
          UPDATE playlist_tracks 
          SET position = position + 1 
          WHERE playlist_id = $1 
            AND position >= $2 
            AND position < $3
          `,
          [params.id, newPosition, currentPosition]
        )
      }

      // Устанавливаем новую позицию для перемещаемого трека
      await client.query(
        "UPDATE playlist_tracks SET position = $3 WHERE playlist_id = $1 AND track_id = $2",
        [params.id, trackId, newPosition]
      )

      // Обновляем время последнего изменения плейлиста
      await client.query(
        "UPDATE playlists SET updated_at = NOW() WHERE id = $1",
        [params.id]
      )

      await client.query("COMMIT")
      return NextResponse.json({ success: true })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error reordering tracks:", error)
    return NextResponse.json(
      { error: "Ошибка при изменении порядка треков" },
      { status: 500 }
    )
  }
} 