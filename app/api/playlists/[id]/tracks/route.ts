import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getPlaylistTracks, addTrackToPlaylist, removeTrackFromPlaylist, getPlaylistById } from "@/lib/database"

interface Session {
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = params.id
    const session = await getServerSession(authOptions) as Session | null

    const playlist = await getPlaylistById(playlistId)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    // Check if user has access to this playlist
    if (!playlist.is_public && playlist.user_id !== session?.user?.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const tracks = await getPlaylistTracks(playlistId)
    console.log("API: Tracks fetched:", tracks.length)
    console.log("API: First track cover data:", tracks[0] ? {
      id: tracks[0].id,
      title: tracks[0].title,
      hasCoverData: !!tracks[0].cover_data,
      coverType: tracks[0].cover_type,
      coverUrl: tracks[0].cover_url
    } : null)

    return NextResponse.json({ tracks: tracks || [] })
  } catch (error) {
    console.error("Error fetching playlist tracks:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to fetch playlist tracks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { trackId } = await request.json()

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const playlist = await getPlaylistById(params.id)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.user_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    try {
      await addTrackToPlaylist(params.id, trackId)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Track not found or inactive") {
          return NextResponse.json({ error: "Трек не найден или недоступен" }, { status: 404 })
        }
        if (error.message === "Playlist not found") {
          return NextResponse.json({ error: "Плейлист не найден" }, { status: 404 })
        }
      }
      throw error
    }

    // Получаем обновленный список треков
    const updatedTracks = await getPlaylistTracks(params.id)

    return NextResponse.json({ 
      message: "Трек добавлен в плейлист",
      tracks: updatedTracks
    })
  } catch (error) {
    console.error("Error adding track to playlist:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to add track to playlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { trackId } = await request.json()

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const playlist = await getPlaylistById(params.id)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    if (playlist.user_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    try {
      await removeTrackFromPlaylist(params.id, trackId)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Track not found in playlist") {
          return NextResponse.json({ error: "Трек не найден в плейлисте" }, { status: 404 })
        }
      }
      throw error
    }

    // Получаем обновленный список треков
    const updatedTracks = await getPlaylistTracks(params.id)

    return NextResponse.json({ 
      message: "Трек удален из плейлиста",
      tracks: updatedTracks
    })
  } catch (error) {
    console.error("Error removing track from playlist:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to remove track from playlist" }, { status: 500 })
  }
}
