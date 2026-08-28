import { createServerClient } from '@/lib/supabase/server'
import LessonClientView from '@/app/courses/LessonClientView'

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
  
  const supabase = (await createServerClient()) as any

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-slate-400 mb-6">Please log in to access this course.</p>
        <a href={`/auth/login?redirect=/courses/${courseIdOrSlug}/learn`} className="px-6 py-3 bg-brand-primary rounded-xl font-bold text-sm text-white">Log In</a>
      </div>
    )
  }

  // 2. Fetch Course Details safely using type-erased client
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseIdOrSlug)
    .single()

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Course Not Found</h1>
        <p className="text-slate-400 mb-6">This course does not exist or has been removed.</p>
        <a href="/dashboard" className="px-6 py-3 bg-brand-primary rounded-xl font-bold text-sm text-white">Return to Dashboard</a>
      </div>
    )
  }

  const courseId = course.id

  // 3. Fetch Lessons for this course, ordered by order_number
  const { data: rawLessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_number', { ascending: true })

  const lessons = (rawLessons || []) as any[]

  // 4. Handle Empty Lessons scenario safely
  if (lessonsError || lessons.length === 0) {
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
  const initialLesson = lessons.find((l: any) => l.id === selectedLessonId) || lessons[0]
  const lessonId = initialLesson.id as string

  // 6. Fetch user enrollment, notes, Q&A, reviews, quizzes in parallel safely
  const [
    { data: enrollment },
    { data: initialNotes },
    { data: initialQa },
    { data: initialReviews },
    { data: initialQuizzes }
  ] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    supabase.from('lesson_notes').select('*').eq('user_id', user.id).eq('lesson_id', lessonId).order('created_at', { ascending: false }),
    supabase.from('lesson_qa').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: false }),
    supabase.from('course_reviews').select('*').eq('course_id', courseId),
    supabase.from('quizzes').select('*').eq('lesson_id', lessonId)
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
