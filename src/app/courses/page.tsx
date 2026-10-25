'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types'
import { CourseCard } from '@/components/lms/CourseCard'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import {
  EmptyState,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { formatCompactCount } from '@/lib/format'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set())
  const [enrollmentProgress, setEnrollmentProgress] = useState<Map<string, number>>(
    new Map()
  )
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const supabase = createClient() as any

  // The home page search submits here with ?q=; pick it up on mount.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setQuery(q)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (coursesData) {
        setCourses(coursesData)
      }

      // Check if user is logged in and get enrollments
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Get user's enrollments. Progress is included so the continue
        // learning strip can show a real bar from the learner's own record.
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('course_id, progress')
          .eq('user_id', user.id)

        if (enrollData) {
          const enrolledIds = new Set<string>(enrollData.map((e: any) => String(e.course_id)))
          setEnrollments(enrolledIds)
          setEnrollmentProgress(
            new Map<string, number>(
              enrollData.map((e: any) => [
                String(e.course_id),
                typeof e.progress === 'number' ? e.progress : 0,
              ])
            )
          )
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const course of courses) {
      if (course.category) seen.add(course.category)
    }
    return Array.from(seen)
  }, [courses])

  const enrolledCourses = useMemo(
    () => courses.filter((course) => enrollments.has(course.id)),
    [courses, enrollments]
  )

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((course) => {
      if (activeCategory && course.category !== activeCategory) return false
      if (!q) return true
      return [course.title, course.description, course.instructor, course.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [courses, query, activeCategory])

  const isFiltering = query.trim().length > 0 || activeCategory !== null
  const newestCourses = useMemo(() => courses.slice(0, 6), [courses])

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        {/* Compact header */}
        <header className="pb-2 pt-8 lg:pt-12">
          <h1 className="font-display text-headline tracking-tight text-cream lg:text-display">
            Courses
          </h1>
          <p className="mt-2 max-w-xl text-body text-cream-dim">
            Structured Ifa courses taught by initiated teachers. Learn lesson by
            lesson, at your own pace, and pick up right where you left off.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream-faint">
              <Icon name="search" size={19} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, topics or teachers"
              aria-label="Search courses"
              className="min-h-[48px] w-full rounded-full border border-cream/10 bg-ink-850 pl-11 pr-11 text-body text-cream placeholder:text-cream-faint focus:border-gold/60 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-cream-dim transition hover:bg-cream/5 hover:text-cream"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Category chips: filters, so a scrollable row is right here.
              Primary actions never live in this row. */}
          {categories.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`min-h-[38px] shrink-0 rounded-full px-4 text-body font-semibold transition ${
                  activeCategory === null
                    ? 'bg-gold text-ink-950'
                    : 'border border-cream/15 bg-ink-850 text-cream-dim hover:text-cream'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setActiveCategory(activeCategory === category ? null : category)
                  }
                  className={`min-h-[38px] shrink-0 rounded-full px-4 text-body font-semibold transition ${
                    activeCategory === category
                      ? 'bg-gold text-ink-950'
                      : 'border border-cream/15 bg-ink-850 text-cream-dim hover:text-cream'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </header>

        {loading ? (
          <div aria-busy="true">
            <Skeleton className="mt-6 aspect-[16/7] w-full lg:aspect-[16/4]" />
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850">
                  <Skeleton className="aspect-video w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No courses available yet"
              body="New courses are being prepared by our teachers. Check back soon, or browse the store in the meantime."
              action={
                <Link
                  href="/store"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                >
                  Browse the store
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Continue learning: Prime continue watching pattern */}
            {user && enrolledCourses.length > 0 && !isFiltering && (
              <section className="mt-8" aria-label="Continue learning">
                <SectionHeader title="Continue learning" />
                <div className="rail">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="w-[262px] sm:w-[300px]">
                      <CourseCard
                        course={course}
                        enrolled
                        progress={enrollmentProgress.get(course.id) ?? 0}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Newest rail */}
            {!isFiltering && courses.length >= 4 && (
              <section className="mt-10" aria-label="Newest courses">
                <SectionHeader title="Newest courses" />
                <div className="rail">
                  {newestCourses.map((course) => (
                    <div key={course.id} className="w-[262px] sm:w-[300px]">
                      <CourseCard
                        course={course}
                        enrolled={enrollments.has(course.id)}
                        progress={enrollmentProgress.get(course.id)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All courses / filtered results */}
            <section className="mt-10" aria-label="All courses">
              <SectionHeader
                title={activeCategory ?? 'All courses'}
                className="mb-1"
              />
              <p className="mb-4 text-caption text-cream-faint">
                {formatCompactCount(filteredCourses.length)}{' '}
                {filteredCourses.length === 1 ? 'course' : 'courses'}
                {query.trim()
                  ? ` matching ${'\u201C'}${query.trim()}${'\u201D'}`
                  : ''}
              </p>

              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      enrolled={enrollments.has(course.id)}
                      progress={enrollmentProgress.get(course.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No courses match your search"
                  body="Try a different word, or clear the search and filters to see every course."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        setActiveCategory(null)
                      }}
                      className="inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                    >
                      Clear search and filters
                    </button>
                  }
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
