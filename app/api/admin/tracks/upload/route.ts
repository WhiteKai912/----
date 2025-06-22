import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createTrack } from "@/lib/database"
import { writeFile, mkdir, access, constants } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import type { CustomSession } from "@/types/session"

async function ensureDirectoryExists(dir: string) {
  try {
    await access(dir, constants.W_OK)
  } catch (error) {
    try {
      await mkdir(dir, { recursive: true })
    } catch (mkdirError) {
      console.error(`Error creating directory ${dir}:`, mkdirError)
      throw new Error(`Failed to create directory ${dir}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting track upload process...")

    // Проверка авторизации
    const session = await getServerSession(authOptions) as CustomSession | null
    console.log("Session:", session)

    if (!session || !session.user || session.user.role !== "admin") {
      console.log("Unauthorized access attempt:", { session })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Получение данных формы
    const formData = await request.formData()
    console.log("Form data received:", {
      title: formData.get("title"),
      artistName: formData.get("artistName"),
      albumTitle: formData.get("albumTitle"),
      genreId: formData.get("genreId"),
      hasAudioFile: formData.has("audioFile"),
      hasCoverFile: formData.has("coverFile"),
    })

    const title = formData.get("title") as string
    const artistName = formData.get("artistName") as string
    const albumTitle = formData.get("albumTitle") as string
    const genreId = formData.get("genreId") as string
    const audioFile = formData.get("audioFile") as File
    const coverFile = formData.get("coverFile") as File | null

    // Валидация
    if (!title || !artistName || !audioFile) {
      console.log("Validation failed:", { title, artistName, hasAudioFile: !!audioFile })
      return NextResponse.json({ error: "Обязательные поля: название, исполнитель, аудио файл" }, { status: 400 })
    }

    if (!audioFile.type.startsWith("audio/")) {
      console.log("Invalid audio file type:", audioFile.type)
      return NextResponse.json({ error: "Неверный тип аудио файла" }, { status: 400 })
    }

    if (coverFile && !coverFile.type.startsWith("image/")) {
      console.log("Invalid cover file type:", coverFile.type)
      return NextResponse.json({ error: "Неверный тип файла обложки" }, { status: 400 })
    }

    // Создание директорий для загрузки
    const uploadsDir = join(process.cwd(), "public", "uploads")
    const audioDir = join(uploadsDir, "audio")

    console.log("Creating directories:", { uploadsDir, audioDir })

    try {
      await ensureDirectoryExists(audioDir)
      console.log("Directories created successfully")
    } catch (error) {
      console.error("Error ensuring directories exist:", error)
      return NextResponse.json({ 
        error: "Ошибка при создании директорий для загрузки",
        details: error instanceof Error ? error.message : undefined
      }, { status: 500 })
    }

    // Генерация уникальных имен файлов
    const audioId = uuidv4()
    const audioExtension = audioFile.name.split(".").pop()
    const audioFileName = `${audioId}.${audioExtension}`
    const audioPath = join(audioDir, audioFileName)
    const audioUrl = `/uploads/audio/${audioFileName}`

    console.log("Generated file paths:", { audioPath, audioUrl })

    // Сохранение аудио файла
    try {
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    await writeFile(audioPath, audioBuffer)
      console.log("Audio file saved successfully")
    } catch (error) {
      console.error("Error saving audio file:", error)
      return NextResponse.json({ 
        error: "Ошибка при сохранении аудио файла",
        details: error instanceof Error ? error.message : undefined
      }, { status: 500 })
    }

    // Обработка файла обложки
    let coverData: string | null = null;
    let coverType: string | null = null;
    let coverVersion: number | null = null;

    if (coverFile) {
      try {
        const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
        coverData = coverBuffer.toString('base64');
        coverType = coverFile.type;
        coverVersion = Date.now(); // Генерируем новую версию
        console.log("Cover file processed to base64");
      } catch (error) {
        console.error("Error processing cover file:", error);
        // Не возвращаем ошибку, так как обложка не обязательна
      }
    }

    // Получение длительности аудио из формы
    const duration = Number(formData.get("duration")) || 0
    if (!duration) {
      console.log("Invalid duration:", duration)
      return NextResponse.json({ error: "Не удалось определить длительность трека" }, { status: 400 })
    }

    // Создание трека в базе данных
    try {
      console.log("Creating track in database:", {
        title,
        artistName,
        albumTitle,
        genreId,
        fileUrl: audioUrl,
        coverData: !!coverData, // Логируем наличие данных
        coverType,
        coverVersion,
        duration,
        fileSize: audioFile.size,
      })

    const track = await createTrack({
      title,
      artistName,
      albumTitle: albumTitle || null,
      genreId: genreId || null,
      fileUrl: audioUrl,
      coverData,
      coverType,
      coverVersion,
      duration,
      fileSize: audioFile.size,
    })

      console.log("Track created successfully:", track)

    return NextResponse.json({
      message: "Трек успешно загружен",
      track,
    })
    } catch (error) {
      console.error("Error creating track in database:", error)
      return NextResponse.json({ 
        error: "Ошибка при сохранении трека в базе данных",
        details: error instanceof Error ? error.message : undefined
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Track upload error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Ошибка при загрузке трека",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
