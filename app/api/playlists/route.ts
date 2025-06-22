import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPlaylist, getUserPlaylists } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const result = await getUserPlaylists(session.user.id, limit, (page - 1) * limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching playlists:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, isPublic } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Название плейлиста обязательно" }, { status: 400 })
    }

    const playlist = await createPlaylist({
      name,
      description,
      userId: session.user.id,
      isPublic: isPublic || false,
    })

    return NextResponse.json({
      message: "Плейлист создан",
      playlist,
    })
  } catch (error) {
    console.error("Error creating playlist:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}
