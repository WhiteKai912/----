"use server"

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool, getPlaylistById, getPlaylistTracks, updatePlaylist, deletePlaylist } from "@/lib/database"

interface ExtendedSession {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await getPlaylistById(params.id)
    
    if (!playlist) {
      return NextResponse.json({ error: "Плейлист не найден" }, { status: 404 })
    }

    return NextResponse.json({ playlist })
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json(
      { error: "Ошибка при получении плейлиста" },
      { status: 500 }
    )
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

    const data = await request.json()
    const updatedPlaylist = await updatePlaylist(params.id, {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic,
    })

    return NextResponse.json({ playlist: updatedPlaylist })
  } catch (error) {
    console.error("Error updating playlist:", error)
    return NextResponse.json(
      { error: "Ошибка при обновлении плейлиста" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: "Нет прав на удаление плейлиста" },
        { status: 403 }
      )
    }

    await deletePlaylist(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return NextResponse.json(
      { error: "Ошибка при удалении плейлиста" },
      { status: 500 }
    )
  }
}
