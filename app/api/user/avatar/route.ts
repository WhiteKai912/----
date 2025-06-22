import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null

    if (!session?.user?.id) {
      console.error("Unauthorized: No session or user ID")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      console.error("No file provided in form data")
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      console.error(`Invalid file type: ${file.type}`)
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error(`File too large: ${file.size} bytes`)
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      )
    }

    try {
      // Читаем файл и конвертируем в base64
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`

      // Обновляем URL аватара в базе данных
      const client = await pool.connect()
      try {
        console.log("Updating user avatar in database for user:", session.user.id)
        
        const result = await client.query(
          `
          UPDATE users 
          SET 
            avatar_url = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING id, email, name, avatar_url, role
          `,
          [base64Image, session.user.id]
        )

        if (result.rows.length === 0) {
          console.error("User not found in database:", session.user.id)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("Avatar updated successfully for user:", session.user.id)

        return NextResponse.json({
          avatar_url: base64Image,
          user: result.rows[0]
        })
      } finally {
        client.release()
      }
    } catch (error) {
      console.error("Error processing image:", error)
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 