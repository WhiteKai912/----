import { type NextRequest, NextResponse } from "next/server"
import { getFeaturedPlaylists } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "8")

    const playlists = await getFeaturedPlaylists(limit)
    console.log("API: Featured playlists:", playlists?.map(p => ({
      id: p.id,
      name: p.name,
      hasTracks: p.tracks?.length || 0,
      firstTrackCover: p.tracks?.[0] ? {
        hasCoverUrl: !!p.tracks[0].cover_url
      } : null
    })) || [])

    // Убедимся, что всегда возвращаем массив
    return new NextResponse(
      JSON.stringify({ playlists: Array.isArray(playlists) ? playlists : [] }), 
      { 
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  } catch (error) {
    console.error("Error fetching featured playlists:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    // Возвращаем ошибку с кодом 500
    return NextResponse.json({ 
      error: "Failed to fetch featured playlists" 
    }, { status: 500 })
  }
}
