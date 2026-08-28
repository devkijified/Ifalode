'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

type Resource = {
  id: string
  type: 'PRAYER' | 'GUIDE' | 'REFERENCE' | 'READING AID'
  title: string
  description: string
  href: string
}

export default function ResourcesPage() {
  const { brand } = useBrand()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted) {
        setUser(user as User | null)
        setLoading(false)
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user as User | null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', close)

    return () => {
      document.removeEventListener('mousedown', close)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setAccountOpen(false)
    setUser(null)
    router.refresh()
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member'

  const firstName = displayName.split(' ')[0]

  const avatar =
    user?.user_metadata?.avatar_url ||
    null

  const PRIEST_NAME = 'Akinsoji Elebuibon'
  const PRIEST_TITLE = 'Ifá Priest'
  const TRADITION = 'Yoruba / Ifá tradition'
  const LOCATION = 'Nigeria, USA'

  const resources: Resource[] = [
    {
      id: 'morning-prayer',
      type: 'PRAYER',
      title: 'Morning prayer in Ifá',
      description:
        'A simple daily prayer to open your day, greet your Ori, and ask for protection and clarity.',
      href: '/resources/morning-prayer',
    },
    {
      id: 'ori-orientation',
      type: 'GUIDE',
      title: 'Working with your Ori',
      description:
        'Practical ways to honor and align with your inner head through simple daily practices.',
      href: '/resources/ori-orientation',
    },
    {
      id: 'odu-list',
      type: 'REFERENCE',
      title: 'The 16 principal Odu',
      description:
        'Names and brief meanings of the 16 principal Odu as a reference for students of Ifá.',
      href: '/resources/odu-list',
    },
    {
      id: 'ebo-guide',
      type: 'GUIDE',
      title: 'Understanding Ebó',
      description:
        'A short guide to the logic of offerings: why they are given and how they function.',
      href: '/resources/ebo-guide',
    },
    {
      id: 'reading-questions',
      type: 'READING AID',
      title: 'Questions for your reading',
      description:
        'Suggested questions to prepare before an Ifá consultation so you get the most from your session.',
      href: '/resources/reading-questions',
    },
    {
      id: 'altar-basics',
      type: 'GUIDE',
      title: 'Simple home altar basics',
      description:
        'How to set up a small, respectful space at home for prayer and offerings.',
      href: '/resources/altar-basics',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* ===================== HEADER ===================== */}

      <header className="fixed top-0 inset-x-0 z-50">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">

          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/10">

            <div className="h-full px-5 flex items-center justify-between">

              <Link
                href="/"
                className="shrink-0 text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              <div className="hidden lg:flex items-center gap-8 ml-10">

                <NavLink href="/">Home</NavLink>
                <NavLink href="/teachings">Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>

              </div>

              <div className="flex items-center gap-2 sm:gap-3">

                <Link
                  href="/resources"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Resources"
                >
                  📿
                </Link>

                {!loading && !user && (
                  <>
                    <Link
                      href="/login"
                      className="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/10"
                    >
                      Get Updates
                    </Link>
                  </>
                )}

                {!loading && user && (
                  <div ref={accountRef} className="relative">

                    <button
                      onClick={() => setAccountOpen(!accountOpen)}
                      className="flex items-center gap-2.5 rounded-xl pl-2 pr-2 py-1.5 hover:bg-slate-800 transition"
                    >

                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-sm font-bold">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">
                        {firstName}
                      </span>

                      <span
                        className={`text-slate-500 text-xs transition-transform ${
                          accountOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ▾
                      </span>

                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">

                        <div className="px-4 py-4 border-b border-slate-800">

                          <p className="text-sm font-semibold text-white truncate">
                            {displayName}
                          </p>

                          <p className="text-xs text-slate-500 truncate mt-1">
                            {user.email}
                          </p>

                        </div>

                        <div className="p-2">

                          <AccountLink
                            href="/dashboard"
                            icon="⌂"
                            label="Dashboard"
                          />

                          <AccountLink
                            href="/readings"
                            icon="📿"
                            label="My Readings"
                          />

                          <AccountLink
                            href="/profile"
                            icon="◉"
                            label="Profile"
                          />

                          <AccountLink
                            href="/settings"
                            icon="⚙"
                            label="Settings"
                          />

                          <div className="my-2 border-t border-slate-800" />

                          <button
                            onClick={signOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition"
                          >
                            <span>↪</span>
                            Sign Out
                          </button>

                        </div>

                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </nav>

        </div>

      </header>

      {/* ===================== HERO ===================== */}

      <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20">

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 left-[5%] w-72 h-72 rounded-full bg-brand-primary/10 blur-[120px]" />

          <div className="absolute top-40 right-[5%] w-96 h-96 rounded-full bg-brand-secondary/10 blur-[140px]" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2 mb-7">

              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />

              <span className="text-xs font-semibold text-brand-primary">
                Resources
              </span>

            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[.98] font-black tracking-[-0.045em]">

              Practical resources
              <br />
              <span className="text-brand-primary">
                for your path.
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-400">

              Prayers, guides, and references to support your daily practice and
              understanding of Ifá. These are complements to, not replacements
              for, personal consultation with a priest.

            </p>

          </div>

        </div>

      </section>

      {/* ===================== LIST ===================== */}

      <section className="pb-20 sm:pb-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}

          </div>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">

            <p className="text-sm text-slate-400">

              More resources will be added over time. If you have a specific
              need (for example, a prayer for a particular situation), you can
              mention it when you{' '}
              <Link href="/contact" className="text-brand-primary hover:underline">
                contact Akinsoji
              </Link>
              .

            </p>

          </div>

        </div>

      </section>

      {/* ===================== FOOTER ===================== */}

      <footer className="border-t border-slate-900 bg-slate-950">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

            <div className="lg:col-span-2">

              <Link
                href="/"
                className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                A spiritual home for Ifá teachings, consultations, and resources
                rooted in the {TRADITION}.
              </p>

            </div>

            <FooterColumn
              title="Explore"
              links={[
                ['Teachings', '/teachings'],
                ['Services', '/services'],
                ['Resources', '/resources'],
                ['About', '/about'],
              ]}
            />

            <FooterColumn
              title="Account"
              links={[
                ['Dashboard', '/dashboard'],
                ['Readings', '/readings'],
                ['Profile', '/profile'],
                ['Settings', '/settings'],
              ]}
            />

          </div>

          <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between gap-3">

            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} {brand?.display_name || PRIEST_NAME}.
              All rights reserved.
            </p>

            <div className="flex gap-5">

              <Link
                href="/privacy"
                className="text-xs text-slate-700 hover:text-slate-400 transition"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs text-slate-700 hover:text-slate-400 transition"
              >
                Terms
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}

/* ===================== COMPONENTS ===================== */

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`text-sm transition ${
        active ? 'text-white font-semibold' : 'text-slate-500 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function AccountLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  )
}

function ResourceCard({
  resource,
}: {
  resource: Resource
}) {
  return (
    <Link
      href={resource.href}
      className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition"
    >
      <span className="text-[10px] tracking-[.15em] text-brand-primary font-bold">

        {resource.type}

      </span>

      <h3 className="mt-3 text-lg font-bold group-hover:text-brand-primary transition">

        {resource.title}

      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">

        {resource.description}

      </p>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">

        <span className="text-brand-primary text-sm group-hover:translate-x-1 transition-transform">

          Open resource →

        </span>

      </div>
    </Link>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: [string, string][]
}) {
  return (
    <div>

      <h4 className="text-xs uppercase tracking-[.15em] text-slate-500 font-bold">

        {title}

      </h4>

      <div className="mt-4 space-y-3">

        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block text-sm text-slate-700 hover:text-slate-300 transition"
          >

            {label}

          </Link>
        ))}

      </div>

    </div>
  )
}
