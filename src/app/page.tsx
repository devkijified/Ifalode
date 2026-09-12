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

export default function HomePage() {
  const { brand } = useBrand()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const PRIEST_NAME = 'Akinsoji Elebuibon'
  const PRIEST_TITLE = 'Ifá Priest'
  const LOCATION = 'Nigeria, USA'
  const TRADITION = 'Yoruba / Ifá tradition'

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
  }, [supabase])

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

  const avatar = user?.user_metadata?.avatar_url || null

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <div className="flex h-full items-center justify-between px-5">
              <Link
                href="/"
                className="shrink-0 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-xl font-black tracking-tight text-transparent sm:text-2xl"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              <div className="ml-10 hidden items-center gap-8 lg:flex">
                <NavLink href="/" active>
                  Home
                </NavLink>
                <NavLink href="/teachings">Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/resources"
                  title="Resources"
                  className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:bg-slate-800 hover:text-white sm:flex"
                >
                  📿
                </Link>

                {!loading && !user && (
                  <>
                    <Link
                      href="/login"
                      className="hidden px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/10 transition hover:opacity-90 sm:px-5"
                    >
                      Get Started
                    </Link>
                  </>
                )}

                {!loading && user && (
                  <div ref={accountRef} className="relative">
                    <button
                      onClick={() => setAccountOpen((open) => !open)}
                      className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-800"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-sm font-bold">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="hidden max-w-[100px] truncate text-sm font-semibold sm:block">
                        {firstName}
                      </span>

                      <span
                        className={`text-xs text-slate-500 transition-transform ${
                          accountOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ▾
                      </span>
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                        <div className="border-b border-slate-800 px-4 py-4">
                          <p className="truncate text-sm font-semibold text-white">
                            {displayName}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
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
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
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

      {/* Hero */}
      <section className="relative pb-20 pt-36 sm:pb-28 sm:pt-44">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[5%] top-20 h-72 w-72 rounded-full bg-brand-primary/10 blur-[120px]" />
          <div className="absolute right-[5%] top-40 h-96 w-96 rounded-full bg-brand-secondary/10 blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-primary" />
                <span className="text-xs font-semibold text-brand-primary">
                  Ifá • Wisdom • Guidance
                </span>
              </div>

              <h1 className="text-5xl font-black leading-[.98] tracking-[-0.045em] sm:text-6xl lg:text-[70px]">
                Akinsoji
                <br />
                <span className="text-brand-primary">Elebuibon.</span>
                <br />
                Ifá Priest.
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
                A spiritual home for Ifá teachings, consultations, rituals,
                ceremonies, and guidance rooted in the Yoruba tradition.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/teachings"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-primary/10 transition hover:opacity-90"
                >
                  Explore Teachings
                  <span>→</span>
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Services
                  <span>↗</span>
                </Link>
              </div>

              <div className="mt-11 flex flex-wrap items-center gap-7 border-t border-slate-800/70 pt-7">
                <MiniStat value="Teachings" label="Wisdom & insights" />
                <MiniStat value="Consultations" label="Guidance & divination" />
                <MiniStat value="Nigeria · USA" label="Serving across borders" />
              </div>
            </div>

            <div className="relative">
              <div className="relative min-h-[470px] overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900">
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
                    backgroundSize: '42px 42px',
                  }}
                />

                <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-brand-primary/20 blur-[90px]" />

                <div className="absolute inset-7 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-950/90 shadow-2xl sm:inset-10">
                  <div className="flex h-11 items-center justify-between border-b border-slate-800 px-4">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                      <span className="h-2 w-2 rounded-full bg-slate-700" />
                    </div>

                    <span className="text-[9px] uppercase tracking-[.2em] text-slate-600">
                      IFÁ
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-primary">
                      Sacred knowledge
                    </p>

                    <h3 className="mt-3 text-2xl font-bold sm:text-3xl">
                      Wisdom that guides your path.
                    </h3>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <VisualCard emoji="📿" title="Consult" text="Readings" />
                      <VisualCard emoji="🕯️" title="Ritual" text="Ceremonies" />
                      <VisualCard emoji="📖" title="Learn" text="Teachings" />
                      <VisualCard emoji="✦" title="Align" text="Your journey" />
                    </div>

                    <div className="mt-5 rounded-xl border border-brand-primary/10 bg-brand-primary/10 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Spiritual tradition
                        </span>
                        <span className="text-xs font-bold text-brand-primary">
                          Yoruba / Ifá
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[68%] rounded-full bg-brand-primary" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-7 left-5 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md sm:left-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-lg">
                      ✦
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Serving from</p>
                      <p className="text-sm font-bold">{LOCATION}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Working marquee */}
      <section className="relative overflow-hidden border-y border-slate-800 bg-slate-900/60 py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-950 to-transparent" />

        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-950 to-transparent" />

        <div className="animate-marquee flex w-max whitespace-nowrap">
          <MarqueeGroup />
          <MarqueeGroup ariaHidden />
        </div>
      </section>

      {/* What I offer */}
      <section className="border-t border-slate-900 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid items-end gap-12 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
                What I offer
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Guidance rooted in
                <br />
                <span className="text-slate-500">
                  the Ifá tradition.
                </span>
              </h2>
            </div>

            <p className="max-w-2xl leading-7 text-slate-500">
              Through divination, teachings, rituals, and spiritual counsel,
              this work helps seekers approach life with greater clarity,
              character, and alignment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              number="01"
              emoji="📿"
              title="Consultations"
              text="Ifá divination and guidance for understanding your situation and path."
            />

            <FeatureCard
              number="02"
              emoji="🕯️"
              title="Rituals"
              text="Ceremonies and offerings intended to restore balance and open the way."
            />

            <FeatureCard
              number="03"
              emoji="📖"
              title="Teachings"
              text="Lessons on the Odu, Ori, character, destiny, and spiritual living."
            />

            <FeatureCard
              number="04"
              emoji="✦"
              title="Resources"
              text="Prayers, references, and practical materials for continued study."
            />
          </div>
        </div>
      </section>

      {/* Teachings */}
      <section className="border-y border-slate-900 bg-slate-900/35 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Teachings"
            title="Lessons from the Odu."
            description="Explore reflections on Ifá, Ori, destiny, character, and spiritual practice."
            action="View all teachings"
            href="/teachings"
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <TeachingCard
              category="LESSON"
              title="Understanding your Ori"
              description="The role of the inner head in destiny, decisions, and spiritual alignment."
              href="/teachings"
            />

            <TeachingCard
              category="INSIGHT"
              title="Living with good character"
              description="Why Ìwà Pẹ̀lẹ́ remains central to a meaningful spiritual life."
              href="/teachings"
            />

            <TeachingCard
              category="ODU STUDY"
              title="The language of Ifá"
              description="How the Odu speak through signs, stories, patterns, and experience."
              href="/teachings"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900">
            <div className="absolute right-0 top-0 h-full w-[45%] bg-brand-primary/5" />

            <div className="relative grid items-center lg:grid-cols-[1fr_.8fr]">
              <div className="p-7 sm:p-10 lg:p-14">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
                  Services
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Readings and rituals
                  <br />
                  <span className="text-slate-500">
                    for clarity and alignment.
                  </span>
                </h2>

                <p className="mt-5 max-w-lg leading-7 text-slate-500">
                  If you are seeking direction, spiritual support, or a deeper
                  understanding of your path, learn more about the services
                  available in Nigeria and the USA.
                </p>

                <Link
                  href="/services"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  View services
                  <span>→</span>
                </Link>
              </div>

              <div className="p-8 lg:p-12">
                <div className="relative mx-auto aspect-[.78] max-w-[300px] rotate-[-4deg] rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-7 shadow-2xl shadow-brand-primary/10">
                  <div className="absolute inset-3 rounded-lg border border-white/15" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-[.25em] text-white/60">
                        {brand?.display_name?.toUpperCase() || 'IFÁ'}
                      </p>

                      <div className="mt-12">
                        <p className="text-3xl font-black leading-none text-white">
                          WISDOM
                        </p>
                        <p className="text-3xl font-black leading-none text-white">
                          THROUGH
                        </p>
                        <p className="text-3xl font-black leading-none text-white">
                          THE ODU.
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-white/60">
                      Consultations & rituals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-y border-slate-900 bg-slate-900/35 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div className="relative">
              <div className="aspect-square max-w-[420px] rounded-[28px] border border-slate-800 bg-slate-950 p-7">
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-3xl font-black">
                    A
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
                    {PRIEST_NAME}
                  </p>

                  <h3 className="mt-3 text-2xl font-bold">
                    {PRIEST_TITLE}.
                    <br />
                    <span className="text-slate-500">{LOCATION}.</span>
                  </h3>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
                About the priest
              </p>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                A spiritual home
                <br />
                <span className="text-slate-500">
                  grounded in Ifá.
                </span>
              </h2>

              <p className="mt-6 max-w-xl leading-8 text-slate-500">
                Akinsoji Elebuibon is an Ifá priest serving from Nigeria and
                the USA. His work is dedicated to helping people understand
                their destiny, make aligned choices, and live with the wisdom
                of the Odu.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <SimpleLink emoji="✦" title="About Akinsoji" href="/about" />
                <SimpleLink emoji="📖" title="Teachings" href="/teachings" />
                <SimpleLink emoji="📿" title="Services" href="/services" />
                <SimpleLink emoji="✉️" title="Contact" href="/contact" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {user ? (
            <div className="rounded-[28px] border border-brand-primary/15 bg-gradient-to-br from-brand-primary/10 to-slate-900 p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Good to see you, {firstName}.
              </h2>

              <p className="mt-3 text-slate-500">
                Continue learning or explore guidance for your spiritual path.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MemberAction
                  emoji="📖"
                  title="Teachings"
                  text="Read lessons and insights"
                  href="/teachings"
                />

                <MemberAction
                  emoji="📿"
                  title="Services"
                  text="View consultations and rituals"
                  href="/services"
                />

                <MemberAction
                  emoji="✦"
                  title="Dashboard"
                  text="Open your account"
                  href="/dashboard"
                />
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-brand-primary to-brand-secondary p-8 sm:p-12">
              <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-white/10" />

              <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-white/60">
                    Begin your journey
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                    There is always more
                    <br className="hidden sm:block" />
                    to understand.
                  </h2>

                  <p className="mt-4 max-w-xl leading-7 text-white/70">
                    Create an account to stay connected with new teachings,
                    resources, and spiritual offerings.
                  </p>
                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  Create Your Account
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-2xl font-black tracking-tight text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                A spiritual home for Ifá teachings, consultations, rituals, and
                resources rooted in the {TRADITION}.
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
              title="Connect"
              links={[
                ['Contact', '/contact'],
                ['Dashboard', '/dashboard'],
                ['Profile', '/profile'],
                ['Settings', '/settings'],
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-900 pt-6 sm:flex-row">
            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()}{' '}
              {brand?.display_name || PRIEST_NAME}. All rights reserved.
            </p>

            <div className="flex gap-5">
              <Link
                href="/privacy"
                className="text-xs text-slate-700 transition hover:text-slate-400"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs text-slate-700 transition hover:text-slate-400"
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

function MarqueeGroup({ ariaHidden = false }: { ariaHidden?: boolean }) {
  const items = [
    'Ifá',
    'Wisdom',
    'Ori',
    'Odu',
    'Ìwà Pẹ̀lẹ́',
    'Guidance',
    'Destiny',
    'Knowledge',
  ]

  return (
    <div
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center"
    >
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex items-center"
        >
          <span className="px-6 text-sm font-semibold uppercase tracking-[.2em] text-slate-400">
            {item}
          </span>

          <span className="text-brand-primary">✦</span>
        </div>
      ))}
    </div>
  )
}

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
          ? 'font-semibold text-white'
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
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  )
}

function MiniStat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-200">{value}</p>
      <p className="mt-1 text-[11px] text-slate-600">{label}</p>
    </div>
  )
}

function VisualCard({
  emoji,
  title,
  text,
}: {
  emoji: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-brand-primary/30">
      <div className="mb-5 text-2xl">{emoji}</div>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-[11px] text-slate-600">{text}</p>
    </div>
  )
}

function FeatureCard({
  number,
  emoji,
  title,
  text,
}: {
  number: string
  emoji: string
  title: string
  text: string
}) {
  return (
    <div className="group relative min-h-[230px] rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-2xl">
          {emoji}
        </div>

        <span className="text-[10px] font-bold tracking-wider text-slate-700">
          {number}
        </span>
      </div>

      <h3 className="mt-8 text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>

      <span className="absolute bottom-6 right-6 text-slate-700 transition group-hover:text-brand-primary">
        →
      </span>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  href,
}: {
  eyebrow: string
  title: string
  description: string
  action: string
  href: string
}) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
          {eyebrow}
        </p>

        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-primary transition-all hover:gap-3"
      >
        {action}
        <span>→</span>
      </Link>
    </div>
  )
}

function TeachingCard({
  category,
  title,
  description,
  href,
}: {
  category: string
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
    >
      <span className="text-[10px] font-bold tracking-[.15em] text-brand-primary">
        {category}
      </span>

      <h3 className="mt-3 text-lg font-bold transition group-hover:text-brand-primary">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-end border-t border-slate-800 pt-4">
        <span className="text-sm text-brand-primary transition-transform group-hover:translate-x-1">
          Read →
        </span>
      </div>
    </Link>
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
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-brand-primary/30"
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-sm font-semibold">{title}</span>
      <span className="ml-auto text-slate-700">→</span>
    </Link>
  )
}

function MemberAction({
  emoji,
  title,
  text,
  href,
}: {
  emoji: string
  title: string
  text: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-brand-primary/30 hover:bg-slate-950"
    >
      <div className="text-xl">{emoji}</div>
      <p className="mt-4 text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{text}</p>
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
      <h4 className="text-xs font-bold uppercase tracking-[.15em] text-slate-500">
        {title}
      </h4>

      <div className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block text-sm text-slate-700 transition hover:text-slate-300"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
