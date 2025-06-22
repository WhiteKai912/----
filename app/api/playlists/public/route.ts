import { type NextRequest, NextResponse } from "next/server"
import { getPublicPlaylists } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const result = await getPublicPlaylists(limit, (page - 1) * limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching public playlists:", error)
    return NextResponse.json({ error: "Failed to fetch public playlists" }, { status: 500 })
  }
}
