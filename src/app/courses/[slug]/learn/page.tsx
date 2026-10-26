import { createServerClient } from '@/lib/supabase/server'
import LessonClientView from '@/app/courses/LessonClientView'
import { formatMoney } from '@/lib/format'

export default async function LearnPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  const courseIdOrSlug = resolvedParams.slug

  const supabase = await createServerClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6 text-center text-cream">
        <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-meta font-bold uppercase tracking-wider text-gold">
          Members only
        </span>
        <h1 className="mt-4 font-display text-headline tracking-tight">Sign in to continue</h1>
        <p className="mt-2 max-w-sm text-body text-cream-dim">Please sign in to access this course and pick up your lessons.</p>
        <a
          href={`/login?redirect=/courses/${courseIdOrSlug}/learn`}
          className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 font-display text-body text-ink-950 transition hover:bg-gold-light"
        >
          Sign in
        </a>
        <a href="/courses" className="mt-3 text-body font-medium text-cream-dim transition hover:text-cream">
          Browse courses instead
        </a>
      </div>
    )
  }

  // 2. Fetch Course Details
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseIdOrSlug)
    .single()

  if (courseError || !courseData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6 text-center text-cream">
        <span className="rounded-full border border-cream/15 px-3 py-1 text-meta font-bold uppercase tracking-wider text-cream-dim">
          Not found
        </span>
        <h1 className="mt-4 font-display text-headline tracking-tight">Course not found</h1>
        <p className="mt-2 max-w-sm text-body text-cream-dim">This course does not exist or has been removed.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 font-display text-body text-ink-950 transition hover:bg-gold-light"
        >
          Return to My learning
        </a>
        <a href="/courses" className="mt-3 text-body font-medium text-cream-dim transition hover:text-cream">
          Browse courses instead
        </a>
      </div>
    )
  }

  const course: any = courseData
  const courseId = course.id

  // 3. Fetch Modules for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_number', { ascending: true })

  // 4. Fetch Lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_number', { ascending: true })

  // 5. Handle Empty Lessons scenario safely
  if (lessonsError || !lessons || lessons.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6 text-center text-cream">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold/40 font-display text-title text-gold" aria-hidden="true">
          !
        </span>
        <h1 className="mt-5 font-display text-headline tracking-tight">No lessons yet</h1>
        <p className="mt-2 max-w-sm text-body text-cream-dim">
          This course does not have any published lessons yet. Please check back soon.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex min-h-[48px] items-center rounded-full border border-cream/15 px-6 font-display text-body text-cream transition hover:border-cream/30 hover:bg-cream/5"
        >
          Return to My learning
        </a>
      </div>
    )
  }

  // 6. Select current lesson
  const selectedLessonId = resolvedSearch.lesson
  const initialLesson = lessons.find((l: any) => l.id === selectedLessonId) || lessons[0]

  // 7. Enrolment gate. Paid courses stay locked until the student is
  // enrolled: the detail page sends buyers to checkout first, and a
  // paid lesson must never render for a signed-in non-buyer. Free
  // courses open right away, so enrol the student on the spot, which
  // also gives their progress a row to live in. Admins always pass.
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()

  let effectiveEnrollment: any = enrollment

  if (!effectiveEnrollment) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const isAdmin = (profile as any)?.role === 'admin'
    const isFree = !course.price || Number(course.price) === 0

    if (!isAdmin && !isFree) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6 text-center text-cream">
          <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-meta font-bold uppercase tracking-wider text-gold">
            Locked course
          </span>
          <h1 className="mt-4 font-display text-headline tracking-tight">{course.title}</h1>
          <p className="mt-2 max-w-sm text-body text-cream-dim">
            This course is {formatMoney(course.price)}. Enrol to unlock all{' '}
            {lessons.length} lessons, in order, on any device you sign in on.
          </p>
          <a
            href={`/courses/${courseId}`}
            className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 font-display text-body text-ink-950 transition hover:bg-gold-light"
          >
            View course and enrol
          </a>
          <a href="/courses" className="mt-3 text-body font-medium text-cream-dim transition hover:text-cream">
            Browse courses instead
          </a>
        </div>
      )
    }

    if (!isAdmin && isFree) {
      const { data: created } = await (supabase as any)
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0,
          completed: false,
        })
        .select('*')
        .maybeSingle()
      if (created) effectiveEnrollment = created
    }
  }

  return (
    <LessonClientView
      course={course}
      modules={modules || []}
      lessons={lessons}
      initialLesson={initialLesson}
      initialProgress={(effectiveEnrollment as any)?.progress || 0}
      userId={user.id}
    />
  )
}
