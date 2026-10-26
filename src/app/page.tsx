import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { PublicBar } from '@/components/shell/PublicBar'
import { CourseCard } from '@/components/lms/CourseCard'
import { Icon } from '@/components/ui/Icon'
import { LiveBadge, SectionHeader } from '@/components/ui/primitives'
import { formatDateTime, formatMoney, timeUntil } from '@/lib/format'
import type { Course } from '@/types'

// The home is a working front page, not a landing page: search first, then
// a real insight for today, then the learner's own courses, live classes,
// the catalogue, teachings, the store and readings. Everything below is
// live data from the database or the site's own teaching library.

type Teaching = {
  id: string
  category: 'LESSON' | 'INSIGHT' | 'ODU STUDY' | 'PRACTICE'
  title: string
  description: string
  href: string
}

// The site's teaching library (same entries as /teachings). One is featured
// as the insight of the day, rotating by date so the home opens on real
// content every day.
const TEACHINGS: Teaching[] = [
  {
    id: 'ori',
    category: 'LESSON',
    title: 'On understanding your Ori',
    description:
      'Exploring the role of the inner head in destiny, choices, and spiritual alignment.',
    href: '/teachings/ori',
  },
  {
    id: 'ire',
    category: 'INSIGHT',
    title: 'Living with Ire',
    description:
      'What it means to walk in goodness, and how to cultivate ire in daily life.',
    href: '/teachings/ire',
  },
  {
    id: 'odu-language',
    category: 'ODU STUDY',
    title: 'The language of the Odu',
    description:
      'How the Odu speak through signs, stories, and patterns in your life.',
    href: '/teachings/odu-language',
  },
  {
    id: 'ebo',
    category: 'PRACTICE',
    title: 'Understanding Ebó',
    description:
      'The purpose of offerings and how they work within the Ifá system.',
    href: '/teachings/ebo',
  },
  {
    id: 'iwa-pele',
    category: 'LESSON',
    title: 'Ìwà Pẹ̀lẹ́: Good character',
    description:
      'Why good character is the foundation of any serious spiritual path.',
    href: '/teachings/iwa-pele',
  },
  {
    id: 'destiny',
    category: 'INSIGHT',
    title: 'Destiny and free will',
    description:
      'How Ayanmo and personal choice interact in the Ifá worldview.',
    href: '/teachings/destiny',
  },
]

type LiveClassRow = {
  id: string
  title: string
  scheduled_at: string
  status: string
  instructor: string | null
}

type Product = {
  id: string
  title: string
  price: number
  category: string | null
  is_ebook: boolean | null
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createServerClient() as any

  const [
    { data: coursesData },
    { data: productsData },
    { data: brandData },
    { data: liveData },
  ] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('products')
        .select('id, title, price, category, is_ebook')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase.from('brand_settings').select('*').limit(1),
      supabase
        .from('live_classes')
        .select('id, title, scheduled_at, status, instructor')
        .eq('is_published', true)
        .order('scheduled_at', { ascending: true })
        .limit(6),
    ])

  // Public live list, rendered on the server: the student widget needs a
  // signed-in session, so guests would always see an empty state here.
  const liveClasses = ((liveData ?? []) as LiveClassRow[])
    .slice()
    .sort(
      (a, b) =>
        (a.status === 'LIVE' ? 0 : 1) - (b.status === 'LIVE' ? 0 : 1)
    )
    .slice(0, 3)

  const courses = (coursesData ?? []) as Course[]
  const products = (productsData ?? []) as Product[]
  const brand = (brandData ?? [])[0] ?? null
  const teacherName: string = brand?.brand_name || 'Akinsoji Elebuibon'
  const teacherTitle: string | null = brand?.teacher_title || null

  // Continue learning, for a signed-in learner with enrolments.
  let enrolledCourses: Course[] = []
  let progressByCourse = new Map<string, number>()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('course_id, progress')
      .eq('user_id', user.id)
    const enrollments = (enrollData ?? []) as {
      course_id: string
      progress: number | null
    }[]
    if (enrollments.length > 0) {
      progressByCourse = new Map(
        enrollments.map((e) => [
          String(e.course_id),
          typeof e.progress === 'number' ? e.progress : 0,
        ])
      )
      const ids = enrollments.map((e) => e.course_id)
      const { data: enrolledData } = await supabase
        .from('courses')
        .select('*')
        .in('id', ids)
      enrolledCourses = (enrolledData ?? []) as Course[]
    }
  }
  const enrolledIds = new Set(enrolledCourses.map((c) => c.id))

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86_400_000
  )
  const insight = TEACHINGS[dayOfYear % TEACHINGS.length]
  const moreTeachings = TEACHINGS.filter((t) => t.id !== insight.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        {/* Search first: the home works like the catalogue's front door. */}
        <form action="/courses" method="get" className="relative mt-6 max-w-xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-faint">
            <Icon name="search" size={19} />
          </span>
          <input
            type="search"
            name="q"
            placeholder="Search courses, topics or teachers"
            aria-label="Search courses"
            className="min-h-[48px] w-full rounded-full border border-cream/10 bg-ink-850 pl-11 pr-4 text-body text-cream placeholder:text-cream-faint focus:border-gold/60 focus:outline-none"
          />
        </form>

        {/* Insight of the day: real teaching content, rotating daily. */}
        <section aria-label="Insight of the day" className="mt-6">
          <Link
            href={insight.href}
            className="group block overflow-hidden rounded-2xl border border-gold/25 bg-ink-850 p-5 shadow-card transition hover:border-gold/50 sm:p-6"
          >
            <p className="flex items-center gap-2 text-meta font-bold uppercase tracking-wider text-gold">
              <Icon name="book" size={14} variant="Bold" />
              Today&apos;s insight · {insight.category}
            </p>
            <h1 className="mt-3 font-display text-title tracking-tight text-cream sm:text-headline">
              {insight.title}
            </h1>
            <p className="mt-2 max-w-2xl text-body leading-relaxed text-cream-dim">
              {insight.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-body font-bold text-gold">
              Read the teaching
              <Icon name="next" size={16} variant="Bold" />
            </span>
          </Link>
        </section>

        {/* Continue learning */}
        {enrolledCourses.length > 0 && (
          <section className="mt-10" aria-label="Continue learning">
            <SectionHeader title="Continue learning" href="/dashboard" actionLabel="My learning" />
            <div className="rail">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="w-[262px] sm:w-[300px]">
                  <CourseCard
                    course={course}
                    enrolled
                    progress={progressByCourse.get(course.id) ?? 0}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Live classes */}
        <section className="mt-10" aria-label="Live classes">
          <SectionHeader title="Live classes" href="/live-classes" />
          {liveClasses.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-ink-850 px-6 py-8 text-center">
              <p className="text-body text-cream-dim">No upcoming live classes</p>
              <p className="mt-1 text-caption text-cream-faint">
                New sessions appear here as soon as they are scheduled.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {liveClasses.map((lc) => {
                const isLive = lc.status === 'LIVE'
                return (
                  <Link
                    key={lc.id}
                    href={`/live-classes/${lc.id}`}
                    className="group rounded-2xl border border-cream/10 bg-ink-850 p-5 transition hover:border-gold/40"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      {isLive ? (
                        <LiveBadge />
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
                          {timeUntil(lc.scheduled_at)}
                        </span>
                      )}
                      {isLive && (
                        <span className="text-caption font-semibold text-live">
                          Join now
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-1 font-display text-lead tracking-tight text-cream transition group-hover:text-gold">
                      {lc.title}
                    </h3>
                    <p className="mt-2 flex items-center gap-2 text-caption text-cream-faint">
                      <Icon name="calendar" size={15} />
                      {formatDateTime(lc.scheduled_at)}
                      {lc.instructor ? ` · ${lc.instructor}` : ''}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Courses */}
        {courses.length > 0 && (
          <section className="mt-10" aria-label="Courses">
            <SectionHeader title="Courses" href="/courses" />
            <div className="rail">
              {courses.map((course) => (
                <div key={course.id} className="w-[262px] sm:w-[300px]">
                  <CourseCard
                    course={course}
                    enrolled={enrolledIds.has(course.id)}
                    progress={progressByCourse.get(course.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* More teachings */}
        <section className="mt-10" aria-label="Teachings">
          <SectionHeader title="Teachings" href="/teachings" />
          <div className="grid gap-4 sm:grid-cols-3">
            {moreTeachings.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                className="group rounded-2xl border border-cream/10 bg-ink-850 p-5 transition hover:border-gold/40"
              >
                <p className="text-meta font-bold uppercase tracking-wider text-gold">
                  {t.category}
                </p>
                <h3 className="mt-2 font-display text-body-lg font-bold text-cream">
                  {t.title}
                </h3>
                <p className="mt-1.5 text-caption leading-relaxed text-cream-dim">
                  {t.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Store */}
        {products.length > 0 && (
          <section className="mt-10" aria-label="From the store">
            <SectionHeader title="From the store" href="/store" />
            <ul className="divide-y divide-cream/5 overflow-hidden rounded-2xl border border-cream/10 bg-ink-850">
              {products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/store/${product.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/[0.03]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-gold">
                      <Icon name="bag" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-cream">
                        {product.title}
                      </span>
                      <span className="block text-caption text-cream-faint">
                        {product.category || (product.is_ebook ? 'Ebook' : 'Product')}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-body font-bold text-cream">
                      {formatMoney(product.price)}
                    </span>
                    <span className="shrink-0 text-cream-faint">
                      <Icon name="chevron" size={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Readings + teacher */}
        <section className="mt-10 grid gap-4 lg:grid-cols-2" aria-label="Readings and your teacher">
          <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-meta font-bold uppercase tracking-wider text-gold">
              <Icon name="calendar" size={14} variant="Bold" />
              Readings
            </p>
            <h3 className="mt-2 font-display text-title tracking-tight text-cream">
              Book a reading
            </h3>
            <p className="mt-1.5 max-w-md text-body leading-relaxed text-cream-dim">
              Send a request for a divination reading or consultation. You get a
              reply with the time and the next steps, no payment needed to ask.
            </p>
            <Link
              href="/readings"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              Request a reading
            </Link>
          </div>

          <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-meta font-bold uppercase tracking-wider text-gold">
              <Icon name="people" size={14} variant="Bold" />
              Your teacher
            </p>
            <h3 className="mt-2 font-display text-title tracking-tight text-cream">
              {teacherName}
            </h3>
            {teacherTitle && (
              <p className="mt-1 text-body font-semibold text-gold">
                {teacherTitle}
              </p>
            )}
            <p className="mt-1.5 max-w-md text-body leading-relaxed text-cream-dim">
              Keeper of the Yoruba and Ifá tradition, sharing teachings,
              offerings and guidance from a lifetime of practice.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-cream/15 px-5 text-body font-bold text-cream transition hover:border-gold/50 hover:text-gold"
            >
              Meet your teacher
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
