'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Course } from '@/types'
import { CourseCard } from '@/components/lms/CourseCard'
import { useBrand } from '@/hooks/useBrand'

export default function CoursesPage() {
  const { brand } = useBrand()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (data) setCourses(data)
      setLoading(false)
    }

    fetchCourses()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading courses...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {brand?.display_name || 'Ifalode'}
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/store" className="text-sm hover:text-brand-primary transition">Store</Link>
            <Link href="/courses" className="text-sm text-brand-primary font-semibold transition">Courses</Link>
            <Link 
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:opacity-90 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">🎓 Available Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  )
}
