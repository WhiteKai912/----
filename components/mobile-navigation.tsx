'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, Library, User } from 'lucide-react'
import { motion } from 'framer-motion'

export function MobileNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Главная' },
    { href: '/search', icon: Search, label: 'Поиск' },
    { href: '/playlists', icon: Library, label: 'Плейлисты' },
    { href: '/profile', icon: User, label: 'Профиль' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[4.5rem] bg-background/95 backdrop-blur-lg border-t border-border z-layer-navigation safe-area-bottom will-change-transform" style={{ WebkitTransform: 'translateZ(0)' }}>
      <div className="container h-full mx-auto px-4">
        <div className="flex items-center justify-around h-full max-w-md mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link 
                key={href} 
                href={href} 
                className={`mobile-nav-item relative ${active ? 'active' : ''}`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: active ? 1 : 0.9,
                    color: active ? 'rgb(34, 211, 238)' : 'rgb(148, 163, 184)'
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <Icon className="w-6 h-6" />
                    {active && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                        style={{ x: '-50%' }}
                      />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{label}</span>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
} 