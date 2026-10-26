'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icon'
import { useBrand } from '@/hooks/useBrand'

/** Shared top bar for public learning surfaces (catalog, course, store, live).
    One bar everywhere: the old pages each invented their own header, which
    is a big part of why the app read as generic. Desktop shows full links;
    mobile keeps brand, search shortcut and account, with the tab bar below. */
const LINKS: [string, string][] = [
  ['Courses', '/courses'],
  ['Live classes', '/live-classes'],
  ['Teachings', '/teachings'],
  ['Store', '/store'],
]

export function OduMark({ className = 'h-6 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 24" fill="none" className={className} aria-hidden="true">
      <circle cx="4" cy="3" r="1.6" fill="currentColor" />
      <rect x="9.4" y="1.6" width="4.6" height="2.8" rx="1.4" fill="currentColor" />
      <rect x="2" y="7.6" width="4.6" height="2.8" rx="1.4" fill="currentColor" />
      <circle cx="11.4" cy="9" r="1.6" fill="currentColor" />
      <circle cx="4" cy="15" r="1.6" fill="currentColor" />
      <rect x="9.4" y="13.6" width="4.6" height="2.8" rx="1.4" fill="currentColor" />
      <rect x="2" y="19.6" width="4.6" height="2.8" rx="1.4" fill="currentColor" />
      <circle cx="11.4" cy="21" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function PublicBar() {
  const pathname = usePathname() || '/'
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  // The wordmark is the tenant's own: logo if one is set, else their
  // organization name from brand_settings. IfaLode is only the fallback.
  const { brand } = useBrand()
  const orgName = brand?.display_name || 'IfaLode'

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <header className="pt-safe sticky top-0 z-50 border-b border-cream/10 bg-ink-950/92 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-gold">
          {brand?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo_url}
              alt={orgName}
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <>
              <OduMark />
              <span className="font-display text-title tracking-tight text-cream">
                {orgName}
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Sections">
          {LINKS.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`text-body font-medium transition ${
                pathname.startsWith(href)
                  ? 'text-cream'
                  : 'text-cream-dim hover:text-cream'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/courses"
            aria-label="Search courses"
            className="flex h-10 w-10 items-center justify-center rounded-full text-cream-dim transition hover:bg-cream/5 hover:text-cream lg:hidden"
          >
            <Icon name="search" size={20} />
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-[40px] items-center rounded-full bg-gold px-4 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              My learning
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden min-h-[40px] items-center px-3 text-body font-medium text-cream-dim transition hover:text-cream sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-[40px] items-center rounded-full bg-gold px-4 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Start learning
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
