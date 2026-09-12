'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string
  title: string
  slug: string
}

type Module = {
  id: string
  course_id: string | null
  title: string
  description: string | null
  order_number: number
  created_at: string
  updated_at: string
}

type Lesson = {
  id: string
  course_id: string | null
  module_id: string | null
  title: string
  content: string | null
  video_url: string | null
  order_number: number | null
  duration: number | null
  created_at: string
}

type ModuleForm = {
  title: string
  description: string
  order_number: string
}

type LessonForm = {
  title: string
  content: string
  video_url: string
  order_number: string
  duration: string
  module_id: string
}

type AdminStatus = 'checking' | 'allowed' | 'denied'

const moduleInitial: ModuleForm = {
  title: '',
  description: '',
  order_number: '1',
}

const lessonInitial: LessonForm = {
  title: '',
  content: '',
  video_url: '',
  order_number: '1',
  duration: '0',
  module_id: '',
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

export default function AdminCourseContentPage() {
  const params = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const courseId = params?.courseId as string

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [savingModule, setSavingModule] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [moduleForm, setModuleForm] = useState<ModuleForm>(moduleInitial)
  const [lessonForm, setLessonForm] = useState<LessonForm>(lessonInitial)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
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
      return false
    }

    setStatus('allowed')
    return true
  }, [router, supabase])

  const fetchContent = useCallback(async () => {
    if (!courseId) return

    setLoading(true)
    setError(null)

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('id', courseId)
      .maybeSingle()

    if (courseError || !courseData) {
      setError(courseError?.message || 'Course not found.')
      setLoading(false)
      return
    }

    const { data: modulesData, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number', { ascending: true })

    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number', { ascending: true })

    if (modulesError) {
      setError(modulesError.message)
    } else if (lessonsError) {
      setError(lessonsError.message)
    } else {
      setCourse(courseData as Course)
      setModules((modulesData || []) as Module[])
      setLessons((lessonsData || []) as Lesson[])
    }

    setLoading(false)
  }, [courseId, supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchContent()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchContent])

  const saveModule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!moduleForm.title.trim()) {
      setError('Module title is required.')
      return
    }

    setSavingModule(true)
    setMessage(null)
    setError(null)

    const payload = {
      course_id: courseId,
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim() || null,
      order_number: Number(moduleForm.order_number) || 1,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingModuleId) {
        const { data, error: updateError } = await supabase
          .from('modules')
          .update(payload)
          .eq('id', editingModuleId)
          .select('*')
          .single()

        if (updateError) throw updateError

        setModules((current) =>
          current
            .map((item) =>
              item.id === editingModuleId ? (data as Module) : item,
            )
            .sort((a, b) => a.order_number - b.order_number),
        )

        setMessage('Module updated successfully.')
      } else {
        const { data, error: insertError } = await supabase
          .from('modules')
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setModules((current) =>
          [...current, data as Module].sort(
            (a, b) => a.order_number - b.order_number,
          ),
        )

        setMessage('Module created successfully.')
      }

      setModuleForm(moduleInitial)
      setEditingModuleId(null)
    } catch (saveError: any) {
      console.error('Module save error:', saveError)
      setError(saveError?.message || 'Unable to save module.')
    } finally {
      setSavingModule(false)
    }
  }

  const saveLesson = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!lessonForm.title.trim()) {
      setError('Lesson title is required.')
      return
    }

    if (!lessonForm.module_id) {
      setError('Please select a module for this lesson.')
      return
    }

    setSavingLesson(true)
    setMessage(null)
    setError(null)

    const payload = {
      course_id: courseId,
      module_id: lessonForm.module_id,
      title: lessonForm.title.trim(),
      content: lessonForm.content.trim() || null,
      video_url: lessonForm.video_url.trim() || null,
      order_number: Number(lessonForm.order_number) || 1,
      duration: Number(lessonForm.duration) || 0,
    }

    try {
      if (editingLessonId) {
        const { data, error: updateError } = await supabase
          .from('lessons')
          .update(payload)
          .eq('id', editingLessonId)
          .select('*')
          .single()

        if (updateError) throw updateError

        setLessons((current) =>
          current
            .map((item) =>
              item.id === editingLessonId ? (data as Lesson) : item,
            )
            .sort((a, b) => (a.order_number || 0) - (b.order_number || 0)),
        )

        setMessage('Lesson updated successfully.')
      } else {
        const { data, error: insertError } = await supabase
          .from('lessons')
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setLessons((current) =>
          [...current, data as Lesson].sort(
            (a, b) => (a.order_number || 0) - (b.order_number || 0),
          ),
        )

        setMessage('Lesson created successfully.')
      }

      setLessonForm(lessonInitial)
      setEditingLessonId(null)
    } catch (saveError: any) {
      console.error('Lesson save error:', saveError)
      setError(saveError?.message || 'Unable to save lesson.')
    } finally {
      setSavingLesson(false)
    }
  }

  const editModule = (module: Module) => {
    setEditingModuleId(module.id)
    setModuleForm({
      title: module.title,
      description: module.description || '',
      order_number: String(module.order_number),
    })
    setError(null)
    setMessage(null)
  }

  const editLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      order_number: String(lesson.order_number || 1),
      duration: String(lesson.duration || 0),
      module_id: lesson.module_id || '',
    })
    setError(null)
    setMessage(null)
  }

  const deleteModule = async (module: Module) => {
    const confirmed = window.confirm(
      `Delete "${module.title}" and its lessons?`,
    )

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', module.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setModules((current) => current.filter((item) => item.id !== module.id))
    setLessons((current) =>
      current.filter((item) => item.module_id !== module.id),
    )
    setMessage('Module deleted successfully.')
  }

  const deleteLesson = async (lesson: Lesson) => {
    const confirmed = window.confirm(`Delete "${lesson.title}"?`)

    if (!confirmed) return

    const { error: deleteError } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lesson.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setLessons((current) =>
      current.filter((item) => item.id !== lesson.id),
    )
    setMessage('Lesson deleted successfully.')
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
          <Link
            href="/admin"
            className="inline-flex mt-6 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold"
          >
            Back to admin
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !course) {
    return <LoadingScreen text="Loading course content..." />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin/lms"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← LMS Management
            </Link>
            <h1 className="mt-1 text-xl sm:text-2xl font-black">
              {course.title}
            </h1>
          </div>

          <Link
            href={`/courses/${course.slug}`}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition"
          >
            View Course
          </Link>
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

        <div className="grid xl:grid-cols-2 gap-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
              Modules
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {editingModuleId ? 'Edit module' : 'Add module'}
            </h2>

            <form onSubmit={saveModule} className="mt-5 space-y-4">
              <input
                value={moduleForm.title}
                onChange={(event) =>
                  setModuleForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="Foundations of Ifá"
                required
              />

              <textarea
                value={moduleForm.description}
                onChange={(event) =>
                  setModuleForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className={`${inputClassName} min-h-24 resize-y`}
                placeholder="Module description"
              />

              <input
                type="number"
                min="1"
                value={moduleForm.order_number}
                onChange={(event) =>
                  setModuleForm((current) => ({
                    ...current,
                    order_number: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="Order number"
                required
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingModule}
                  className="px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingModule
                    ? 'Saving...'
                    : editingModuleId
                      ? 'Update Module'
                      : 'Add Module'}
                </button>

                {editingModuleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModuleId(null)
                      setModuleForm(moduleInitial)
                    }}
                    className="px-5 py-3 rounded-xl border border-slate-800 text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-brand-primary">
                        Module {module.order_number}
                      </p>
                      <h3 className="mt-1 font-bold">{module.title}</h3>
                      {module.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          {module.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => editModule(module)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteModule(module)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600">
                    {
                      lessons.filter(
                        (lesson) => lesson.module_id === module.id,
                      ).length
                    }{' '}
                    lesson(s)
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
              Lessons
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {editingLessonId ? 'Edit lesson' : 'Add lesson'}
            </h2>

            <form onSubmit={saveLesson} className="mt-5 space-y-4">
              <select
                value={lessonForm.module_id}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    module_id: event.target.value,
                  }))
                }
                className={inputClassName}
                required
              >
                <option value="">Select module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    Module {module.order_number}: {module.title}
                  </option>
                ))}
              </select>

              <input
                value={lessonForm.title}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="What is Ifá?"
                required
              />

              <textarea
                value={lessonForm.content}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="Lesson content"
              />

              <input
                value={lessonForm.video_url}
                onChange={(event) =>
                  setLessonForm((current) => ({
                    ...current,
                    video_url: event.target.value,
                  }))
                }
                className={inputClassName}
                placeholder="Video URL"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  min="1"
                  value={lessonForm.order_number}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      order_number: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Order"
                  required
                />

                <input
                  type="number"
                  min="0"
                  value={lessonForm.duration}
                  onChange={(event) =>
                    setLessonForm((current) => ({
                      ...current,
                      duration: event.target.value,
                    }))
                  }
                  className={inputClassName}
                  placeholder="Minutes"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingLesson || modules.length === 0}
                  className="px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold disabled:opacity-60"
                >
                  {savingLesson
                    ? 'Saving...'
                    : editingLessonId
                      ? 'Update Lesson'
                      : 'Add Lesson'}
                </button>

                {editingLessonId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLessonId(null)
                      setLessonForm(lessonInitial)
                    }}
                    className="px-5 py-3 rounded-xl border border-slate-800 text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="mt-8 space-y-3">
              {modules.map((module) => {
                const moduleLessons = lessons
                  .filter((lesson) => lesson.module_id === module.id)
                  .sort(
                    (a, b) =>
                      (a.order_number || 0) - (b.order_number || 0),
                  )

                return (
                  <div key={module.id}>
                    <h3 className="mb-2 text-sm font-bold text-brand-primary">
                      Module {module.order_number}: {module.title}
                    </h3>

                    {moduleLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div>
                          <p className="text-xs text-slate-600">
                            Lesson {lesson.order_number}
                          </p>
                          <p className="font-semibold">{lesson.title}</p>
                          <p className="text-xs text-slate-500">
                            {lesson.duration || 0} minutes
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => editLesson(lesson)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLesson(lesson)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
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
