import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LessonInteractiveView from '@/components/courses/LessonInteractiveView'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lesson?: string }>
}

export default async function CourseLearnPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { lesson: lessonParam } = await searchParams

  const supabase = await createClient()

  // 1. Authenticate user server-side
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch enrollment status server-side
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', slug)
    .single()

  if (!enrollment) {
    redirect(`/courses/${slug}`)
  }

  // 3. Fetch course data server-side
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', slug)
    .single()

  if (courseError || !course) {
    notFound()
  }

  // 4. Fetch lessons server-side
  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', slug)
    .order('order_number', { ascending: true })

  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">📂</div>
          <h2 className="text-xl font-bold text-white mb-2">No Lessons Available</h2>
          <p className="text-slate-400 text-sm mb-6">This course does not have any modules or lessons published yet.</p>
          <Link href={`/courses/${slug}`} className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/20">
            ← Return to Course Overview
          </Link>
        </div>
      </div>
    )
  }

  let currentLesson = lessons[0]
  if (lessonParam) {
    const found = lessons.find((l) => l.id === lessonParam)
    if (found) currentLesson = found
  }

  // 5. Fetch initial related records for the current lesson server-side
  const [{ data: notes }, { data: qaList }, { data: reviews }, { data: quizzes }] = await Promise.all([
    supabase.from('lesson_notes' as any).select('*').eq('user_id', user.id).eq('lesson_id', currentLesson.id).order('timestamp', { ascending: true }),
    supabase.from('lesson_qa' as any).select('*').eq('lesson_id', currentLesson.id).order('created_at', { ascending: false }),
    supabase.from('course_reviews' as any).select('*').eq('course_id', slug).order('created_at', { ascending: false }),
    supabase.from('quizzes' as any).select('*').eq('lesson_id', currentLesson.id)
  ])

  return (
    <LessonInteractiveView
      course={course}
      lessons={lessons}
      initialLesson={currentLesson}
      initialNotes={notes || []}
      initialQa={qaList || []}
      initialReviews={reviews || []}
      initialQuizzes={quizzes || []}
      initialProgress={enrollment.progress || 0}
      userId={user.id}
    />
  )
}
