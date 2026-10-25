'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import {
  EmptyState,
  HelpTip,
  LevelBadge,
  PosterFallback,
  Price,
  ProgressBar,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { formatCompactCount, formatDuration } from '@/lib/format'

interface Course {
  id: string
  title: string
  description: string | null
  instructor: string | null
  price: number | null
  cover_image: string | null
  category: string | null
  level: 'beginner' | 'intermediate' | 'advanced' | null
  is_published: boolean
  created_at: string
  updated_at: string
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  order_number: number | null
  created_at: string
}

interface Lesson {
  id: string
  course_id: string
  module_id: string | null
  title: string
  content: string | null
  video_url: string | null
  order_number: number | null
  duration: number | null
  created_at: string
}

const ENROLL_HELP =
  'Enrolling gives you every lesson in this course, in order, on this device and any other you sign in on. Paid courses go to secure checkout first. Free courses open right away.'

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [supabase] = useState(() => createClient())
  const courseId = params?.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return

      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle()

        if (courseError) {
          console.error('Course fetch error:', courseError.message)
        } else if (courseData) {
          setCourse(courseData)
        }

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true })

        if (modulesError) {
          console.error('Modules fetch error:', modulesError.message)
        } else if (modulesData) {
          setModules(modulesData)
        }

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true })

        if (lessonsError) {
          console.error('Lessons fetch error:', lessonsError.message)
        } else if (lessonsData) {
          setLessons(lessonsData)
        }

        // Auth + enrollment check
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)

          const { data: enrollmentData, error: enrollError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle()

          if (enrollError) {
            console.error('Enrollment check error:', enrollError.message)
          }

          if (enrollmentData) {
            setIsEnrolled(true)
            setEnrollment(enrollmentData)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId, supabase])

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!course || !courseId) return

    if (course.price && course.price > 0) {
      router.push(`/checkout?courseId=${courseId}`)
      return
    }

    setEnrolling(true)

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0,
          completed: false
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Enrollment insertion error details:', error)
        alert(`Failed to enroll: ${error.message || 'Please check database constraints or RLS policies.'}`)
      } else if (data) {
        setIsEnrolled(true)
        setEnrollment(data)
        router.push(`/courses/${courseId}/learn`)
      }
    } catch (err: any) {
      console.error('Unexpected enrollment error:', err)
      alert('An unexpected error occurred during enrollment.')
    } finally {
      setEnrolling(false)
    }
  }

  const progress = enrollment && lessons.length > 0
    ? Math.round((enrollment.progress / lessons.length) * 100)
    : 0

  // Group lessons by module
  const lessonsByModule = modules.map((mod) => ({
    module: mod,
    lessons: lessons.filter((l) => l.module_id === mod.id),
  }))

  const lessonsWithoutModule = lessons.filter((l) => !l.module_id)

  const totalDuration = lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0)

  // The progress value counts finished lessons on this page, so the next
  // lesson is the one right after that count. Fall back to the plain
  // continue label when it cannot be worked out.
  const completedCount =
    enrollment && typeof enrollment.progress === 'number' ? enrollment.progress : 0
  const nextLesson =
    isEnrolled && lessons.length > 0 && completedCount < lessons.length
      ? lessons[completedCount]
      : null
  const continueHref = nextLesson
    ? `/courses/${courseId}/learn?lesson=${nextLesson.id}`
    : `/courses/${courseId}/learn`

  const updatedLabel = course?.updated_at
    ? new Date(course.updated_at).toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  const renderLessonRow = (lesson: Lesson, index: number) => {
    const isLocked = !isEnrolled
    return (
      <div
        key={lesson.id}
        role={isLocked ? undefined : 'button'}
        className={`flex items-center gap-3 px-4 py-3.5 transition sm:gap-4 sm:px-5 ${
          isLocked ? '' : 'cursor-pointer hover:bg-cream/5'
        }`}
        onClick={() => {
          if (!isLocked) {
            router.push(`/courses/${courseId}/learn?lesson=${lesson.id}`)
          }
        }}
      >
        <span className="w-6 shrink-0 text-center font-display text-lead text-cream-faint">
          {index + 1}
        </span>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
            isLocked
              ? 'border-cream/10 text-cream-faint'
              : 'border-cream/30 text-cream'
          }`}
        >
          {isLocked ? (
            <Icon name="lock" size={16} />
          ) : (
            <Icon name="play" size={16} variant="Bold" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-body font-semibold ${
              isLocked ? 'text-cream-dim' : 'text-cream'
            }`}
          >
            {lesson.title}
          </span>
          {lesson.duration ? (
            <span className="mt-0.5 flex items-center gap-1 text-caption text-cream-faint">
              <Icon name="clock" size={12} />
              {formatDuration(lesson.duration)}
            </span>
          ) : null}
        </span>
        {isEnrolled && (
          <span className="shrink-0 text-cream-faint" aria-hidden="true">
            <Icon name="download" size={18} />
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6" aria-busy="true">
          <Skeleton className="mt-6 aspect-[16/9] w-full lg:aspect-[16/5]" />
          <div className="mt-8 max-w-2xl space-y-3">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="mt-10 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Course not found"
            body="The course you are looking for does not exist, or it may have been removed."
            action={
              <Link
                href="/courses"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-cream px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                <Icon name="back" size={16} variant="Bold" />
                Back to courses
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  const enrollLabel = enrolling
    ? 'Processing...'
    : !course.price || course.price === 0
      ? 'Enroll free'
      : 'Enroll now'

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      {/* Prime style cinematic hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          {course.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <PosterFallback title={course.title} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/72 to-ink-950/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/35 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:pb-14 lg:pt-10">
          <Link
            href="/courses"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-cream/20 bg-ink-950/55 px-3.5 text-caption font-semibold text-cream backdrop-blur-md transition hover:border-cream/40"
          >
            <Icon name="back" size={15} variant="Bold" />
            Back to courses
          </Link>

          <div className="mt-16 max-w-3xl sm:mt-24 lg:mt-32">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={course.level} />
              {course.category && (
                <span className="inline-flex items-center rounded-md border border-cream/20 bg-ink-950/50 px-2 py-1 text-meta font-bold uppercase tracking-wider text-cream backdrop-blur-sm">
                  {course.category}
                </span>
              )}
              {course.is_published ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-success">
                  <Icon name="check" size={11} variant="Bold" />
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
                  Draft
                </span>
              )}
              {isEnrolled && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gold px-2 py-1 text-meta font-bold uppercase tracking-wider text-ink-950">
                  <Icon name="check" size={11} variant="Bold" />
                  Enrolled
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-display tracking-tight text-cream">
              {course.title}
            </h1>

            {course.instructor && (
              <p className="mt-3 flex items-center gap-2 text-lead text-cream-dim">
                <span className="text-gold">
                  <Icon name="teacher" size={19} />
                </span>
                Taught by {course.instructor}
              </p>
            )}

            {course.description && (
              <p className="mt-3 max-w-2xl text-body leading-relaxed text-cream-dim lg:text-lead lg:leading-relaxed">
                {course.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption font-medium text-cream-dim">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="book" size={15} />
                {formatCompactCount(lessons.length)}{' '}
                {lessons.length === 1 ? 'lesson' : 'lessons'}
              </span>
              {totalDuration > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={15} />
                  {formatDuration(totalDuration)} total
                </span>
              )}
              {updatedLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={15} />
                  Updated {updatedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Body: curriculum plus a sticky purchase card on desktop */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 lg:order-1">
            {/* Mobile price row: the pinned bar below carries the action,
                this row carries the price and its explainer. */}
            {!isEnrolled && (
              <div className="mb-8 flex items-center gap-2 lg:hidden">
                <Price
                  amount={course.price}
                 
                  className="text-headline text-cream"
                />
                <HelpTip text={ENROLL_HELP} label="What enrollment gives you" />
              </div>
            )}

            {isEnrolled && (
              <section
                className="mb-10 rounded-2xl border border-cream/10 bg-ink-850 p-5 shadow-card"
                aria-label="Your progress"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-title text-cream">Your progress</h2>
                  <span className="font-display text-title text-gold">{progress}%</span>
                </div>
                <ProgressBar value={progress} className="mt-3" />
                {nextLesson && (
                  <p className="mt-3 truncate text-body text-cream-dim">
                    Next up: <span className="font-semibold text-cream">{nextLesson.title}</span>
                  </p>
                )}
                <Link
                  href={continueHref}
                  className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light sm:w-auto"
                >
                  <Icon name="play" size={17} variant="Bold" />
                  <span className="truncate">
                    {nextLesson ? `Resume: ${nextLesson.title}` : 'Continue learning'}
                  </span>
                </Link>
              </section>
            )}

            {/* Course content, Prime episodes style */}
            <section aria-label="Course content">
              <SectionHeader title="Course content" className="mb-1" />
              <p className="mb-5 text-caption text-cream-faint">
                {formatCompactCount(lessons.length)}{' '}
                {lessons.length === 1 ? 'lesson' : 'lessons'}
                {totalDuration > 0 ? `, ${formatDuration(totalDuration)} in total` : ''}
                {!isEnrolled && lessons.length > 0
                  ? '. Enroll to unlock every lesson.'
                  : ''}
              </p>

              {lessonsByModule.length === 0 && lessonsWithoutModule.length === 0 ? (
                <EmptyState
                  title="No content yet"
                  body="Lessons for this course are still being prepared. Check back soon."
                />
              ) : (
                <div className="space-y-6">
                  {lessonsByModule.map(({ module, lessons: modLessons }) => (
                    <div
                      key={module.id}
                      className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850"
                    >
                      <div className="border-b border-cream/10 px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-lead text-cream">
                            {module.title}
                          </h3>
                          <span className="text-caption font-semibold text-cream-faint">
                            {formatCompactCount(modLessons.length)}{' '}
                            {modLessons.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                        </div>
                        {module.description && (
                          <p className="mt-1 text-body text-cream-dim">
                            {module.description}
                          </p>
                        )}
                      </div>
                      <div className="divide-y divide-cream/5">
                        {modLessons.map((lesson, index) => renderLessonRow(lesson, index))}
                      </div>
                    </div>
                  ))}

                  {lessonsWithoutModule.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850">
                      <div className="border-b border-cream/10 px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-lead text-cream">
                            Additional Lessons
                          </h3>
                          <span className="text-caption font-semibold text-cream-faint">
                            {formatCompactCount(lessonsWithoutModule.length)}{' '}
                            {lessonsWithoutModule.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-cream/5">
                        {lessonsWithoutModule.map((lesson, index) =>
                          renderLessonRow(lesson, index)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Sticky purchase card, Udemy pattern (desktop) */}
          <aside className="hidden lg:order-2 lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card">
              <div className="relative aspect-video bg-ink-800">
                {course.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <PosterFallback title={course.title} className="absolute inset-0" />
                )}
              </div>
              <div className="p-5">
                {isEnrolled ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-body font-semibold text-cream-dim">Your progress</span>
                      <span className="font-display text-lead text-gold">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} className="mt-3" />
                    <Link
                      href={continueHref}
                      className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                    >
                      <Icon name="play" size={17} variant="Bold" />
                      {nextLesson ? 'Resume course' : 'Continue learning'}
                    </Link>
                    {nextLesson && (
                      <p className="mt-3 truncate text-center text-caption text-cream-faint">
                        Next up: {nextLesson.title}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Price
                        amount={course.price}
                       
                        className="text-headline text-cream"
                      />
                      <HelpTip text={ENROLL_HELP} label="What enrollment gives you" />
                    </div>
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="mt-4 inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-cream px-6 text-body font-bold text-ink-950 shadow-glow transition hover:bg-gold-light disabled:opacity-50"
                    >
                      {enrollLabel}
                    </button>
                    <p className="mt-3 text-center text-caption text-cream-faint">
                      {!course.price || course.price === 0
                        ? 'Free course. It opens as soon as you enroll.'
                        : 'Secure checkout opens on the next step.'}
                    </p>
                  </>
                )}

                <dl className="mt-6 space-y-3 border-t border-cream/10 pt-5 text-body">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="inline-flex items-center gap-2 text-cream-dim">
                      <Icon name="book" size={16} />
                      Lessons
                    </dt>
                    <dd className="font-semibold text-cream">
                      {formatCompactCount(lessons.length)}
                    </dd>
                  </div>
                  {totalDuration > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-cream-dim">
                        <Icon name="clock" size={16} />
                        Total length
                      </dt>
                      <dd className="font-semibold text-cream">{formatDuration(totalDuration)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <dt className="inline-flex items-center gap-2 text-cream-dim">
                      <Icon name="award" size={16} />
                      Level
                    </dt>
                    <dd className="font-semibold capitalize text-cream">
                      {course.level ?? 'All levels'}
                    </dd>
                  </div>
                  {updatedLabel && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="inline-flex items-center gap-2 text-cream-dim">
                        <Icon name="calendar" size={16} />
                        Last updated
                      </dt>
                      <dd className="font-semibold text-cream">{updatedLabel}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </aside>
        </div>

        {/* Spacer so the pinned mobile bar never covers the last lessons */}
        <div className="h-[76px] lg:hidden" aria-hidden="true" />
      </main>

      {/* Pinned mobile action bar, above the app tab bar */}
      <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-cream/10 bg-ink-900/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          {isEnrolled ? (
            <>
              <div className="min-w-0">
                <p className="text-caption text-cream-dim">Your progress</p>
                <p className="font-display text-lead text-cream">{progress}% complete</p>
              </div>
              <Link
                href={continueHref}
                className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-cream px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                <Icon name="play" size={16} variant="Bold" />
                Continue
              </Link>
            </>
          ) : (
            <>
              <Price
                amount={course.price}
               
                className="shrink-0 text-title text-cream"
              />
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="inline-flex min-h-[48px] shrink-0 items-center rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
              >
                {enrollLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
