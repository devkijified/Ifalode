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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-primary selection:text-white">
      {/* Navigation / Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'Ifalode'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="/store" className="hover:text-brand-primary transition">Store</Link>
            <Link href="/courses" className="hover:text-brand-primary transition">Courses</Link>
            <Link href="#features" className="hover:text-brand-primary transition">Wisdom</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/store"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium bg-slate-900 border border-slate-800 rounded-xl hover:border-brand-primary/50 transition"
            >
              Sign In
            </Link>
            <Link 
              href="/courses"
              className="px-5 py-2.5 text-sm font-semibold bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover:opacity-90 transition active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        {/* Background Glow Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-primary/15 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-brand-secondary/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-8 uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            Sacred Teachings & Modern Learning
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.15]">
            Secure Your Digital Path & <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
              Regain Full Control.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover ancient Ifá wisdom through our curated ebooks, comprehensive courses, 
            and expert digital empowerment support tailored for modern seekers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/store" 
              className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-semibold rounded-2xl shadow-xl shadow-brand-primary/25 hover:translate-y-[-2px] transition"
            >
              Explore Store
            </Link>
            <Link 
              href="/courses" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-slate-200 font-semibold rounded-2xl hover:bg-slate-800 hover:border-slate-700 transition"
            >
              Browse Courses
            </Link>
          </div>

          {/* Quick Metrics / Social Proof */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20 pt-12 border-t border-slate-800/80">
            <div className="text-center">
              <p className="text-3xl font-black text-white">100%</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Authentic Wisdom</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">Expert</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Guidance & Support</p>
            </div>
            <div className="col-span-2 md:col-span-1 text-center">
              <p className="text-3xl font-black text-white">Trusted</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Global Community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ebooks Section */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Featured Ebooks</h2>
              <p className="text-sm text-slate-400 mt-1">Deepen your understanding with foundational literature.</p>
            </div>
            <Link href="/store" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition inline-flex items-center gap-1 group">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Featured Courses</h2>
              <p className="text-sm text-slate-400 mt-1">Step-by-step masterclasses led by dedicated practitioners.</p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition inline-flex items-center gap-1 group">
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

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="text-lg font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'Ifalode'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              © {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/store" className="hover:text-brand-primary transition">Store</Link>
            <Link href="/courses" className="hover:text-brand-primary transition">Courses</Link>
            <Link href="/admin" className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium hover:border-brand-primary/50 transition">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
