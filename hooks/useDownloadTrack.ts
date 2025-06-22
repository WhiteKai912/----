import { useState } from 'react'
import { useSession } from 'next-auth/react'
import type { CustomSession } from '@/types/session'

export function useDownloadTrack() {
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set())
  const { data: session } = useSession()

  const downloadTrack = async (trackId: string) => {
    console.log("Starting download for track:", trackId)
    console.log("Session:", { 
      hasSession: !!session,
      userId: (session as unknown as CustomSession)?.user?.id
    })

    setDownloadingTracks((prev) => new Set(prev).add(trackId))

    try {
      console.log("Sending download request...")
      const response = await fetch(`/api/tracks/${trackId}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: (session as unknown as CustomSession)?.user?.id }),
      })

      console.log("Download response status:", response.status)
      const data = await response.json()
      console.log("Download response data:", data)

      if (data.downloadUrl) {
        console.log("Creating download link for URL:", data.downloadUrl)
        const link = document.createElement("a")
        link.href = data.downloadUrl.startsWith('http') ? data.downloadUrl : `${window.location.origin}${data.downloadUrl}`
        link.download = data.filename || "track.mp3"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log("Download initiated successfully")
      } else {
        console.error("No download URL in response")
      }
    } catch (error) {
      console.error("Error downloading track:", error)
    } finally {
      setDownloadingTracks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(trackId)
        return newSet
      })
    }
  }

  return {
    downloadTrack,
    downloadingTracks,
    isDownloading: (trackId: string) => downloadingTracks.has(trackId)
  }
} 