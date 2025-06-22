"use client"

import { useState, useRef } from "react"
import { Camera } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ImageCropper } from "@/components/image-cropper"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  onSelect: (file: File, previewUrl: string) => void
  previewUrl: string | null
  currentAvatarUrl?: string
  name?: string
}

export function AvatarUpload({ onSelect, previewUrl, currentAvatarUrl, name }: AvatarUploadProps) {
  const [tempImage, setTempImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите изображение")
      return
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Размер файла не должен превышать 5MB")
      return
    }

    // Создаем временный URL для изображения
    const reader = new FileReader()
    reader.onload = (event) => {
      // Предварительно загружаем изображение для проверки размеров
      const img = new Image()
      img.onload = () => {
        // Проверяем минимальные размеры изображения (например, 200x200 пикселей)
        if (img.width < 200 || img.height < 200) {
          alert("Изображение слишком маленькое. Минимальный размер: 200x200 пикселей")
          return
        }
        setTempImage(event.target?.result as string)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleCrop = async (croppedImage: string) => {
    try {
      setIsUploading(true)

      // Конвертируем base64 в File с сохранением качества
      const response = await fetch(croppedImage)
      const blob = await response.blob()
      
      // Создаем новый файл с правильным типом и именем
      const file = new File([blob], "avatar.jpg", { 
        type: "image/jpeg",
        lastModified: Date.now()
      })

      onSelect(file, croppedImage)
    } catch (error) {
      console.error("Error processing cropped image:", error)
      alert("Ошибка при обработке изображения")
    } finally {
      setIsUploading(false)
      setTempImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-lg">
          <Avatar className="w-full h-full">
            <AvatarImage 
              src={previewUrl || currentAvatarUrl || undefined} 
              className="w-full h-full object-cover"
              alt="Avatar"
            />
            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xl font-bold">
              {name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        <label 
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer",
            "transition-opacity duration-200",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {tempImage && (
        <ImageCropper
          image={tempImage}
          onCrop={handleCrop}
          onClose={() => {
            setTempImage(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ""
            }
          }}
        />
      )}
    </>
  )
} 