import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { pool } from "@/lib/database"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: trackId } = params;
    
    // Получаем cover_url из базы данных
    const result = await pool.query(
      `SELECT cover_url 
       FROM tracks 
       WHERE id = $1`,
      [trackId]
    );

    if (!result.rowCount || !result.rows[0].cover_url) {
      console.log("Cover URL not found in DB for trackId:", trackId);
      return NextResponse.json(
        { error: "Cover not found" },
        { status: 404 }
      );
    }

    const coverUrl = result.rows[0].cover_url;
    const fileName = coverUrl.split('/').pop(); // Извлекаем имя файла из URL
    
    // Построение пути к файлу обложки на диске
    const coverPath = join(process.cwd(), "public", "uploads", "covers", fileName);

    let coverBuffer;
    try {
      coverBuffer = await readFile(coverPath);
    } catch (readError) {
      console.log("Cover file not found on disk at path:", coverPath);
      return NextResponse.json(
        { error: "Cover file not found on disk" },
        { status: 404 }
      );
    }

    // Определение Content-Type на основе расширения файла
    const ext = fileName.split('.').pop();
    let contentType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "gif") {
      contentType = "image/gif";
    } else if (ext === "webp") {
      contentType = "image/webp";
    }

    console.log("Sending response:", {
      bufferLength: coverBuffer.length,
      contentType: contentType,
    });

    // Возвращаем изображение с правильным Content-Type и заголовками кэширования
    return new NextResponse(coverBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error("Error fetching cover:", error);
    return NextResponse.json(
      { error: "Failed to fetch cover" },
      { status: 500 }
    );
  }
} 