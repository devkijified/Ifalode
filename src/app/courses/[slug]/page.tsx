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
  const supabase = createClient()
  const slug = params?.slug as string

  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return

      try {
        // Fetch course
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', slug)
          .single()

        if (courseError) {
          console.error('Course fetch error:', courseError)
        } else if (courseData) {
          setCourse(courseData)
        }

        // Fetch lessons
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', slug)
          .order('order_number', { ascending: true })

        if (lessonsError) {
          console.error('Lessons fetch error:', lessonsError)
        } else if (lessonsData) {
          console.log('✅ Lessons found:', lessonsData.length)
          setLessons(lessonsData)
        }

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser(user)
          // Check if enrolled
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user.id)
            .eq('course_id', slug)
            .single()
          
          setIsEnrolled(!!enrollment)
          if (enrollment) {
            setEnrollment(enrollment)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug, supabase])

  // ... rest of the component (handleEnroll, return JSX)
