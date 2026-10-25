'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/Icon'

/**
 * Native app shell. Mobile gets a pinned bottom tab bar (thumb reach,
 * safe-area aware); desktop keeps each surface's own top navigation.
 * Immersive surfaces (live room, lesson player, admin, auth) opt out:
 * they own the full screen, exactly like a native app.
 */
const TABS: { label: string; href: string; icon: IconName; match: (p: string) => boolean }[] = [
  { label: 'Home', href: '/', icon: 'home', match: (p) => p === '/' },
  { label: 'Courses', href: '/courses', icon: 'book', match: (p) => p.startsWith('/courses') },
  { label: 'Live', href: '/live-classes', icon: 'live', match: (p) => p.startsWith('/live-classes') },
  { label: 'Store', href: '/store', icon: 'bag', match: (p) => p.startsWith('/store') },
  { label: 'My learning', href: '/dashboard', icon: 'learn', match: (p) => p.startsWith('/dashboard') },
]

function isImmersive(pathname: string): boolean {
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) return true
  if (pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')) return true
  if (pathname.includes('/room')) return true // live class room
  if (pathname.endsWith('/learn')) return true // lesson player
  return false
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  const immersive = isImmersive(pathname)

  if (immersive) return <>{children}</>

  return (
    <>
      <div className="pb-[76px] lg:pb-0">{children}</div>

      {/* Bottom tab bar: pinned, visible on arrival, never inside a scroll row */}
      <nav
        aria-label="Primary"
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-cream/10 bg-ink-900/95 backdrop-blur-xl lg:hidden"
      >
        <div className="grid grid-cols-5">
          {TABS.map((tab) => {
            const active = tab.match(pathname)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-meta font-semibold transition ${
                  active ? 'text-gold' : 'text-cream-faint hover:text-cream-dim'
                }`}
              >
                <Icon name={tab.icon} size={23} variant={active ? 'Bold' : 'Linear'} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
