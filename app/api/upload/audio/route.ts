import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { CustomSession } from "@/types/session"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Проверка типа файла
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      )
    }

    // Создаем уникальное имя файла
    const ext = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${ext}`
    
    // Путь для сохранения
    const publicPath = join(process.cwd(), "public", "uploads", "audio")
    const filePath = join(publicPath, fileName)
    
    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    // Возвращаем URL файла
    const fileUrl = `/uploads/audio/${fileName}`
    
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Error uploading audio:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 