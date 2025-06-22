import { type NextRequest, NextResponse } from "next/server"
import { getAllTracks } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const genre = searchParams.get("genre") || "all"
    const sortBy = searchParams.get("sortBy") || "created_at"

    const offset = (page - 1) * limit

    const { tracks, total } = await getAllTracks(limit, offset, genre, sortBy)

    return NextResponse.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching tracks:", error)
    return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
  }
}
