import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LessonInteractiveView from '@/components/courses/LessonInteractiveView'

interface LearnPageProps {
  params: {
    slug: string
  }
  searchParams: {
    lesson?: string
  }
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
  const supabase = await createClient()
  const courseId = params.slug

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // 2. Fetch course info
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    redirect('/courses')
  }

  // 3. Fetch all lessons for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (lessonsError || !lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-slate-900/60 p-8 rounded-3xl border border-slate-800">
          <h2 className="text-xl font-bold mb-2">No Lessons Available</h2>
          <p className="text-slate-400 text-sm mb-6">This course does not have any published lessons yet.</p>
          <a href="/dashboard" className="px-6 py-3 bg-brand-primary text-white text-xs font-bold rounded-2xl shadow-lg">Return to Dashboard</a>
        </div>
      </div>
    )
  }

  // 4. Determine current lesson (from searchParam or default to first lesson)
  const currentLessonId = searchParams.lesson || lessons[0].id
  const initialLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0]

  // 5. Fetch interactive lesson metadata (Notes, Q&A, Reviews, Quizzes, Progress)
  const [
    { data: initialNotes },
    { data: initialQa },
    { data: initialReviews },
    { data: initialQuizzes },
    { data: enrollment }
  ] = await Promise.all([
    supabase.from('lesson_notes' as any).select('*').eq('user_id', user.id).eq('lesson_id', initialLesson.id).order('timestamp', { ascending: true }),
    supabase.from('lesson_qa' as any).select('*').eq('lesson_id', initialLesson.id).order('created_at', { ascending: false }),
    supabase.from('course_reviews' as any).select('*').eq('course_id', courseId).order('created_at', { ascending: false }),
    supabase.from('quizzes' as any).select('*').eq('lesson_id', initialLesson.id),
    supabase.from('enrollments' as any).select('progress').eq('user_id', user.id).eq('course_id', courseId).single()
  ])

  const initialProgress = (enrollment as any)?.progress || 0

  return (
    <LessonInteractiveView
      course={course}
      lessons={lessons}
      initialLesson={initialLesson}
      initialNotes={initialNotes || []}
      initialQa={initialQa || []}
      initialReviews={initialReviews || []}
      initialQuizzes={initialQuizzes || []}
      initialProgress={initialProgress}
      userId={user.id}
    />
  )
}
