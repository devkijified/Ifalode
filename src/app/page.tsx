'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useBrand } from '@/hooks/useBrand'
import { createClient } from '@/lib/supabase/client'
import { Product, Course } from '@/types'
import { ProductCard } from '@/components/store/ProductCard'
import { CourseCard } from '@/components/lms/CourseCard'

export default function HomePage() {
  const { brand } = useBrand()
  const [products, setProducts] = useState<Product[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .limit(4)
      
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(4)

      if (productsData) setProducts(productsData)
      if (coursesData) setCourses(coursesData)
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ 
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      {/* Navigation / Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="#features" className="hover:text-white transition">Wisdom</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/store"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium border rounded-xl transition"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'var(--brand-primary, #8B5E3C)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
            >
              Sign In
            </Link>
            <Link 
              href="/courses"
              className="px-5 py-2.5 text-sm font-semibold rounded-xl shadow-lg transition active:scale-95"
              style={{ 
                backgroundColor: 'var(--brand-primary, #8B5E3C)',
                color: 'white',
                boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background Glow Accents */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] blur-[140px] pointer-events-none rounded-full" 
          style={{ backgroundColor: 'var(--brand-primary, #8B5E3C)', opacity: 0.15 }}
        />
        <div 
          className="absolute top-1/3 right-1/4 w-[400px] h-[300px] blur-[120px] pointer-events-none rounded-full" 
          style={{ backgroundColor: 'var(--brand-secondary, #D4A574)', opacity: 0.1 }}
        />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold mb-8 uppercase tracking-widest shadow-sm"
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
            🪵 Sacred Teachings & Modern Learning
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.15] text-white">
            Ancient Ifá Wisdom & <br className="hidden sm:block" />
            <span style={{ 
              background: 'linear-gradient(to right, var(--brand-primary, #8B5E3C), var(--brand-secondary, #D4A574), var(--brand-accent, #C41E3A))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Digital Empowerment
            </span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
            Discover authentic Ifá corpus, Odu verses, and spiritual guides from initiated Babalawo. 
            Preserve the wisdom of Ọ̀rúnmìlà for the digital age.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/store" 
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-2xl shadow-xl transition hover:translate-y-[-2px]"
              style={{ 
                backgroundColor: 'var(--brand-primary, #8B5E3C)',
                color: 'white',
                boxShadow: '0 10px 25px -5px var(--brand-primary, #8B5E3C)'
              }}
            >
              Explore Store
            </Link>
            <Link 
              href="/courses" 
              className="w-full sm:w-auto px-8 py-4 font-semibold rounded-2xl border transition hover:bg-slate-800"
              style={{ 
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderColor: 'var(--brand-primary, #8B5E3C)',
                color: 'var(--brand-secondary, #D4A574)'
              }}
            >
              Browse Courses
            </Link>
          </div>

          {/* Quick Metrics / Social Proof */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20 pt-12 border-t" style={{ 
            borderColor: 'var(--brand-primary, #8B5E3C)'
          }}>
            <div className="text-center">
              <p className="text-3xl font-black text-white">100%</p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Authentic Wisdom</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">Expert</p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Babalawo Guidance</p>
            </div>
            <div className="col-span-2 md:col-span-1 text-center">
              <p className="text-3xl font-black text-white">Trusted</p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Global Community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ebooks Section */}
      <section className="py-20 border-y" style={{ 
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        borderColor: 'var(--brand-primary, #8B5E3C)'
      }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">📚 Sacred Texts & E-Books</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Deepen your understanding with foundational Ifá literature.</p>
            </div>
            <Link href="/store" className="text-sm font-semibold transition inline-flex items-center gap-1 group" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">🎓 Learning Paths</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--brand-secondary, #D4A574)' }}>Step-by-step masterclasses led by initiated Babalawo.</p>
            </div>
            <Link href="/courses" className="text-sm font-semibold transition inline-flex items-center gap-1 group" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
              View All <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Features / Wisdom Section */}
      <section id="features" className="py-20 border-t" style={{ 
        borderColor: 'var(--brand-primary, #8B5E3C)',
        backgroundColor: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Why Choose IFALODE?</h2>
            <p className="text-lg" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
              A complete platform for Babalawo and spiritual seekers combining authentic wisdom with modern technology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 rounded-2xl border" style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}>
              <div className="text-5xl mb-4">🪵</div>
              <h3 className="text-xl font-bold text-white mb-3">Authentic Ifá Corpus</h3>
              <p className="text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
                Access verified Odu verses and teachings from initiated Babalawo worldwide.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border" style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}>
              <div className="text-5xl mb-4">📿</div>
              <h3 className="text-xl font-bold text-white mb-3">Complete LMS</h3>
              <p className="text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
                Structured courses with progress tracking, certificates, and community support.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border" style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.4)',
              borderColor: 'var(--brand-primary, #8B5E3C)'
            }}>
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-3">Fully Customizable</h3>
              <p className="text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
                White-label CMS for Babalawo to brand their digital presence completely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ 
        borderColor: 'var(--brand-primary, #8B5E3C)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)'
      }}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-2xl">🪵</span>
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
            <p className="text-xs mt-1" style={{ color: 'var(--brand-secondary, #D4A574)', opacity: 0.7 }}>
              © {new Date().getFullYear()} {brand?.display_name || 'IFALODE'}. Preserving Ifá wisdom for future generations.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--brand-secondary, #D4A574)' }}>
            <Link href="/store" className="hover:text-white transition">Store</Link>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <Link href="/admin" className="px-3 py-1.5 rounded-lg border text-xs font-medium transition" style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderColor: 'var(--brand-primary, #8B5E3C)',
              color: 'var(--brand-secondary, #D4A574)'
            }}>
              Admin Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
