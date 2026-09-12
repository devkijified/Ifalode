'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type LiveClassStatus =
  | 'scheduled'
  | 'live'
  | 'completed'
  | 'cancelled'

type LiveClass = {
  id: string
  title: string
  description: string | null
  instructor: string | null
  scheduled_at: string
  duration: number
  meeting_url: string | null
  recording_url: string | null
  status: LiveClassStatus
  is_published: boolean
}

type LiveClassForm = {
  title: string
  description: string
  instructor: string
  scheduled_at: string
  duration: string
  meeting_url: string
  recording_url: string
  status: LiveClassStatus
  is_published: boolean
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

function toDateTimeLocal(value: string) {
  const date = new Date(value)

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)

  return localDate.toISOString().slice(0, 16)
}

export default function EditLiveClassPage() {
  const params = useParams()
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const classId = params?.id as string

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<LiveClassForm | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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

  const fetchClass = useCallback(async () => {
    const { data, error: fetchError } = (await supabase
      .from('live_classes')
      .select('*')
      .eq('id', classId)
      .maybeSingle()) as {
      data: LiveClass | null
      error: { message: string } | null
    }

    if (fetchError || !data) {
      setError(fetchError?.message || 'Live class not found.')
      setLoading(false)
      return
    }

    setForm({
      title: data.title,
      description: data.description || '',
      instructor: data.instructor || '',
      scheduled_at: toDateTimeLocal(data.scheduled_at),
      duration: String(data.duration),
      meeting_url: data.meeting_url || '',
      recording_url: data.recording_url || '',
      status: data.status,
      is_published: data.is_published,
    })

    setLoading(false)
  }, [classId, supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchClass()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchClass])

  const updateForm = <K extends keyof LiveClassForm>(
    field: K,
    value: LiveClassForm[K],
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    )
  }

  const updateClass = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form) return

    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructor: form.instructor.trim() || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration: Number(form.duration) || 60,
      meeting_url: form.meeting_url.trim() || null,
      recording_url: form.recording_url.trim() || null,
      status: form.status,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await (
      supabase.from('live_classes') as any
    )
      .update(payload)
      .eq('id', classId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Live class updated successfully.')
    }

    setSaving(false)
  }

  if (status === 'checking') {
    return <LoadingScreen text="Checking administrator access..." />
  }

  if (status === 'denied') {
    return <DeniedScreen />
  }

  if (loading || !form) {
    return <LoadingScreen text="Loading live class..." />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex h-20 max-w-4xl items-center px-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin/lms/live-classes"
              className="text-sm text-slate-500 transition hover:text-white"
            >
              ← Live Classes
            </Link>

            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              Edit Live Class
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
            {message}
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <form
          onSubmit={updateClass}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Class title"
              required
              className="md:col-span-2"
            >
              <input
                value={form.title}
                onChange={(event) =>
                  updateForm('title', event.target.value)
                }
                className={inputClassName}
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
              />
            </FormField>

            <FormField label="Duration in minutes">
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(event) =>
                  updateForm('duration', event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField
              label="Date and time"
              required
              className="md:col-span-2"
            >
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(event) =>
                  updateForm('scheduled_at', event.target.value)
                }
                className={inputClassName}
                required
              />
            </FormField>

            <FormField label="Meeting URL">
              <input
                type="url"
                value={form.meeting_url}
                onChange={(event) =>
                  updateForm('meeting_url', event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Recording URL">
              <input
                type="url"
                value={form.recording_url}
                onChange={(event) =>
                  updateForm('recording_url', event.target.value)
                }
                className={inputClassName}
              />
            </FormField>

            <FormField label="Status">
              <select
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    'status',
                    event.target.value as LiveClassStatus,
                  )
                }
                className={inputClassName}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </FormField>

            <FormField label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                className={`${inputClassName} min-h-36 resize-y`}
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

              <span className="text-sm font-semibold">
                Publish this live class
              </span>
            </label>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <Link
              href="/admin/lms/live-classes"
              className="rounded-xl border border-slate-800 px-6 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Back
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
