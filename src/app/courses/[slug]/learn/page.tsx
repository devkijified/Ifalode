import { createClient } from '@/lib/supabase/server'
import { redirect } from 'not-found' // or next/navigation
import LessonClientView from '@/app/courses/LessonClientView'

export default async function LearnPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ lesson?: string }> }) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams
  const courseId = resolvedParams.id
  
  const supabase = await createClient()

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect(`/auth/login?redirect=/courses/${courseId}/learn`)
  }

  // 2. Fetch Course Details (bypassing is_published check for enrolled students/owners)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
        <p className="text-slate-400 mb-6">This course does not exist or has been removed.</p>
        <a href="/dashboard" className="px-6 py-3 bg-brand-primary rounded-xl font-bold text-sm">Return to Dashboard</a>
      </div>
    )
  }

  // 3. Fetch Lessons for this course, ordered by order_number
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_number', { ascending: true })

  console.log('DEBUG: Fetched lessons for course', courseId, lessons)

  // 4. Handle Empty Lessons scenario
  if (lessonsError || !lessons || lessons.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">No Lessons Available</h1>
        <p className="text-slate-400 mb-6">This course does not have any published lessons loaded yet, or the lesson records are unlinked.</p>
        <a href="/dashboard" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 transition rounded-xl font-bold text-sm text-white">Return to Dashboard</a>
      </div>
    )
  }

  // 5. Select current lesson (either from URL query param or default to first lesson)
  const selectedLessonId = resolvedSearch.lesson
  const initialLesson = lessons.find(l => l.id === selectedLessonId) || lessons[0]

  // 6. Fetch user enrollment, notes, Q&A, reviews, quizzes in parallel
  const [
    { data: enrollment },
    { data: initialNotes },
    { data: initialQa },
    { data: initialReviews },
    { data: initialQuizzes }
  ] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    supabase.from('lesson_notes').select('*').eq('user_id', user.id).eq('lesson_id', initialLesson.id).order('created_at', { ascending: false }),
    supabase.from('lesson_qa').select('*').eq('lesson_id', initialLesson.id).order('created_at', { ascending: false }),
    supabase.from('course_reviews').select('*').eq('course_id', courseId),
    supabase.from('quizzes').select('*').eq('lesson_id', initialLesson.id)
  ])

  return (
    <LessonClientView
      course={course}
      lessons={lessons}
      initialLesson={initialLesson}
      initialNotes={initialNotes || []}
      initialQa={initialQa || []}
      initialReviews={initialReviews || []}
      initialQuizzes={initialQuizzes || []}
      initialProgress={enrollment?.progress || 0}
      userId={user.id}
    />
  )
}
