import { type NextRequest, NextResponse } from "next/server"
import { getTrendingTracks } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const tracks = await getTrendingTracks(limit)

    return NextResponse.json({ tracks: tracks || [] })
  } catch (error) {
    console.error("Error fetching trending tracks:", error)
    return NextResponse.json({ tracks: [], error: "Failed to fetch trending tracks" }, { status: 500 })
  }
}
