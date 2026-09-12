'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'
import { LiveClassRoom } from '@/components/live-class/LiveClassRoom'

interface Recording {
  id: string
  live_class_id: string
  storage_url: string | null
  signed_url?: string
  duration_seconds: number | null
  status: 'processing' | 'ready' | 'failed'
  created_at: string
  processed_at: string | null
}

export default function StudentLiveClassPage() {
  const params = useParams()
  const router = useRouter()
  const liveClassId = params?.id as string

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null)
  const [recording, setRecording] = useState<Recording | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!liveClassId) return

    const load = async () => {
      try {
        const [classRes, recordingRes] = await Promise.all([
          fetch(`/api/live-classes/${liveClassId}`),
          fetch(`/api/live-classes/${liveClassId}/recording`),
        ])

        if (!classRes.ok) throw new Error('Class not found')
        const classData = await classRes.json()
        setLiveClass(classData.liveClass)

        if (recordingRes.ok) {
          const recData = await recordingRes.json()
          setRecording(recData.recording)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [liveClassId])

  const handleRegister = async () => {
    setJoining(true)
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}/register`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration failed')
      }
      alert('✅ Registered! You will be able to join when the class starts.')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setJoining(false)
    }
  }

  const timeUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now()
    if (diff <= 0) return 'Starting now'
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    if (hours > 24) return `In ${Math.floor(hours / 24)} days`
    if (hours > 0) return `In ${hours}h ${mins}m`
    return `In ${mins}m`
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading class...</p>
        </div>
      </div>
    )
  }

  if (error || !liveClass) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Not Found</h1>
          <p className="text-slate-400 mb-6">{error || 'Class not found'}</p>
          <Link href="/live-classes" className="text-brand-primary hover:underline">
            ← Back to Live Classes
          </Link>
        </div>
      </div>
    )
  }

  // If LIVE → join classroom directly
  if (liveClass.status === 'LIVE') {
    return (
      <LiveClassRoom
        liveClassId={liveClass.id}
        liveClassTitle={liveClass.title}
        isTeacher={false}
      />
    )
  }

  const isEnded = ['ENDED', 'COMPLETED', 'PROCESSING_RECORDING'].includes(
    liveClass.status
  )
  const hasReplay = isEnded && recording && recording.status === 'ready' && recording.signed_url

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/live-classes"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-6"
        >
          ← Back to Live Classes
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          {/* Status badge */}
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border mb-3 ${
              liveClass.status === 'LIVE'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : isEnded
                ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
            }`}
          >
            {liveClass.status === 'LIVE'
              ? '● LIVE NOW'
              : isEnded
              ? 'ENDED'
              : 'UPCOMING'}
          </span>

          <h1 className="text-3xl font-bold text-white mb-3">{liveClass.title}</h1>

          {liveClass.description && (
            <p className="text-slate-400 mb-6">{liveClass.description}</p>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <InfoTile
              label="Date"
              value={new Date(liveClass.scheduled_at).toLocaleDateString()}
            />
            <InfoTile
              label="Time"
              value={new Date(liveClass.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            />
            <InfoTile
              label="Duration"
              value={`${liveClass.duration_minutes} min`}
            />
            <InfoTile
              label="Seats"
              value={`${liveClass.max_participants}`}
            />
          </div>

          {/* Countdown for upcoming */}
          {liveClass.status === 'SCHEDULED' && (
            <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 p-5 mb-6 text-center">
              <p className="text-sm text-brand-primary font-semibold mb-1">
                Starts {timeUntil(liveClass.scheduled_at)}
              </p>
              <p className="text-xs text-slate-400">
                You'll be able to join when the class goes live
              </p>
            </div>
          )}

          {/* Replay block */}
          {hasReplay && (
            <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center text-2xl">
                  🎬
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-primary">
                    Replay Available
                  </p>
                  <p className="text-xs text-slate-400">
                    {recording?.duration_seconds
                      ? formatDuration(recording.duration_seconds)
                      : 'Recorded session'}
                  </p>
                </div>
              </div>
              <a
                href={recording!.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 bg-brand-primary text-white rounded-xl font-semibold hover:opacity-90 transition"
              >
                ▶ Watch Replay
              </a>
            </div>
          )}

          {isEnded && !hasReplay && (
            <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-5 mb-6 text-center">
              <p className="text-sm text-slate-400">
                {recording?.status === 'processing'
                  ? '⏳ Recording is being processed...'
                  : 'No replay available for this class'}
              </p>
            </div>
          )}

          {/* Price + Register */}
          {liveClass.status === 'SCHEDULED' && (
            <>
              {liveClass.price && liveClass.price > 0 ? (
                <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30 mb-4">
                  <p className="text-sm text-slate-300">Price</p>
                  <p className="text-2xl font-bold text-green-400">
                    ₦{liveClass.price.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 mb-4">
                  <p className="text-sm text-brand-primary font-semibold">
                    Free Class
                  </p>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={joining}
                className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {joining ? 'Registering...' : 'Register for Class'}
              </button>
            </>
          )}

          {/* LIVE CTA (if user landed here while live) */}
          {liveClass.status === 'LIVE' && (
            <Link
              href={`/live-classes/${liveClass.id}/room`}
              className="block w-full text-center py-3.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
            >
              ● Join Live Class
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
