'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

type Profile = {
  full_name?: string
  display_name?: string
  title?: string
  bio?: string
  location?: string
  avatar_url?: string
  hero_image_url?: string
  about?: string
  website?: string
}

type ContentItem = {
  id: string
  title: string
  description?: string
  image_url?: string
  slug?: string
  category?: string
  type?: 'course' | 'ebook' | 'article' | 'project'
  price?: number
}

export default function HomePage() {
  const { brand } = useBrand()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [featured, setFeatured] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSite = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setUser(user)

      /*
       * Replace these table names/fields with your actual CMS tables.
       *
       * The important part is that this page is consuming CMS content.
       * It is NOT the CMS itself.
       */

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      const { data: content } = await supabase
        .from('content')
        .select('*')
        .eq('published', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6)

      setFeatured(content || [])
      setLoading(false)
    }

    loadSite()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-t-brand-primary animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  const name =
    profile?.display_name ||
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    'Baba Lau'

  const title =
    profile?.title ||
    'Babaláwo • Teacher • Guide'

  const bio =
    profile?.bio ||
    'Sharing knowledge, wisdom, experiences and the journey of life.'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed top-0 left-0 right-0 z-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

          <nav className="h-[70px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">

            <div className="h-full px-5 sm:px-7 flex items-center justify-between">

              {/* Personal brand */}
              <Link
                href="/"
                className="flex items-center gap-3"
              >

                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                )}

                <div className="hidden sm:block">
                  <p className="text-sm font-bold">
                    {name}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {title}
                  </p>
                </div>

              </Link>


              {/* Navigation */}
              <div className="hidden md:flex items-center gap-7">

                <SiteLink href="/" active>
                  Home
                </SiteLink>

                <SiteLink href="/about">
                  About
                </SiteLink>

                <SiteLink href="/courses">
                  Courses
                </SiteLink>

                <SiteLink href="/store">
                  Store
                </SiteLink>

                <SiteLink href="/resources">
                  Resources
                </SiteLink>

                <SiteLink href="/contact">
                  Contact
                </SiteLink>

              </div>


              {/* CMS user session */}
              <div className="flex items-center gap-3">

                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:opacity-90 transition"
                  >
                    Dashboard
                    <span>↗</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold hover:bg-slate-900 transition"
                  >
                    Sign In
                  </Link>
                )}

              </div>

            </div>

          </nav>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative min-h-screen pt-36 pb-20 flex items-center overflow-hidden">

        {/* Background atmosphere */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-primary/10 blur-[150px] -top-40 -left-40" />

          <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-secondary/10 blur-[160px] right-[-200px] top-[20%]" />

        </div>


        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[1fr_.9fr] gap-14 items-center">


            {/* Copy */}
            <div>

              <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-2 rounded-full border border-brand-primary/20 bg-brand-primary/5">

                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />

                <span className="text-xs font-semibold text-brand-primary">
                  {profile?.location || 'Welcome to my space'}
                </span>

              </div>


              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-.05em] leading-[.95]">

                {name}

              </h1>


              <p className="mt-5 text-xl sm:text-2xl text-brand-primary font-semibold">
                {title}
              </p>


              <p className="mt-6 max-w-xl text-base sm:text-lg text-slate-500 leading-8">
                {bio}
              </p>


              <div className="flex flex-wrap gap-3 mt-9">

                <Link
                  href="/about"
                  className="px-6 py-3.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:opacity-90 transition"
                >
                  Discover My Story
                </Link>

                <Link
                  href="/courses"
                  className="px-6 py-3.5 rounded-xl border border-slate-800 bg-slate-900 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Explore My Work
                </Link>

              </div>


              {/* Personal stats */}
              <div className="flex flex-wrap gap-8 mt-12 pt-7 border-t border-slate-900">

                <PersonalStat
                  value="01"
                  label="Personal Journey"
                />

                <PersonalStat
                  value="∞"
                  label="Knowledge to Share"
                />

                <PersonalStat
                  value="✦"
                  label="Ideas & Projects"
                />

              </div>

            </div>


            {/* Portrait / hero */}
            <div className="relative">

              <div className="relative aspect-[.85] max-w-[500px] ml-auto rounded-[30px] overflow-hidden border border-slate-800 bg-slate-900">

                {profile?.hero_image_url ? (
                  <img
                    src={profile.hero_image_url}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-slate-900 to-slate-950">

                    <div className="absolute inset-0 flex items-center justify-center">

                      <div className="text-center">

                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-5xl font-black shadow-2xl">
                          {name.charAt(0)}
                        </div>

                        <p className="mt-6 text-sm text-slate-500">
                          {name}
                        </p>

                      </div>

                    </div>

                  </div>
                )}


                {/* Image gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />


                <div className="absolute left-6 right-6 bottom-6">

                  <p className="text-[10px] uppercase tracking-[.2em] text-brand-primary font-bold">
                    Welcome
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    My world. My work.
                  </h2>

                </div>

              </div>


              {/* Floating card */}
              <div className="absolute -bottom-6 -left-4 sm:left-[-35px] rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-4 shadow-2xl">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-xl">
                    ✦
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Currently
                    </p>
                    <p className="text-sm font-bold">
                      Sharing & Teaching
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT PREVIEW
      ===================================================== */}

      <section className="py-24 border-t border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[.7fr_1.3fr] gap-14">

            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                About me
              </p>

              <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
                The person
                <br />
                behind the work.
              </h2>

            </div>


            <div>

              <p className="text-lg text-slate-500 leading-8">
                {profile?.about ||
                  `Welcome to my personal space. This is where I share
                  the knowledge, experiences, ideas and work that have
                  shaped my journey.`}
              </p>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 mt-7 text-sm font-bold text-brand-primary"
              >
                Read my full story
                <span>→</span>
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FEATURED CONTENT
      ===================================================== */}

      <section className="py-24 bg-slate-900/30 border-y border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">

            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Featured
              </p>

              <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
                Things worth exploring.
              </h2>

              <p className="mt-3 text-sm text-slate-600">
                Some of my latest courses, books, ideas and projects.
              </p>

            </div>

            <Link
              href="/resources"
              className="text-sm font-semibold text-brand-primary"
            >
              View everything →
            </Link>

          </div>


          {featured.length > 0 ? (

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">

              {featured.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                />
              ))}

            </div>

          ) : (

            <div className="grid md:grid-cols-3 gap-5 mt-10">

              <PlaceholderCard
                emoji="🧠"
                title="Courses"
                text="Knowledge and lessons to explore."
                href="/courses"
              />

              <PlaceholderCard
                emoji="📖"
                title="Books"
                text="Ideas worth reading and keeping."
                href="/store"
              />

              <PlaceholderCard
                emoji="✦"
                title="Resources"
                text="Thoughts, projects and useful material."
                href="/resources"
              />

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          PHILOSOPHY / QUOTE
      ===================================================== */}

      <section className="py-28">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">

          <div className="text-4xl text-brand-primary mb-7">
            “
          </div>

          <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Knowledge becomes powerful when it is shared,
            practiced and passed forward.
          </blockquote>

          <div className="mt-7 text-sm text-slate-600">
            — {name}
          </div>

        </div>

      </section>


      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="pb-24">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-brand-primary to-brand-secondary p-8 sm:p-12 lg:p-16">

            <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-white/10" />

            <div className="relative max-w-2xl">

              <p className="text-xs uppercase tracking-[.2em] text-white/60 font-bold">
                Let's connect
              </p>

              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Let's continue the conversation.
              </h2>

              <p className="mt-5 text-white/65 leading-7">
                Explore my work, learn something new or get in touch.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">

                <Link
                  href="/contact"
                  className="px-6 py-3.5 rounded-xl bg-white text-slate-950 text-sm font-bold hover:bg-slate-100 transition"
                >
                  Get in Touch
                </Link>

                <Link
                  href="/courses"
                  className="px-6 py-3.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition"
                >
                  Explore Courses
                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div>

              <p className="font-bold">
                {name}
              </p>

              <p className="mt-1 text-xs text-slate-700">
                {title}
              </p>

            </div>


            <div className="flex flex-wrap gap-5">

              <Link
                href="/about"
                className="text-xs text-slate-600 hover:text-white transition"
              >
                About
              </Link>

              <Link
                href="/courses"
                className="text-xs text-slate-600 hover:text-white transition"
              >
                Courses
              </Link>

              <Link
                href="/store"
                className="text-xs text-slate-600 hover:text-white transition"
              >
                Store
              </Link>

              <Link
                href="/contact"
                className="text-xs text-slate-600 hover:text-white transition"
              >
                Contact
              </Link>

            </div>

          </div>


          <div className="mt-8 pt-6 border-t border-slate-900">

            <p className="text-[11px] text-slate-700">
              © {new Date().getFullYear()} {name}. All rights reserved.
            </p>

          </div>

        </div>

      </footer>

    </main>
  )
}


/* =========================================================
   COMPONENTS
========================================================= */

function SiteLink({
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


function PersonalStat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div>

      <p className="text-lg font-bold text-slate-200">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-slate-600">
        {label}
      </p>

    </div>
  )
}


function PlaceholderCard({
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
      className="group min-h-[240px] rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-brand-primary/30 hover:-translate-y-1 transition"
    >

      <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl">
        {emoji}
      </div>

      <h3 className="mt-8 text-xl font-bold group-hover:text-brand-primary transition">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-600 leading-6">
        {text}
      </p>

      <span className="block mt-8 text-brand-primary text-sm">
        Explore →
      </span>

    </Link>
  )
}


function ContentCard({
  item,
}: {
  item: ContentItem
}) {
  const href =
    item.type === 'course'
      ? `/courses/${item.slug || item.id}`
      : item.type === 'ebook'
        ? `/store/${item.slug || item.id}`
        : `/resources/${item.slug || item.id}`

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition"
    >

      <div className="h-48 bg-slate-950 relative overflow-hidden">

        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/10 to-slate-950 text-4xl">
            {item.type === 'course'
              ? '🧠'
              : item.type === 'ebook'
                ? '📖'
                : '✦'}
          </div>
        )}

      </div>


      <div className="p-5">

        {item.category && (
          <p className="text-[9px] uppercase tracking-[.18em] text-brand-primary font-bold">
            {item.category}
          </p>
        )}

        <h3 className="mt-2 text-lg font-bold group-hover:text-brand-primary transition">
          {item.title}
        </h3>

        {item.description && (
          <p className="mt-2 text-sm text-slate-600 leading-6 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">

          {item.price !== undefined ? (
            <span className="text-sm font-bold">
              ₦{item.price.toLocaleString()}
            </span>
          ) : (
            <span className="text-xs text-slate-600">
              Explore
            </span>
          )}

          <span className="text-brand-primary">
            →
          </span>

        </div>

      </div>

    </Link>
  )
}
