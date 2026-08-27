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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">

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
                {brand?.display_name || 'Ifalode'}
              </Link>


              {/* Desktop navigation */}
              <div className="hidden lg:flex items-center gap-8 ml-10">

                <NavLink href="/" active>
                  Home
                </NavLink>

                <NavLink href="/courses">
                  Courses
                </NavLink>

                <NavLink href="/store">
                  Store
                </NavLink>

                <NavLink href="/about">
                  About
                </NavLink>

                <NavLink href="/resources">
                  Resources
                </NavLink>

              </div>


              {/* Right */}
              <div className="flex items-center gap-2 sm:gap-3">

                <Link
                  href="/store"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Store"
                >
                  🛍️
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
                      Get Started
                    </Link>
                  </>
                )}


                {!loading && user && (
                  <div
                    ref={accountRef}
                    className="relative"
                  >

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
                            href="/dashboard"
                            icon="📘"
                            label="My Courses"
                          />

                          <AccountLink
                            href="/dashboard"
                            icon="▤"
                            label="My Library"
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

      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28">

        {/* ambient background */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 left-[5%] w-72 h-72 rounded-full bg-brand-primary/10 blur-[120px]" />

          <div className="absolute top-40 right-[5%] w-96 h-96 rounded-full bg-brand-secondary/10 blur-[140px]" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

        </div>


        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-12 lg:gap-16 items-center">


            {/* Hero copy */}
            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2 mb-7">

                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />

                <span className="text-xs font-semibold text-brand-primary">
                  Knowledge • Learning • Growth
                </span>

              </div>


              <h1 className="text-5xl sm:text-6xl lg:text-[70px] leading-[.98] font-black tracking-[-0.045em]">

                Learn.

                <br />

                <span className="text-brand-primary">
                  Build.
                </span>

                <br />

                Grow.

              </h1>


              <p className="mt-7 max-w-xl text-base sm:text-lg leading-8 text-slate-400">

                Welcome to {brand?.display_name || 'Ifalode'} — a personal
                space for ideas, knowledge, courses, digital products and
                everything worth learning.

              </p>


              <div className="flex flex-wrap items-center gap-3 mt-9">

                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-primary text-white font-semibold text-sm hover:opacity-90 transition shadow-xl shadow-brand-primary/10"
                >
                  Explore Courses
                  <span>→</span>
                </Link>

                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition"
                >
                  Visit Store
                  <span>↗</span>
                </Link>

              </div>


              {/* Mini stats */}
              <div className="flex flex-wrap items-center gap-7 mt-11 pt-7 border-t border-slate-800/70">

                <MiniStat
                  value="Courses"
                  label="Learn at your pace"
                />

                <MiniStat
                  value="Ebooks"
                  label="Ideas worth keeping"
                />

                <MiniStat
                  value="Resources"
                  label="Tools for growth"
                />

              </div>

            </div>


            {/* Hero visual */}
            <div className="relative">

              <div className="relative min-h-[470px] rounded-[28px] border border-slate-800 bg-slate-900 overflow-hidden">

                {/* decorative grid */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
                    backgroundSize: '42px 42px',
                  }}
                />


                {/* gradient glow */}
                <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-brand-primary/20 blur-[90px]" />


                {/* Main visual card */}
                <div className="absolute inset-7 sm:inset-10 rounded-2xl border border-slate-700/70 bg-slate-950/90 shadow-2xl overflow-hidden">

                  <div className="h-11 px-4 flex items-center justify-between border-b border-slate-800">

                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>

                    <span className="text-[9px] uppercase tracking-[.2em] text-slate-600">
                      IFALODE
                    </span>

                  </div>


                  <div className="p-6 sm:p-8">

                    <p className="text-[10px] uppercase tracking-[.18em] text-brand-primary font-bold">
                      Your learning space
                    </p>

                    <h3 className="mt-3 text-2xl sm:text-3xl font-bold">
                      Knowledge that moves with you.
                    </h3>


                    <div className="grid grid-cols-2 gap-3 mt-8">

                      <VisualCard
                        emoji="🧠"
                        title="Learn"
                        text="Courses"
                      />

                      <VisualCard
                        emoji="📖"
                        title="Read"
                        text="Ebooks"
                      />

                      <VisualCard
                        emoji="✦"
                        title="Explore"
                        text="Resources"
                      />

                      <VisualCard
                        emoji="🚀"
                        title="Grow"
                        text="Your journey"
                      />

                    </div>


                    <div className="mt-5 rounded-xl bg-brand-primary/10 border border-brand-primary/10 p-4">

                      <div className="flex items-center justify-between mb-3">

                        <span className="text-xs text-slate-400">
                          Learning journey
                        </span>

                        <span className="text-xs font-bold text-brand-primary">
                          Ready
                        </span>

                      </div>

                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">

                        <div className="w-[68%] h-full rounded-full bg-brand-primary" />

                      </div>

                    </div>

                  </div>

                </div>


                {/* floating card */}
                <div className="absolute bottom-7 left-5 sm:left-7 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-4 shadow-xl">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-lg">
                      ✦
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Start today
                      </p>
                      <p className="text-sm font-bold">
                        Your next chapter
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          INTRO / ECOSYSTEM
      ===================================================== */}

      <section className="py-20 sm:py-28 border-t border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[.7fr_1.3fr] gap-12 items-end mb-12">

            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold mb-4">
                The Ifalode ecosystem
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                More than a website.
                <br />
                <span className="text-slate-500">
                  A place to grow.
                </span>
              </h2>

            </div>

            <p className="max-w-2xl text-slate-500 leading-7">
              Everything is designed to work together — from learning and
              reading to discovering useful resources and building a personal
              library you can return to whenever you need it.
            </p>

          </div>


          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

            <FeatureCard
              number="01"
              emoji="🧠"
              title="Learn"
              text="Practical courses and masterclasses built around useful knowledge."
            />

            <FeatureCard
              number="02"
              emoji="📖"
              title="Read"
              text="Ebooks and digital resources created to give ideas more depth."
            />

            <FeatureCard
              number="03"
              emoji="✦"
              title="Explore"
              text="Discover thoughts, resources, projects and perspectives."
            />

            <FeatureCard
              number="04"
              emoji="🚀"
              title="Grow"
              text="Keep everything together and make progress at your own pace."
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED COURSES
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-slate-900/35 border-y border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <SectionHeading
            eyebrow="Learning"
            title="Learn something worth knowing."
            description="Explore courses designed to turn ideas into practical knowledge."
            action="View all courses"
            href="/courses"
          />


          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">

            <ProductCard
              emoji="🧠"
              category="PERSONAL DEVELOPMENT"
              title="Build Better Habits"
              description="Understand the systems behind meaningful personal growth."
              lessons="12 Lessons"
              level="Beginner"
              href="/courses"
            />

            <ProductCard
              emoji="◈"
              category="BUSINESS"
              title="Business Fundamentals"
              description="Learn the principles that help ideas become sustainable businesses."
              lessons="18 Lessons"
              level="Intermediate"
              href="/courses"
            />

            <ProductCard
              emoji="⌘"
              category="DIGITAL SKILLS"
              title="Digital Skills"
              description="Build practical digital knowledge for today's connected world."
              lessons="24 Lessons"
              level="All Levels"
              href="/courses"
            />

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED STORE
      ===================================================== */}

      <section className="py-20 sm:py-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative rounded-[28px] overflow-hidden border border-slate-800 bg-slate-900">

            <div className="absolute top-0 right-0 w-[45%] h-full bg-brand-primary/5" />

            <div className="relative grid lg:grid-cols-[1fr_.8fr] items-center">

              <div className="p-7 sm:p-10 lg:p-14">

                <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                  Digital Library
                </p>

                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Ideas you can
                  <br />
                  <span className="text-slate-500">
                    take with you.
                  </span>
                </h2>

                <p className="mt-5 max-w-lg text-slate-500 leading-7">
                  Discover ebooks and digital resources made for people who
                  want to learn, think deeper and keep moving forward.
                </p>

                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Explore the Store
                  <span>→</span>
                </Link>

              </div>


              {/* Book visual */}
              <div className="p-8 lg:p-12">

                <div className="relative mx-auto max-w-[300px] aspect-[.78] rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-7 shadow-2xl shadow-brand-primary/10 rotate-[-4deg]">

                  <div className="absolute inset-3 rounded-lg border border-white/15" />

                  <div className="relative h-full flex flex-col justify-between">

                    <div>

                      <p className="text-[9px] uppercase tracking-[.25em] text-white/60">
                        IFALODE
                      </p>

                      <div className="mt-12">

                        <p className="text-3xl font-black text-white leading-none">
                          IDEAS
                        </p>

                        <p className="text-3xl font-black text-white leading-none">
                          WORTH
                        </p>

                        <p className="text-3xl font-black text-white leading-none">
                          KEEPING.
                        </p>

                      </div>

                    </div>

                    <p className="text-xs text-white/60">
                      Digital knowledge series
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PERSONAL BRAND
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-slate-900/35 border-y border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-14 items-center">

            <div className="relative">

              <div className="aspect-square max-w-[420px] rounded-[28px] border border-slate-800 bg-slate-950 p-7">

                <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 flex flex-col items-center justify-center text-center p-8">

                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-3xl font-black mb-6">
                    I
                  </div>

                  <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                    IFALODE
                  </p>

                  <h3 className="text-2xl font-bold mt-3">
                    Ideas.
                    <br />
                    Knowledge.
                    <br />
                    Growth.
                  </h3>

                </div>

              </div>

            </div>


            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold mb-4">
                Personal space
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                A website with
                <br />
                <span className="text-slate-500">
                  a human side.
                </span>
              </h2>

              <p className="mt-6 text-slate-500 leading-8 max-w-xl">
                Ifalode is also a personal space — a place to share ideas,
                experiences, projects, perspectives and the things that
                continue to shape the journey.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-8">

                <SimpleLink
                  emoji="✦"
                  title="About Ifalode"
                  href="/about"
                />

                <SimpleLink
                  emoji="✍️"
                  title="Articles & Thoughts"
                  href="/resources"
                />

                <SimpleLink
                  emoji="◈"
                  title="Projects"
                  href="/projects"
                />

                <SimpleLink
                  emoji="↗"
                  title="Connect"
                  href="/contact"
                />

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          PERSONALIZED MEMBER SECTION
      ===================================================== */}

      <section className="py-20 sm:py-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {user ? (

            <div className="rounded-[28px] border border-brand-primary/15 bg-gradient-to-br from-brand-primary/10 to-slate-900 p-7 sm:p-10 lg:p-12">

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
                Good to see you, {firstName}.
              </h2>

              <p className="mt-3 text-slate-500">
                Pick up where you left off or discover something new.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mt-8">

                <MemberAction
                  emoji="▶️"
                  title="Continue Learning"
                  text="Go to your dashboard"
                  href="/dashboard"
                />

                <MemberAction
                  emoji="📘"
                  title="My Library"
                  text="View your content"
                  href="/dashboard"
                />

                <MemberAction
                  emoji="✦"
                  title="Discover More"
                  text="Explore new courses"
                  href="/courses"
                />

              </div>

            </div>

          ) : (

            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-brand-primary to-brand-secondary p-8 sm:p-12">

              <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-white/10" />

              <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">

                <div>

                  <p className="text-xs uppercase tracking-[.2em] text-white/60 font-bold">
                    Start your journey
                  </p>

                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">
                    There's always something
                    <br className="hidden sm:block" />
                    new to learn.
                  </h2>

                  <p className="mt-4 text-white/65 max-w-xl leading-7">
                    Create your free account and build your own learning
                    library on Ifalode.
                  </p>

                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-950 text-sm font-bold hover:bg-slate-100 transition whitespace-nowrap"
                >
                  Create Your Account
                  <span>→</span>
                </Link>

              </div>

            </div>

          )}

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
                {brand?.display_name || 'Ifalode'}
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                A personal ecosystem for learning, ideas, digital products
                and growth.
              </p>

            </div>


            <FooterColumn
              title="Explore"
              links={[
                ['Courses', '/courses'],
                ['Store', '/store'],
                ['Resources', '/resources'],
                ['About', '/about'],
              ]}
            />


            <FooterColumn
              title="Account"
              links={[
                ['Dashboard', '/dashboard'],
                ['Profile', '/profile'],
                ['Settings', '/settings'],
                ['Contact', '/contact'],
              ]}
            />

          </div>


          <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between gap-3">

            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}.
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
      <span className="w-5 text-center">
        {icon}
      </span>

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

      <p className="text-sm font-bold text-slate-200">
        {value}
      </p>

      <p className="text-[11px] text-slate-600 mt-1">
        {label}
      </p>

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
    <div className="group rounded-xl border border-slate-800 bg-slate-900/70 p-4 hover:border-brand-primary/30 transition">

      <div className="text-2xl mb-5">
        {emoji}
      </div>

      <p className="text-sm font-bold">
        {title}
      </p>

      <p className="text-[11px] text-slate-600 mt-1">
        {text}
      </p>

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
    <div className="group relative min-h-[230px] rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:-translate-y-1 hover:border-slate-700 transition duration-300">

      <div className="flex items-start justify-between">

        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl">
          {emoji}
        </div>

        <span className="text-[10px] text-slate-700 font-bold tracking-wider">
          {number}
        </span>

      </div>

      <h3 className="mt-8 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {text}
      </p>

      <span className="absolute bottom-6 right-6 text-slate-700 group-hover:text-brand-primary transition">
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
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">

      <div>

        <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold mb-3">
          {eyebrow}
        </p>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {title}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>

      </div>

      <Link
        href={href}
        className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:gap-3 transition-all"
      >
        {action}
        <span>→</span>
      </Link>

    </div>
  )
}


function ProductCard({
  emoji,
  category,
  title,
  description,
  lessons,
  level,
  href,
}: {
  emoji: string
  category: string
  title: string
  description: string
  lessons: string
  level: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition"
    >

      <div className="relative h-44 bg-gradient-to-br from-brand-primary/10 via-slate-900 to-slate-950 p-5 overflow-hidden">

        <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-brand-primary/10 blur-2xl" />

        <div className="relative w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
          {emoji}
        </div>

        <span className="absolute bottom-5 left-5 text-[9px] tracking-[.15em] text-brand-primary font-bold">
          {category}
        </span>

      </div>


      <div className="p-5">

        <h3 className="text-lg font-bold group-hover:text-brand-primary transition">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {description}
        </p>


        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">

          <span className="text-[11px] text-slate-600">
            {lessons}
          </span>

          <span className="text-[11px] text-slate-600">
            {level}
          </span>

          <span className="text-brand-primary text-sm group-hover:translate-x-1 transition-transform">
            →
          </span>

        </div>

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
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-brand-primary/30 transition"
    >

      <span className="text-lg">
        {emoji}
      </span>

      <span className="text-sm font-semibold">
        {title}
      </span>

      <span className="ml-auto text-slate-700">
        →
      </span>

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
      className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 hover:bg-slate-950 hover:border-brand-primary/30 transition"
    >

      <div className="text-xl">
        {emoji}
      </div>

      <p className="mt-4 text-sm font-bold">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {text}
      </p>

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
