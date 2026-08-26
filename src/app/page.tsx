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
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to {brand?.display_name || 'IfaLode'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover ancient Ifá wisdom through our curated ebooks, 
            comprehensive courses, and sacred teachings.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/store" 
              className="px-8 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
            >
              Explore Store
            </Link>
            <Link 
              href="/courses" 
              className="px-8 py-3 border-2 border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Ebooks</h2>
            <Link href="/store" className="text-brand-primary hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href="/courses" className="text-brand-primary hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} {brand?.display_name || 'IfaLode'}. All rights reserved.</p>
          <Link href="/admin" className="text-sm opacity-50 hover:opacity-100 transition">
            Admin Dashboard
          </Link>
        </div>
      </footer>
    </div>
  )
}
