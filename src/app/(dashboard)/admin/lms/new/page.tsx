'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

type CourseForm = {
  title: string
  description: string
  instructor: string
  price: string
  cover_image: string
  category: string
  level: CourseLevel
  is_published: boolean
}

const initialForm: CourseForm = {
  title: '',
  description: '',
  instructor: 'Akinsoji Elebuibon',
  price: '0',
  cover_image: '',
  category: 'Ifá',
  level: 'beginner',
  is_published: false,
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewCoursePage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [form, setForm] = useState<CourseForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: profileData, error: profileError } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()) as {
      data: { role: string | null } | null
      error: { message: string } | null
    }

    if (profileError || profileData?.role !== 'admin') {
      setStatus('denied')
      return
    }

    setStatus('allowed')
  }, [router, supabase])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const updateForm = <K extends keyof CourseForm>(
    field: K,
    value: CourseForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const createCourse = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Course title is required.')
      return
    }

    const slug = createSlug(form.title)

    if (!slug) {
      setError('Please enter a valid course title.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      slug,
      description: form.description.trim() || null,
      instructor: form.instructor.trim() || null,
      price: Number(form.price) || 0,
      cover_image: form.cover_image.trim() || null,
      category: form.category.trim() || null,
      level: form.level,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    const { data, error: insertError } = await (
      supabase.from('courses') as any
    )
      .insert(payload)
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/admin/lms/${data.id}`)
  }

  if (status === 'checking') {
    return <LoadingScreen text="Checking administrator access..." />
  }

  if (status === 'denied') {
    return <DeniedScreen />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin/lms"
              className="text-sm text-slate-500 transition hover:text-white"
            >
              ← LMS Management
            </Link>

            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              Create New Course
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <ErrorMessage message={error} />}

        <form
          onSubmit={createCourse}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Course title"
              required
              className="md:col-span-2"
            >
              <input
                value={form.title}
                onChange={(event) =>
                  updateForm('title', event.target.value)
                }
                className={inputClassName}
                placeholder="Introduction to Ifá"
                required
              />
            </FormField>

            <FormField label="Instructor">
              <input
                value={form.instructor}
                onChange={(event) =>
                  updateForm('instructor', event.target.value)
                }
                className={inputClassName}
                placeholder="Akinsoji Elebuibon"
              />
            </FormField>

            <FormField label="Category">
              <input
                value={form.category}
                onChange={(event) =>
                  updateForm('category', event.target.value)
                }
                className={inputClassName}
                placeholder="Ifá"
              />
            </FormField>

            <FormField label="Price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  updateForm('price', event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Level">
              <select
                value={form.level}
                onChange={(event) =>
                  updateForm(
                    'level',
                    event.target.value as CourseLevel,
                  )
                }
                className={inputClassName}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </FormField>

            <FormField
              label="Cover image URL"
              className="md:col-span-2"
            >
              <input
                value={form.cover_image}
                onChange={(event) =>
                  updateForm('cover_image', event.target.value)
                }
                className={inputClassName}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                className={`${inputClassName} min-h-36 resize-y`}
                placeholder="Describe what learners will learn..."
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  updateForm('is_published', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-brand-primary"
              />

              <span>
                <span className="block text-sm font-semibold">
                  Publish course
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Published courses are visible to learners.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating...' : 'Create Course'}
            </button>

            <Link
              href="/admin/lms"
              className="rounded-xl border border-slate-800 px-6 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

function FormField({
  label,
  required = false,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && (
          <span className="ml-1 text-brand-primary">*</span>
        )}
      </span>

      {children}
    </label>
  )
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  )
}

function DeniedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="text-center">
        <p className="mb-5 text-5xl">🔒</p>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-slate-500">
          You do not have permission to manage the LMS.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
        >
          Back to admin
        </Link>
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}
