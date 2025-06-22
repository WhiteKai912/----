"use client"

import { useMobile } from "@/hooks/use-mobile"
import { Player } from "@/components/player"
import { MobilePlayer } from "@/components/mobile-player"

export function AdaptivePlayer() {
  const isMobile = useMobile()

  if (isMobile) {
    return <MobilePlayer />
  }

  return <Player />
}

export default AdaptivePlayer
