'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

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

export default function CourseDetailPage() {
  const { brand } = useBrand()
  const params = useParams()
  const router = useRouter()
  // Created once via useState initializer instead of on every render, and
  // deliberately left out of the effect's dependency array below — if this
  // were recreated each render and included as a dependency, any setState
  // call inside the effect would trigger a re-render, produce a new client
  // reference, and re-fire the effect again in a loop.
  const [supabase] = useState(() => createClient())
  const courseId = params?.slug as string

  const [course, setCourse] = useState<Course | null>(null)
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
        // Fetch course by id.
        // maybeSingle() instead of single(): single() throws a noisy
        // PostgREST error whenever zero rows come back (bad id, RLS
        // blocked, etc.) — we already handle "not found" gracefully via
        // the !course check below, so we don't need single()'s stricter
        // exactly-one-row error behavior here.
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

        // Fetch lessons for this course
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

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)

          // Check if enrolled
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

    // If course is paid (price > 0), redirect to payment/checkout page instead of direct enrollment
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
        })
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

  const progress = enrollment && lessons.length > 0 ? Math.round((enrollment.progress / lessons.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Course Not Found</h1>
          <p className="text-slate-400 mb-6">The course you're looking for doesn't exist.</p>
          <Link href="/courses" className="text-brand-primary hover:underline">← Back to Courses</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🪵</span>
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'IFALODE'}
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="text-brand-primary font-semibold transition">Courses</Link>
            {user ? (
              <Link 
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-semibold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:opacity-90 transition"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:opacity-90 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Course Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-8">
          ← Back to Courses
        </Link>

        {/* Course Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${course.level === 'beginner' ? 'bg-green-500/10 text-green-400 border-green-500/20' : course.level === 'intermediate' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {course.level || 'All Levels'}
            </span>
            {course.is_published ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                Published
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                Draft
              </span>
            )}
            {isEnrolled && (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ✅ Enrolled
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            {course.title}
          </h1>

          {course.instructor && (
            <p className="text-lg text-slate-400 mb-4">
              👤 Taught by {course.instructor}
            </p>
          )}

          <p className="text-lg text-slate-300 leading-relaxed mb-6">
            {course.description || 'No description available.'}
          </p>

          {/* Progress bar for enrolled users */}
          {isEnrolled && (
            <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Your Progress</span>
                <span className="text-sm font-semibold text-brand-primary">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <Link 
                href={`/courses/${courseId}/learn`}
                className="mt-4 inline-block px-6 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                Continue Learning →
              </Link>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-brand-primary">
              {!course.price || course.price === 0 ? 'FREE' : `$${course.price}`}
            </span>
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-8 py-3 rounded-xl font-semibold bg-brand-primary hover:opacity-90 text-white shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition"
              >
                {enrolling ? 'Processing...' : (!course.price || course.price === 0 ? 'Enroll Free' : 'Enroll Now')}
              </button>
            ) : (
              <Link
                href={`/courses/${courseId}/learn`}
                className="px-8 py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 transition text-white shadow-lg shadow-green-600/20"
              >
                Continue Learning →
              </Link>
            )}
          </div>
        </div>

        {/* Lessons */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">📚 Course Lessons</h2>
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800">
              <p className="text-slate-400">No lessons available for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => {
                const isLocked = !isEnrolled
                return (
                  <div 
                    key={lesson.id} 
                    className={`flex items-center gap-4 p-4 bg-slate-900 rounded-xl border ${
                      isLocked ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700 cursor-pointer'
                    } transition`}
                    onClick={() => {
                      if (!isLocked) {
                        router.push(`/courses/${courseId}/learn?lesson=${lesson.id}`)
                      }
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{lesson.title}</h3>
                      {lesson.duration && (
                        <p className="text-xs text-slate-500">⏱️ {lesson.duration} min</p>
                      )}
                    </div>
                    {isLocked ? (
                      <span className="text-sm text-slate-500">🔒 Locked</span>
                    ) : (
                      <span className="text-sm text-brand-primary">▶️ Watch</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪵</span>
            <p className="text-lg font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'IFALODE'}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand?.display_name || 'IFALODE'}. Preserving Ifá wisdom for future generations.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
