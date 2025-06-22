import { type NextRequest, NextResponse } from "next/server"
import { incrementPlayCount } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()

    await incrementPlayCount(params.id, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error incrementing play count:", error)
    return NextResponse.json({ error: "Failed to increment play count" }, { status: 500 })
  }
}
