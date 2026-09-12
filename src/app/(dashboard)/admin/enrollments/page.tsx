'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type Enrollment = {
  id: string
  user_id: string
  course_id: string
  progress: number
  completed: boolean
  enrolled_at: string
  profiles: {
    email: string
    full_name: string | null
  } | null
  courses: {
    title: string
    slug: string
  } | null
}

type SimpleProfile = {
  id: string
  email: string
  full_name: string | null
}

type SimpleCourse = {
  id: string
  title: string
}

type CompletionFilter = 'all' | 'completed' | 'in_progress'

const ENROLLMENT_SELECT =
  '*, profiles:user_id(email, full_name), courses:course_id(title, slug)'

export default function AdminEnrollmentsPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [profiles, setProfiles] = useState<SimpleProfile[]>([])
  const [courses, setCourses] = useState<SimpleCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>('all')

  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [enrollmentsRes, profilesRes, coursesRes] = await Promise.all([
      supabase
        .from('enrollments')
        .select(ENROLLMENT_SELECT)
        .order('enrolled_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email', { ascending: true }),
      supabase
        .from('courses')
        .select('id, title')
        .order('title', { ascending: true }),
    ])

    if (enrollmentsRes.error) {
      console.error('Enrollments fetch error:', enrollmentsRes.error.message)
      setError(enrollmentsRes.error.message)
      setEnrollments([])
    } else {
      setEnrollments((enrollmentsRes.data as unknown as Enrollment[]) || [])
    }

    if (!profilesRes.error) {
      setProfiles((profilesRes.data as SimpleProfile[]) || [])
    }

    if (!coursesRes.error) {
      setCourses((coursesRes.data as SimpleCourse[]) || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchData()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchData])

  const createEnrollment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!selectedUserId || !selectedCourseId) {
      setError('Choose both a user and a course.')
      return
    }

    const alreadyEnrolled = enrollments.some(
      (item) =>
        item.user_id === selectedUserId &&
        item.course_id === selectedCourseId,
    )

    if (alreadyEnrolled) {
      setError('This user is already enrolled in that course.')
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    const { data, error: insertError } = await (
      supabase.from('enrollments') as any
    )
      .insert({
        user_id: selectedUserId,
        course_id: selectedCourseId,
        progress: 0,
        completed: false,
      })
      .select(ENROLLMENT_SELECT)
      .single()

    if (insertError) {
      console.error('Enrollment create error:', insertError)
      setError(insertError.message)
    } else {
      setEnrollments((current) => [data as unknown as Enrollment, ...current])
      setMessage('User enrolled successfully.')
      setSelectedUserId('')
      setSelectedCourseId('')
    }

    setSaving(false)
  }

  const updateProgress = async (enrollment: Enrollment, progress: number) => {
    const clamped = Math.min(100, Math.max(0, progress))

    setUpdatingId(enrollment.id)
    setMessage(null)
    setError(null)

    const { data, error: updateError } = await (
      supabase.from('enrollments') as any
    )
      .update({
        progress: clamped,
        completed: clamped >= 100,
      })
      .eq('id', enrollment.id)
      .select(ENROLLMENT_SELECT)
      .single()

    if (updateError) {
      console.error('Progress update error:', updateError)
      setError(updateError.message)
    } else {
      setEnrollments((current) =>
        current.map((item) =>
          item.id === enrollment.id ? (data as unknown as Enrollment) : item,
        ),
      )
    }

    setUpdatingId(null)
  }

  const toggleCompleted = async (enrollment: Enrollment) => {
    const nextCompleted = !enrollment.completed

    setUpdatingId(enrollment.id)
    setMessage(null)
    setError(null)

    const { data, error: updateError } = await (
      supabase.from('enrollments') as any
    )
      .update({
        completed: nextCompleted,
        progress: nextCompleted ? 100 : enrollment.progress,
      })
      .eq('id', enrollment.id)
      .select(ENROLLMENT_SELECT)
      .single()

    if (updateError) {
      console.error('Completion update error:', updateError)
      setError(updateError.message)
    } else {
      setEnrollments((current) =>
        current.map((item) =>
          item.id === enrollment.id ? (data as unknown as Enrollment) : item,
        ),
      )
    }

    setUpdatingId(null)
  }

  const deleteEnrollment = async (enrollment: Enrollment) => {
    const confirmed = window.confirm(
      `Remove ${enrollment.profiles?.email || 'this user'} from "${
        enrollment.courses?.title || 'this course'
      }"?`,
    )

    if (!confirmed) return

    setDeletingId(enrollment.id)
    setMessage(null)
    setError(null)

    const { error: deleteError } = await (
      supabase.from('enrollments') as any
    )
      .delete()
      .eq('id', enrollment.id)

    if (deleteError) {
      console.error('Enrollment delete error:', deleteError)
      setError(deleteError.message)
    } else {
      setEnrollments((current) =>
        current.filter((item) => item.id !== enrollment.id),
      )
      setMessage('Enrollment removed.')
    }

    setDeletingId(null)
  }

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return enrollments.filter((item) => {
      const matchesSearch =
        !query ||
        item.profiles?.email?.toLowerCase().includes(query) ||
        (item.profiles?.full_name || '').toLowerCase().includes(query) ||
        (item.courses?.title || '').toLowerCase().includes(query)

      const matchesCourse =
        courseFilter === 'all' || item.course_id === courseFilter

      const matchesCompletion =
        completionFilter === 'all' ||
        (completionFilter === 'completed' && item.completed) ||
        (completionFilter === 'in_progress' && !item.completed)

      return matchesSearch && matchesCourse && matchesCompletion
    })
  }, [enrollments, search, courseFilter, completionFilter])

  const completedCount = useMemo(
    () => enrollments.filter((item) => item.completed).length,
    [enrollments],
  )

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
            You do not have permission to manage enrollments.
          </p>

          <Link
            href="/admin"
            className="inline-flex mt-6 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Back to admin
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
              Enrollments
            </h1>
          </div>

          <span className="hidden sm:inline-flex text-sm text-slate-500">
            {enrollments.length} enrollment
            {enrollments.length === 1 ? '' : 's'} · {completedCount} completed
          </span>
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
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
              Manual enrollment
            </p>

            <h2 className="mt-2 text-2xl font-bold">Enroll a user</h2>

            <p className="mt-2 text-sm text-slate-500">
              Add a user to a course directly, bypassing checkout.
            </p>
          </div>

          <form
            onSubmit={createEnrollment}
            className="grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
          >
            <FormField label="User">
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className={selectClassName}
              >
                <option value="">Select a user...</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name
                      ? `${profile.full_name} (${profile.email})`
                      : profile.email}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Course">
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className={selectClassName}
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </FormField>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition h-[46px]"
            >
              {saving ? 'Enrolling...' : 'Enroll User'}
            </button>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user or course..."
              className="w-full sm:max-w-sm rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
            />

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 outline-none focus:border-brand-primary/50"
            >
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              {(
                [
                  { value: 'all', label: 'All' },
                  { value: 'in_progress', label: 'In progress' },
                  { value: 'completed', label: 'Completed' },
                ] as { value: CompletionFilter; label: string }[]
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCompletionFilter(option.value)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                    completionFilter === option.value
                      ? 'bg-brand-primary text-white'
                      : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              Loading enrollments...
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-4xl mb-4">🎓</p>
              <h3 className="text-lg font-bold">No enrollments found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search or filter, or enroll a user above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    <th className="px-4 py-3 font-semibold">Progress</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Enrolled</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-200">
                          {enrollment.profiles?.full_name ||
                            enrollment.profiles?.email ||
                            'Unknown user'}
                        </div>

                        {enrollment.profiles?.full_name && (
                          <div className="text-xs text-slate-500">
                            {enrollment.profiles.email}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {enrollment.courses?.title || 'Unknown course'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={enrollment.progress}
                            disabled={updatingId === enrollment.id}
                            onChange={(event) =>
                              updateProgress(
                                enrollment,
                                Number(event.target.value),
                              )
                            }
                            className="w-16 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-brand-primary/50"
                          />
                          <span className="text-xs text-slate-500">%</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCompleted(enrollment)}
                          disabled={updatingId === enrollment.id}
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
                            enrollment.completed
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-slate-700 bg-slate-950 text-slate-400'
                          }`}
                        >
                          {enrollment.completed ? 'Completed' : 'In progress'}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteEnrollment(enrollment)}
                          disabled={deletingId === enrollment.id}
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingId === enrollment.id
                            ? 'Removing...'
                            : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

const selectClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
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
