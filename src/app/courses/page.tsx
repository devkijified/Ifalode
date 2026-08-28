'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types'
import { useBrand } from '@/hooks/useBrand'

export default function CoursesPage() {
  const { brand } = useBrand()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set())
  const supabase = createClient() as any

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
        // Get user's enrollments
        const { data: enrollData } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)
        
        if (enrollData) {
          const enrolledIds = new Set(enrollData.map((e: any) => e.course_id))
          setEnrollments(enrolledIds)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  // Get icon based on course title
  const getIcon = (title: string) => {
    const icons = ['📘', '🧠', '💼', '💻', '🎯', '📚', '✨', '🌟', '🪷', '🔮', '📿', '🕯️']
    const index = title.length % icons.length
    return icons[index]
  }

  // Get level badge color
  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'intermediate': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'advanced': return 'bg-red-500/10 text-red-400 border-red-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading courses...</p>
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

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b pt-16 pb-12 px-4" style={{ 
        background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 1))',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border rounded-full" style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }} />
          <div className="absolute top-40 right-20 w-96 h-96 border rounded-full" style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }} />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-6" style={{ 
            backgroundColor: 'var(--brand-primary, #8B5E3C)',
            borderColor: 'var(--brand-secondary, #D4A574)',
            color: 'var(--brand-secondary, #D4A574)'
          }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--brand-secondary, #D4A574)' }} />
            🎓 Sacred Learning Paths
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Master Ifá Wisdom Through <br />
            <span style={{ 
              background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Structured Courses
            </span>
          </h1>
          
          <p className="text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Learn from initiated Babalawo with comprehensive courses on Odu verses, divination techniques, 
            ritual practices, and the complete Ifá corpus.
          </p>
        </div>
      </header>

      {/* Course Catalog */}
      <main className="flex-1 container mx-auto px-4 py-16 max-w-7xl">
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = enrollments.has(course.id)
              return (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-brand-primary/5"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${course.level === 'beginner' ? 'from-green-500/10' : course.level === 'intermediate' ? 'from-orange-500/10' : 'from-red-500/10'} to-transparent opacity-50`} />
                  
                  <div className="relative p-5">
                    {/* Header with icon and level badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{getIcon(course.title)}</div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getLevelColor(course.level)}`}>
                        {course.level || 'All Levels'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white text-lg mb-1 line-clamp-1 group-hover:text-brand-primary transition">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                      {course.description || 'No description available'}
                    </p>

                    {/* Instructor */}
                    {course.instructor && (
                      <p className="text-xs text-slate-500 mb-4">
                        👤 {course.instructor}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <span className="text-xl font-bold text-brand-primary">
                        {course.price === 0 ? 'FREE' : `$${course.price}`}
                      </span>
                      {isEnrolled ? (
                        <span className="text-sm text-green-400 font-semibold">✅ Enrolled</span>
                      ) : (
                        <span className="text-sm text-slate-500 group-hover:text-brand-primary transition">
                          Enroll →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-32 border rounded-3xl p-10 max-w-lg mx-auto" style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            borderColor: 'var(--brand-primary, #8B5E3C)'
          }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 border" style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}>
              📜
            </div>
            <h3 className="text-xl font-bold text-white mb-3">No Courses Available</h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              The oracle has not yet revealed any courses. Check back soon for new teachings from our Babalawo.
            </p>
            <Link
              href="/store"
              className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md border inline-block"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                borderColor: 'var(--brand-primary, #8B5E3C)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
            >
              Explore E-Books Instead
            </Link>
          </div>
        )}
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
