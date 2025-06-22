import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"
import { pool } from "@/lib/database"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const trackId = formData.get("trackId") as string

    if (!file || !trackId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Проверяем формат файла
    if (!file.type.startsWith("audio/")) {
      return new NextResponse("Invalid file type", { status: 400 })
    }

    // Загружаем файл
    const blob = await put(`tracks/${file.name}`, file, {
      access: 'public',
    })

    // Обновляем трек в базе данных
    const client = await pool.connect()
    try {
      await client.query(
        "UPDATE tracks SET file_url = $1, file_size = $2, updated_at = NOW() WHERE id = $3",
        [blob.url, file.size, trackId]
      )
      return NextResponse.json({ file_url: blob.url })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error uploading audio:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 