import { type NextRequest, NextResponse } from "next/server"
import { incrementDownloadCount, getTrackById } from "@/lib/database"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { CustomSession } from "@/types/session"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Download request for track:", params.id)
    const session = await getServerSession(authOptions) as CustomSession | null
    const { userId } = await request.json()

    console.log("Getting track from database...")
    const track = await getTrackById(params.id)
    console.log("Track found:", { 
      id: track?.id, 
      title: track?.title,
      hasFileUrl: !!track?.file_url,
      fileUrl: track?.file_url
    })

    if (!track) {
      console.log("Track not found")
      return NextResponse.json({ error: "Track not found" }, { status: 404 })
    }

    if (!track.file_url) {
      console.log("Track file URL is missing")
      return NextResponse.json({ error: "Track file not found" }, { status: 404 })
    }

    try {
      console.log("Incrementing download count...")
      await incrementDownloadCount(params.id, session?.user?.id || userId)
      console.log("Download count incremented successfully")
    } catch (error) {
      console.error("Error incrementing download count:", error)
      // Продолжаем выполнение, так как это не критическая ошибка
    }

    // Формируем красивое имя файла
    let filename = "track.mp3"
    if (track.title) {
      if (track.artist_name) {
        filename = `${track.artist_name} - ${track.title}.mp3`
      } else {
        filename = `${track.title}.mp3`
      }
    }
    // Удаляем недопустимые символы для имени файла
    filename = filename.replace(/[\\/:*?"<>|]+/g, "_")
    console.log("Sending download response with URL:", track.file_url, "filename:", filename)

    return NextResponse.json({
      success: true,
      downloadUrl: track.file_url,
      filename: filename,
    })
  } catch (error) {
    console.error("Error processing download:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 })
  }
}
