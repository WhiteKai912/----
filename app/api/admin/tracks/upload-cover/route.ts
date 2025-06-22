import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { pool } from "@/lib/database"
import type { CustomSession } from "@/types/session"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const trackId = formData.get("trackId") as string

    if (!file || !trackId) {
      return NextResponse.json(
        { error: "File and trackId are required" },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Создаем уникальное имя файла
    const ext = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${ext}`
    
    // Путь для сохранения
    const publicPath = join(process.cwd(), "public", "uploads", "covers")
    const filePath = join(publicPath, fileName)
    
    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Генерируем URL файла
    const coverUrl = `/uploads/covers/${fileName}`

    // Сохраняем в базу данных
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Обновляем обложку трека
      const result = await client.query(
        `UPDATE tracks 
         SET cover_url = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, cover_url`,
        [coverUrl, trackId]
      )

      if (result.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json(
          { error: "Track not found" },
          { status: 404 }
        )
      }

      await client.query('COMMIT')

      // Возвращаем URL для доступа к обложке
      return NextResponse.json({ 
        cover_url: coverUrl
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error uploading cover:", error)
    return NextResponse.json(
      { error: "Failed to upload cover" },
      { status: 500 }
    )
  }
} 