'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { LiveClass } from '@/types/live-class'

interface LiveClassFormProps {
  initialData?: LiveClass
}

export function LiveClassForm({ initialData }: LiveClassFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    course_id: initialData?.course_id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    scheduled_at: initialData?.scheduled_at
      ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
      : '',
    duration_min
