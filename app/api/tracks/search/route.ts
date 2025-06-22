import { type NextRequest, NextResponse } from "next/server"
import { searchTracks, searchPlaylists } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    console.log("Search request received with query:", query)

    if (!query) {
      console.log("Empty search query")
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    console.log("Starting parallel search for tracks and playlists...")
    
    try {
    // Поиск треков и плейлистов параллельно
    const [tracks, playlists] = await Promise.all([searchTracks(query), searchPlaylists(query)])
      
      console.log(`Search completed. Found ${tracks.length} tracks and ${playlists.length} playlists`)

    return NextResponse.json({ tracks, playlists })
    } catch (searchError) {
      console.error("Error during search operations:", {
        error: searchError,
        message: searchError instanceof Error ? searchError.message : "Unknown error",
        stack: searchError instanceof Error ? searchError.stack : undefined
      })
      throw searchError
    }
  } catch (error) {
    console.error("Error in search route:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: "Failed to search",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
