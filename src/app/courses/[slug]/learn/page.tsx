'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  video_url: string | null
  order_number: number | null
  duration: number | null
  created_at: string
}

export default function CourseLearnPage() {
  const { brand } = useBrand()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const slug = params?.slug as string
  const lessonParam = searchParams?.get('lesson')

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Check if enrolled
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', slug)
          .single()

        if (!enrollment) {
          router.push(`/courses/${slug}`)
          return
        }
        setProgress(enrollment.progress || 0)

        // Fetch course
        const { data: courseData } = await supabase
          .from('courses')
          .select('*')
          .eq('id', slug)
          .single()

        if (courseData) {
          setCourse(courseData)
        }

        // Fetch lessons
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', slug)
          .order('order_number', { ascending: true })

        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData)
          
          // Set current lesson based on URL param or first lesson
          let targetLesson = lessonsData[0]
          if (lessonParam) {
            const found = lessonsData.find(l => l.id === lessonParam)
            if (found) targetLesson = found
          }
          setCurrentLesson(targetLesson)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, router, supabase, lessonParam])

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson)
    // Update URL with lesson ID
    router.push(`/courses/${slug}/learn?lesson=${lesson.id}`)
  }

  const handleVideoProgress = async (watched: boolean) => {
    if (!user || !currentLesson) return
    
    // Calculate new progress
    const watchedCount = lessons.filter(l => {
      // In a real app, you'd track which lessons are watched
      return l.id === currentLesson.id
    }).length
    
    const newProgress = Math.round((watchedCount / lessons.length) * 100)
    
    // Update enrollment progress
    await supabase
      .from('enrollments')
      .update({ progress: newProgress })
      .eq('user_id', user.id)
      .eq('course_id', slug)
    
    setProgress(newProgress)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading course content...</p>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">You need to enroll in this course to access the content.</p>
          <Link href={`/courses/${slug}`} className="text-brand-primary hover:underline">← Back to Course</Link>
        </div>
      </div>
    )
  }

  const currentIndex = lessons.findIndex(l => l.id === currentLesson.id)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'IFALODE'}
            </Link>
            <span className="text-slate-600">/</span>
            <Link href={`/courses/${slug}`} className="text-sm text-slate-400 hover:text-white transition">
              {course.title}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-brand-primary">Learn</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Progress: {progress}%</span>
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">
              Dashboard
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar - Lesson List */}
        <div className="w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto">
          <div className="p-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Course Content</h2>
            <p className="text-xs text-slate-500">{lessons.length} lessons</p>
          </div>
          <div className="p-2 space-y-1">
            {lessons.map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  currentLesson?.id === lesson.id
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-6">{index + 1}</span>
                  <span className="text-sm flex-1 truncate">{lesson.title}</span>
                  {lesson.duration && (
                    <span className="text-xs text-slate-500">{lesson.duration}min</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Lesson Player */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">
              {currentLesson.title}
            </h1>
            {currentLesson.duration && (
              <p className="text-sm text-slate-500 mb-6">⏱️ {currentLesson.duration} minutes</p>
            )}

            {/* Video Player */}
            {currentLesson.video_url ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-6">
                <video
                  src={currentLesson.video_url}
                  controls
                  className="w-full aspect-video bg-black"
                  onEnded={() => handleVideoProgress(true)}
                />
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-slate-400">No video available for this lesson yet.</p>
                <p className="text-sm text-slate-500 mt-2">Check back later or read the lesson content below.</p>
              </div>
            )}

            {/* Lesson Content */}
            {currentLesson.content && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Lesson Notes</h3>
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    handleLessonClick(lessons[currentIndex - 1])
                  }
                }}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  if (currentIndex < lessons.length - 1) {
                    handleLessonClick(lessons[currentIndex + 1])
                  }
                }}
                disabled={currentIndex === lessons.length - 1}
                className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
