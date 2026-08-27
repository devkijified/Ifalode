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
    return (
      <div className="min-h-screen flex items-center justify-center gap-6" style={{ 
        backgroundColor: '#0f172a',
        color: 'var(--brand-secondary, #D4A574)'
      }}>
        <div className="relative w-20 h-20">
          <div 
            className="absolute inset-0 rounded-full border-2 animate-pulse" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
          <div 
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" 
            style={{ 
              borderColor: 'var(--brand-primary, #8B5E3C)',
              borderTopColor: 'transparent'
            }} 
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">📿</div>
        </div>
        <div className="text-center space-y-2">
          <p 
            className="text-sm font-medium tracking-widest uppercase"
            style={{ color: 'var(--brand-secondary, #D4A574)' }}
          >
            Consulting the Oracle
          </p>
          <p className="text-stone-400 text-xs">Loading sacred teachings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🪵</span>
            <span 
              className="text-2xl font-black tracking-wider transition"
              style={{ 
                background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {brand?.display_name || 'IFALODE'}
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="font-semibold transition" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Courses</Link>
            <Link 
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition"
              style={{ 
                backgroundColor: 'var(--brand-primary, #8B5E3C)',
                color: 'white',
                boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative overflow-hidden border-b pt-16 pb-12 px-4" style={{ 
        background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 1))',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        {/* Decorative patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div 
            className="absolute top-20 left-10 w-64 h-64 border rounded-full" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
          <div 
            className="absolute top-40 right-20 w-96 h-96 border rounded-full" 
            style={{ borderColor: 'var(--brand-primary, #8B5E3C)' }}
          />
        </div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ 
              backgroundColor: 'var(--brand-primary, #8B5E3C)',
              borderColor: 'var(--brand-secondary, #D4A574)',
              color: 'var(--brand-secondary, #D4A574)'
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: 'var(--brand-secondary, #D4A574)' }}
            />
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
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-32 border rounded-3xl p-10 max-w-lg mx-auto"
            style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}
          >
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-6 border"
              style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderColor: 'var(--brand-primary, #8B5E3C)'
              }}
            >
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
      <footer className="border-t py-12" style={{ 
        borderColor: 'var(--brand-primary, #8B5E3C)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)'
      }}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪵</span>
            <p 
              className="text-lg font-bold transition"
              style={{ 
                background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {brand?.display_name || 'IFALODE'}
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--brand-secondary, #D4A574)', opacity: 0.7 }}>
            © {new Date().getFullYear()} {brand?.display_name || 'IFALODE'}. Preserving Ifá wisdom for future generations.
          </p>
          <div className="flex gap-6 text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
