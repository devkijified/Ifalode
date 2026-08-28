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

export default function AboutPage() {
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed top-0 inset-x-0 z-50">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">

          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/10">

            <div className="h-full px-5 flex items-center justify-between">

              {/* Logo */}
              <Link
                href="/"
                className="shrink-0 text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              {/* Desktop navigation */}
              <div className="hidden lg:flex items-center gap-8 ml-10">

                <NavLink href="/">Home</NavLink>
                <NavLink href="/teachings">Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about" active>
                  About
                </NavLink>
                <NavLink href="/contact">Contact</NavLink>

              </div>

              {/* Right */}
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


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20">

        {/* ambient background */}
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
                About Akinsoji Elebuibon
              </span>

            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[.98] font-black tracking-[-0.045em]">

              A priest of Ifá,
              <br />
              <span className="text-brand-primary">
                servant of the Odu.
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-400">

              Akinsoji Elebuibon is an Ifá priest serving from Nigeria and the
              USA. His life and work are dedicated to the wisdom of Ifá, helping
              people understand their destiny and walk a more aligned path.

            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="pb-20 sm:pb-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[1fr_1fr] gap-10 items-start">

            <div>

              <h2 className="text-2xl sm:text-3xl font-bold">

                Story and calling

              </h2>

              <div className="mt-4 space-y-4 text-slate-300">

                <p>

                  Akinsoji Elebuibon’s journey into Ifá began through a deep
                  personal search for meaning, clarity, and connection to
                  something greater than himself. Over time, this search led him
                  into the Yoruba spiritual tradition and the sacred system of
                  Ifá.

                </p>

                <p>

                  Through years of study, initiation, and practice under the
                  guidance of elder priests, he was called to serve as a
                  Babalawo — a priest of Ifá. This calling is not only a role,
                  but a lifelong commitment to learning, humility, and service.

                </p>

                <p>

                  Today, Akinsoji serves clients and seekers both in Nigeria and
                  the USA, offering divination, rituals, and spiritual guidance
                  rooted in the Odu. His work is focused on helping people
                  understand their Ori (inner head), their destiny, and the
                  choices that shape their lives.

                </p>

              </div>

            </div>

            <div className="relative">

              <div className="aspect-square w-full max-w-[520px] ml-auto rounded-[28px] border border-slate-800 bg-slate-900 overflow-hidden">

                {/* Replace this with a real photo or illustration if you have one */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">

                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-3xl font-black mb-6">

                    {PRIEST_NAME.split(' ')[0]?.charAt(0) || 'A'}

                  </div>

                  <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">

                    {brand?.display_name || PRIEST_NAME}

                  </p>

                  <h3 className="text-2xl font-bold mt-3">

                    {PRIEST_TITLE}

                    <br />

                    <span className="text-slate-500">

                      {LOCATION}

                    </span>

                  </h3>

                  <p className="mt-4 max-w-xs text-sm text-slate-500">

                    Wisdom through the Odu, service to humanity.

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          APPROACH / BELIEFS
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-slate-900/35 border-y border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-12 items-center">

            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold mb-4">

                Approach

              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">

                Rooted in tradition,
                <br />
                <span className="text-slate-500">
                  focused on your life.
                </span>

              </h2>

            </div>

            <div className="grid sm:grid-cols-2 gap-6">

              <ApproachCard
                emoji="📿"
                title="Ifá as foundation"
                text="All guidance comes through the Odu and the established wisdom of the Ifá tradition."
              />

              <ApproachCard
                emoji="🧭"
                title="Clarity and direction"
                text="Readings are meant to give you clear understanding, not confusion or fear."
              />

              <ApproachCard
                emoji="🤝"
                title="Respect and confidentiality"
                text="Your matters are treated with deep respect and held in strict confidence."
              />

              <ApproachCard
                emoji="🌱"
                title="Practical spirituality"
                text="Recommendations are designed to be lived, not just heard — simple, steady steps forward."
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          WHAT THIS SITE IS FOR
      ===================================================== */}

      <section className="py-20 sm:py-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative rounded-[28px] overflow-hidden border border-slate-800 bg-slate-900">

            <div className="absolute top-0 right-0 w-[45%] h-full bg-brand-primary/5" />

            <div className="relative grid lg:grid-cols-[1fr_.8fr] items-center">

              <div className="p-7 sm:p-10 lg:p-14">

                <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">

                  This space

                </p>

                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">

                  A spiritual home
                  <br />
                  <span className="text-slate-500">
                    for seekers and students.
                  </span>

                </h2>

                <p className="mt-5 max-w-lg text-slate-500 leading-7">

                  This website exists to share teachings, offer consultations
                  and rituals, and provide resources for those who want to
                  understand Ifá more deeply and apply its wisdom in daily life.

                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-8">

                  <SimpleLink
                    emoji="📖"
                    title="Explore teachings"
                    href="/teachings"
                  />

                  <SimpleLink
                    emoji="📿"
                    title="View services"
                    href="/services"
                  />

                  <SimpleLink
                    emoji="✦"
                    title="Resources"
                    href="/resources"
                  />

                  <SimpleLink
                    emoji="✉️"
                    title="Get in touch"
                    href="/contact"
                  />

                </div>

              </div>

              {/* Visual */}
              <div className="p-8 lg:p-12">

                <div className="relative mx-auto max-w-[300px] aspect-[.78] rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-7 shadow-2xl shadow-brand-primary/10 rotate-[-4deg]">

                  <div className="absolute inset-3 rounded-lg border border-white/15" />

                  <div className="relative h-full flex flex-col justify-between">

                    <div>

                      <p className="text-[9px] uppercase tracking-[.25em] text-white/60">

                        {brand?.display_name?.toUpperCase() || 'IFÁ'}

                      </p>

                      <div className="mt-12">

                        <p className="text-3xl font-black text-white leading-none">

                          WISDOM

                        </p>

                        <p className="text-3xl font-black text-white leading-none">

                          FOR

                        </p>

                        <p className="text-3xl font-black text-white leading-none">

                          YOUR PATH.

                        </p>

                      </div>

                    </div>

                    <p className="text-xs text-white/60">

                      {TRADITION}

                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

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


/* =========================================================
   COMPONENTS
========================================================= */

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
        active
          ? 'text-white font-semibold'
          : 'text-slate-500 hover:text-white'
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

function ApproachCard({
  emoji,
  title,
  text,
}: {
  emoji: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl mb-4">

        {emoji}

      </div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>

    </div>
  )
}

function SimpleLink({
  emoji,
  title,
  href,
}: {
  emoji: string
  title: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-brand-primary/30 transition"
    >

      <span className="text-lg">{emoji}</span>

      <span className="text-sm font-semibold">{title}</span>

      <span className="ml-auto text-slate-700">→</span>

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
