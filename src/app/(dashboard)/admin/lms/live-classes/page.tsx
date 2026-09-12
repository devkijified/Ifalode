'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  created_at: string
  updated_at: string
}

export default function AdminLiveClassesPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = (await supabase
      .from('live_classes')
      .select('*')
      .order('scheduled_at', { ascending: true })) as {
      data: LiveClass[] | null
      error: { message: string } | null
    }

    if (fetchError) {
      setError(fetchError.message)
      setClasses([])
    } else {
      setClasses(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchClasses()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchClasses])

  const togglePublished = async (liveClass: LiveClass) => {
    const { data, error: updateError } = await (
      supabase.from('live_classes') as any
    )
      .update({
        is_published: !liveClass.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', liveClass.id)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setClasses((current) =>
      current.map((item) =>
        item.id === liveClass.id ? (data as LiveClass) : item,
      ),
    )

    setMessage(
      data.is_published
        ? 'Live class published.'
        : 'Live class unpublished.',
    )
  }

  const deleteClass = async (liveClass: LiveClass) => {
    const confirmed = window.confirm(
      `Delete "${liveClass.title}"?`,
    )

    if (!confirmed) return

    const { error: deleteError } = await (
      supabase.from('live_classes') as any
    )
      .delete()
      .eq('id', liveClass.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setClasses((current) =>
      current.filter((item) => item.id !== liveClass.id),
    )

    setMessage('Live class deleted.')
  }

  if (status === 'checking') {
    return <LoadingScreen text="Checking administrator access..." />
  }

  if (status === 'denied') {
    return <DeniedScreen />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 transition hover:text-white"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-1 text-xl font-black sm:text-2xl">
              Live Classes
            </h1>
          </div>

          <Link
            href="/admin/lms/live-classes/new"
            className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Schedule Class
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
            {message}
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
            Loading live classes...
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
            <p className="mb-4 text-5xl">🎥</p>
            <h2 className="text-xl font-bold">No live classes yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Schedule your first live teaching session.
            </p>

            <Link
              href="/admin/lms/live-classes/new"
              className="mt-6 inline-flex rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Schedule Live Class
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {classes.map((liveClass) => (
              <LiveClassCard
                key={liveClass.id}
                liveClass={liveClass}
                onPublish={() => togglePublished(liveClass)}
                onDelete={() => deleteClass(liveClass)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function LiveClassCard({
  liveClass,
  onPublish,
  onDelete,
}: {
  liveClass: LiveClass
  onPublish: () => void
  onDelete: () => void
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[.15em] text-brand-primary">
            {liveClass.status}
          </span>

          <h2 className="mt-2 text-xl font-bold">
            {liveClass.title}
          </h2>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
            liveClass.is_published
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          }`}
        >
          {liveClass.is_published ? 'Published' : 'Draft'}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        {liveClass.description || 'No description provided.'}
      </p>

      <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-400">
        <p>
          📅{' '}
          {new Date(liveClass.scheduled_at).toLocaleString()}
        </p>

        <p>⏱️ {liveClass.duration} minutes</p>

        {liveClass.instructor && (
          <p>👤 {liveClass.instructor}</p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/admin/lms/live-classes/${liveClass.id}`}
          className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          Edit
        </Link>

        <button
          onClick={onPublish}
          className="rounded-lg border border-brand-primary/20 px-3 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary/10"
        >
          {liveClass.is_published ? 'Unpublish' : 'Publish'}
        </button>

        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </article>
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
