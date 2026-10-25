'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useBrand } from '@/hooks/useBrand'
import { OduMark } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/primitives'

const LINKS: { label: string; href: string; match: (p: string) => boolean }[] = [
  { label: 'My learning', href: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Courses', href: '/courses', match: (p) => p.startsWith('/courses') },
  { label: 'Live classes', href: '/live-classes', match: (p) => p.startsWith('/live-classes') },
  { label: 'Store', href: '/store', match: (p) => p.startsWith('/store') },
  { label: 'Referrals', href: '/dashboard/referrals', match: (p) => p.startsWith('/dashboard/referrals') },
  { label: 'Support', href: '/dashboard/support', match: (p) => p.startsWith('/dashboard/support') },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const router = useRouter()
  const pathname = usePathname() || '/'
  const supabase = createClient()
  const { brand } = useBrand()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setLoading(false)

      fetch('/api/notifications')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && typeof d.unread === 'number') setUnread(d.unread)
        })
        .catch(() => {})
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 text-cream">
        <header className="pt-safe sticky top-0 z-50 border-b border-cream/10 bg-ink-950/92 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="mt-3 h-5 w-96 max-w-full" />
          <div className="mt-8 space-y-4">
            <Skeleton className="aspect-[16/7] w-full sm:aspect-[16/5]" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || brand?.display_name || 'IfaLode'
  const initial = String(displayName).charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <header className="pt-safe sticky top-0 z-50 border-b border-cream/10 bg-ink-950/92 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-gold">
            <OduMark />
            <span className="font-display text-title tracking-tight text-cream">
              {brand?.display_name || 'IfaLode'}
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Dashboard">
            {LINKS.map((link) => {
              const active = link.match(pathname)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-body font-medium transition ${
                    active ? 'text-cream' : 'text-cream-dim hover:text-cream'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/admin"
              className={`text-body font-medium transition ${
                pathname.startsWith('/admin') ? 'text-cream' : 'text-cream-dim hover:text-cream'
              }`}
            >
              Admin
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-cream-dim transition hover:bg-cream/5 hover:text-cream"
            >
              <Icon name="bell" size={21} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-live px-1 text-meta font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display text-body text-ink-950"
              aria-label="Your profile"
              title={displayName}
            >
              {initial}
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-cream/15 px-3 text-body font-semibold text-cream-dim transition hover:border-cream/30 hover:text-cream sm:px-4"
            >
              <Icon name="logout" size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
