'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

type Course = {
  id: string
  title: string
  description: string | null
  instructor: string | null
  price: number | null
  cover_image: string | null
  category: string | null
  level: CourseLevel | null
  is_published: boolean
  created_at: string
  updated_at: string
}

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

type AdminStatus = 'checking' | 'allowed' | 'denied'

const emptyForm: CourseForm = {
  title: '',
  description: '',
  instructor: 'Akinsoji Elebuibon',
  price: '0',
  cover_image: '',
  category: 'Ifá',
  level: 'beginner',
  is_published: false,
}

export default function AdminLmsPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return false
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Admin profile error:', profileError)
      setStatus('denied')
      return false
    }

    if (profile?.role !== 'admin') {
      setStatus('denied')
      return false
    }

    setStatus('allowed')
    return true
  }, [router, supabase])

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('Courses fetch error:', coursesError)
      setError(coursesError.message)
      setCourses([])
    } else {
      setCourses((data || []) as Course[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchCourses()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchCourses])

  const updateForm = <K extends keyof CourseForm>(
    field: K,
    value: CourseForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openCreateForm = () => {
    setEditingCourse(null)
    setForm(emptyForm)
    setMessage(null)
    setError(null)
  }

  const openEditForm = (course: Course) => {
    setEditingCourse(course)
    setForm({
      title: course.title || '',
      description: course.description || '',
      instructor: course.instructor || '',
      price: String(course.price ?? 0),
      cover_image: course.cover_image || '',
      category: course.category || '',
      level: course.level || 'beginner',
      is_published: course.is_published,
    })
    setMessage(null)
    setError(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const cancelEdit = () => {
    setEditingCourse(null)
    setForm(emptyForm)
    setMessage(null)
    setError(null)
  }

  const saveCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Course title is required.')
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructor: form.instructor.trim() || null,
      price: Number(form.price) || 0,
      cover_image: form.cover_image.trim() || null,
      category: form.category.trim() || null,
      level: form.level,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingCourse) {
        const { data, error: updateError } = await supabase
          .from('courses')
          .update(payload)
          .eq('id', editingCourse.id)
          .select('*')
          .single()

        if (updateError) throw updateError

        setCourses((current) =>
          current.map((course) =>
            course.id === editingCourse.id ? (data as Course) : course,
          ),
        )

        setMessage('Course updated successfully.')
      } else {
        const { data, error: insertError } = await supabase
          .from('courses')
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setCourses((current) => [data as Course, ...current])
        setMessage('Course created successfully.')
      }

      setEditingCourse(null)
      setForm(emptyForm)
    } catch (saveError: any) {
      console.error('Course save error:', saveError)
      setError(saveError?.message || 'Unable to save course.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (course: Course) => {
    setMessage(null)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('courses')
      .update({
        is_published: !course.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', course.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Publish update error:', updateError)
      setError(updateError.message)
      return
    }

    setCourses((current) =>
      current.map((item) =>
        item.id === course.id ? (data as Course) : item,
      ),
    )

    setMessage(
      data.is_published
        ? 'Course published successfully.'
        : 'Course moved to draft.',
    )
  }

  const deleteCourse = async (course: Course) => {
    const confirmed = window.confirm(
      `Delete "${course.title}"? This may also affect its modules, lessons, and enrollments.`,
    )

    if (!confirmed) return

    setDeletingId(course.id)
    setMessage(null)
    setError(null)

    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', course.id)

    if (deleteError) {
      console.error('Course delete error:', deleteError)
      setError(deleteError.message)
    } else {
      setCourses((current) =>
        current.filter((item) => item.id !== course.id),
      )
      setMessage('Course deleted successfully.')

      if (editingCourse?.id === course.id) {
        cancelEdit()
      }
    }

    setDeletingId(null)
  }

  if (status === 'checking') {
    return <LoadingScreen text="Checking administrator access..." />
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-5">🔒</p>
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-slate-500">
            You do not have permission to manage the LMS.
          </p>
          <Link
            href="/"
            className="inline-flex mt-6 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              LMS Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/courses"
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-slate-800 text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition"
            >
              View Courses
            </Link>

            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <span>+</span>
              New Course
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Course editor
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {editingCourse ? 'Edit course' : 'Create a course'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Add the course information learners will see before enrolling.
              </p>
            </div>

            {editingCourse && (
              <button
                onClick={cancelEdit}
                type="button"
                className="text-sm text-slate-500 hover:text-white transition"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={saveCourse} className="grid md:grid-cols-2 gap-5">
            <FormField label="Course title" required className="md:col-span-2">
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
                placeholder="0"
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

            <FormField label="Cover image URL" className="md:col-span-2">
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
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="Describe what learners will understand after completing this course."
              />
            </FormField>

            <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(event) =>
                  updateForm('is_published', event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-brand-primary"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-200">
                  Publish this course
                </span>
                <span className="block text-xs text-slate-500 mt-1">
                  Published courses are visible to learners.
                </span>
              </span>
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {saving
                  ? 'Saving...'
                  : editingCourse
                    ? 'Update Course'
                    : 'Create Course'}
              </button>

              {editingCourse && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 rounded-xl border border-slate-800 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Your LMS
              </p>
              <h2 className="mt-2 text-2xl font-bold">Courses</h2>
            </div>

            <span className="text-sm text-slate-500">
              {courses.length} course{courses.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-4xl mb-4">📚</p>
              <h3 className="text-lg font-bold">No courses yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Create your first Ifá course above.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  deleting={deletingId === course.id}
                  onEdit={() => openEditForm(course)}
                  onDelete={() => deleteCourse(course)}
                  onTogglePublished={() => togglePublished(course)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

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
        {required && <span className="ml-1 text-brand-primary">*</span>}
      </span>
      {children}
    </label>
  )
}

function CourseCard({
  course,
  deleting,
  onEdit,
  onDelete,
  onTogglePublished,
}: {
  course: Course
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePublished: () => void
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-primary/20 via-slate-900 to-slate-950">
        {course.cover_image ? (
          <img
            src={course.cover_image}
            alt={course.title}
            className="h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            📖
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />

        <div className="absolute bottom-4 left-5 flex items-center gap-2">
          <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
            {course.category || 'Ifá'}
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
              course.is_published
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            }`}
          >
            {course.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{course.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {course.level || 'beginner'} ·{' '}
              {course.price && course.price > 0
                ? `$${course.price}`
                : 'Free'}
            </p>
          </div>

          <span className="text-xs text-slate-600">
            {course.instructor || 'No instructor'}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {course.description || 'No description provided.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          <Link
            href={`/courses/${course.id}`}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            View
          </Link>

          <Link
            href={`/admin/lms/${course.id}`}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Modules & Lessons
          </Link>

          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Edit
          </button>

          <button
            onClick={onTogglePublished}
            className="rounded-lg border border-brand-primary/20 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
          >
            {course.is_published ? 'Unpublish' : 'Publish'}
          </button>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  )
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  )
}
