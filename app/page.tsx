import { MusicCatalog } from "@/components/music-catalog"
import { Header } from "@/components/header"
import { Player } from "@/components/player"
import { HeroSection } from "@/components/hero-section"
import { FeaturedPlaylists } from "@/components/featured-playlists"
import { TrendingTracks } from "@/components/trending-tracks"
import { MobileNavigation } from "@/components/mobile-navigation"
import { MobilePlayer } from "@/components/mobile-player"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-900 transition-colors">
      {/* Desktop Header */}
      <div className="hidden md:block">
      <Header />
      </div>

      {/* Основной контент с отступом для мобильной навигации */}
      <div className="flex flex-col min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Hero Section с адаптивными отступами */}
        <section className="pt-4 md:pt-0">
      <HeroSection />
        </section>

        {/* Trending Tracks с адаптивными отступами */}
        <section className="mt-8 md:mt-16">
      <TrendingTracks />
        </section>

        {/* Featured Playlists с адаптивными отступами */}
        <section className="mt-8 md:mt-16">
      <FeaturedPlaylists />
        </section>

        {/* Main Catalog с адаптивными отступами и типографикой */}
        <main id="catalog" className="container mx-auto px-4 py-8 md:py-16 flex-grow">
          <div className="mb-8 md:mb-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 md:mb-4">
              Полный каталог музыки
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
            Исследуйте миллионы треков от независимых артистов и известных исполнителей
          </p>
        </div>
        <MusicCatalog />
      </main>
      </div>

      {/* Desktop Player */}
      <div className="hidden md:block">
      <Player />
      </div>

      {/* Mobile Player */}
      <div className="fixed bottom-16 left-0 right-0 z-40 block md:hidden">
        <MobilePlayer />
      </div>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
        <MobileNavigation />
      </div>
    </div>
  )
}
