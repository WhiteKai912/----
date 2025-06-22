"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ImageCropperProps {
  image: string
  onCrop: (croppedImage: string) => void
  onClose: () => void
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  // Вычисляем оптимальный размер области обрезки
  const size = Math.min(mediaWidth, mediaHeight) * 0.8
  
  return centerCrop(
    makeAspectCrop(
      {
        unit: 'px',
        width: size,
        height: size,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ image, onCrop, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [loading, setLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const [zoom, setZoom] = useState(1)
  const [completedCrop, setCompletedCrop] = useState<Crop>()

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const initialCrop = centerAspectCrop(width, height, 1)
    setCrop(initialCrop)
    setCompletedCrop(initialCrop)
  }, [])

  const getCroppedImg = async (
    sourceImage: HTMLImageElement,
    crop: Crop,
    scale = 1
  ): Promise<string> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    // Получаем реальные размеры изображения
    const scaleX = sourceImage.naturalWidth / sourceImage.width
    const scaleY = sourceImage.naturalHeight / sourceImage.height

    // Устанавливаем размер холста с учетом масштабирования
    const targetSize = 192 // Увеличенный размер для лучшего качества
    canvas.width = targetSize
    canvas.height = targetSize

    // Включаем сглаживание
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Создаем круглую маску
    ctx.beginPath()
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2)
    ctx.clip()

    // Вычисляем размеры и позиции для обрезки
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    }

    // Применяем масштабирование
    const scaledSize = targetSize * scale

    // Рисуем изображение с учетом масштабирования
    ctx.drawImage(
      sourceImage,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      (targetSize - scaledSize) / 2,
      (targetSize - scaledSize) / 2,
      scaledSize,
      scaledSize
    )

    // Добавляем тонкую белую обводку
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(targetSize / 2, targetSize / 2, (targetSize / 2) - 0.5, 0, Math.PI * 2)
    ctx.stroke()

    // Создаем финальное изображение с уменьшенным размером
    const finalCanvas = document.createElement("canvas")
    const finalCtx = finalCanvas.getContext("2d")
    
    if (!finalCtx) {
      throw new Error("No 2d context")
    }

    // Устанавливаем конечный размер (96x96)
    finalCanvas.width = 96
    finalCanvas.height = 96

    // Включаем сглаживание для финального холста
    finalCtx.imageSmoothingEnabled = true
    finalCtx.imageSmoothingQuality = "high"

    // Создаем круглую маску для финального изображения
    finalCtx.beginPath()
    finalCtx.arc(48, 48, 48, 0, Math.PI * 2)
    finalCtx.clip()

    // Рисуем уменьшенное изображение
    finalCtx.drawImage(canvas, 0, 0, targetSize, targetSize, 0, 0, 96, 96)

    // Добавляем тонкую обводку
    finalCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    finalCtx.lineWidth = 1
    finalCtx.beginPath()
    finalCtx.arc(48, 48, 47.5, 0, Math.PI * 2)
    finalCtx.stroke()

    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"))
            return
          }
          resolve(URL.createObjectURL(blob))
        },
        "image/jpeg",
        0.95 // Высокое качество JPEG
      )
    })
  }

  const handleCrop = async () => {
    try {
      setLoading(true)
      if (imageRef.current && completedCrop?.width && completedCrop?.height) {
        const croppedImage = await getCroppedImg(imageRef.current, completedCrop, zoom)
        onCrop(croppedImage)
      }
    } catch (error) {
      console.error("Error cropping image:", error)
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[90vw]">
        <DialogHeader>
          <DialogTitle>Обрезать изображение</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative max-h-[60vh] overflow-auto bg-gray-50 dark:bg-gray-900 rounded-lg">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-w-full"
            >
              <img
                ref={imageRef}
                src={image}
                alt="Crop me"
                className="max-w-full"
                onLoad={onImageLoad}
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center'
                }}
              />
            </ReactCrop>
          </div>
          <div className="flex items-center gap-4 px-4">
            <span className="text-sm text-gray-500 min-w-[80px]">Масштаб:</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-500 min-w-[40px]">{zoom}x</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleCrop} disabled={loading || !completedCrop}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                "Применить"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 