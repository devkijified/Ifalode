'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'
import { LiveClassRoom } from '@/components/live-class/LiveClassRoom'
import { formatDateTime, formatDuration, timeUntil } from '@/lib/format'
import { HelpTip, LiveBadge, Price, Skeleton } from '@/components/ui/primitives'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'

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
  const [enteredRoom, setEnteredRoom] = useState(false)
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
      alert('Registered. You will be able to join when the class starts.')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setJoining(false)
    }
  }

  const formatRecordingDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-ink-950 text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-8 sm:px-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-6 h-56 w-full" />
          <Skeleton className="mt-4 h-24 w-full" />
          <Skeleton className="mt-4 h-14 w-full" />
        </main>
      </div>
    )
  }

  if (error || !liveClass) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-cream/10 bg-ink-850 p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-live/15 text-live">
            <Icon name="warning" size={24} variant="Bold" />
          </div>
          <h1 className="font-display text-headline text-cream">Not found</h1>
          <p className="mt-2 text-body text-cream-dim">
            {error || 'Class not found'}
          </p>
          <Link
            href="/live-classes"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
          >
            Back to live classes
          </Link>
        </div>
      </div>
    )
  }

  // Student tapped Join on the lobby: enter the room. The lobby comes
  // first so joining a live class is always one clear, deliberate tap.
  if (liveClass.status === 'LIVE' && enteredRoom) {
    return (
      <LiveClassRoom
        liveClassId={liveClass.id}
        liveClassTitle={liveClass.title}
        isTeacher={false}
      />
    )
  }

  const isLive = liveClass.status === 'LIVE'
  const isEnded = ['ENDED', 'COMPLETED', 'PROCESSING_RECORDING'].includes(
    liveClass.status
  )
  const isCancelled = liveClass.status === 'CANCELLED'
  const hasReplay =
    isEnded && recording && recording.status === 'ready' && recording.signed_url

  return (
    <div className="min-h-[100dvh] bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.push('/live-classes')}
          className="inline-flex min-h-[40px] items-center gap-2 text-body font-medium text-cream-dim transition hover:text-cream"
        >
          <Icon name="back" size={18} />
          Back to live classes
        </button>

        {/* Cinematic lobby header */}
        <section className="mt-4 overflow-hidden rounded-3xl border border-cream/10 bg-ink-850 shadow-card">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {isLive ? (
                <LiveBadge />
              ) : (
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-1 text-meta font-bold uppercase tracking-wider ${
                    isEnded || isCancelled
                      ? 'border-cream/15 bg-cream/5 text-cream-faint'
                      : 'border-gold/30 bg-gold/10 text-gold'
                  }`}
                >
                  {isCancelled
                    ? 'Cancelled'
                    : isEnded
                      ? 'Ended'
                      : timeUntil(liveClass.scheduled_at)}
                </span>
              )}
              {liveClass.recording_enabled && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-cream/15 bg-cream/5 px-2 py-1 text-meta font-bold uppercase tracking-wider text-cream-dim">
                  <Icon name="record" size={12} />
                  Recorded
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-display tracking-tight text-cream">
              {liveClass.title}
            </h1>

            {liveClass.instructor && (
              <p className="mt-3 inline-flex items-center gap-2 text-body text-cream-dim">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Icon name="teacher" size={18} variant="Bold" />
                </span>
                <span>
                  Taught by{' '}
                  <span className="font-semibold text-cream">
                    {liveClass.instructor}
                  </span>
                </span>
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <InfoTile
                icon="calendar"
                label="Starts"
                value={formatDateTime(liveClass.scheduled_at)}
              />
              <InfoTile
                icon="clock"
                label="Duration"
                value={
                  liveClass.duration_minutes
                    ? formatDuration(liveClass.duration_minutes)
                    : 'Live session'
                }
              />
              <InfoTile
                icon="people"
                label="Seats"
                value={
                  liveClass.max_participants
                    ? `${liveClass.max_participants} students`
                    : 'Open to all'
                }
              />
              <div className="rounded-2xl border border-cream/10 bg-ink-800 p-4">
                <p className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-wider text-cream-faint">
                  Price
                  {liveClass.price != null && liveClass.price > 0 && (
                    <HelpTip text="This is the full price for this class, with nothing extra to pay inside the room. It covers your seat, the class chat, and the replay if the class is recorded." />
                  )}
                </p>
                <p className="mt-1.5">
                  {liveClass.price != null ? (
                    <Price
                      amount={liveClass.price}
                      className={`text-title ${liveClass.price === 0 ? 'text-success' : 'text-cream'}`}
                    />
                  ) : (
                    <span className="font-display text-title text-cream">Free</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Primary action zone. The main action is always pinned here in
              the header, never at the end of a scroll row. */}
          <div className="border-t border-cream/10 bg-ink-900 px-6 py-5 sm:px-8">
            {isLive && (
              <div>
                <button
                  type="button"
                  onClick={() => setEnteredRoom(true)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-live px-6 font-display text-lead text-white transition hover:opacity-90"
                >
                  <Icon name="play" size={20} variant="Bold" />
                  Join live class
                </button>
                <p className="mt-3 text-center text-caption text-cream-dim">
                  The class is running now. Your camera stays off until you
                  turn it on inside the room.
                  <HelpTip text="Joining takes you straight into the live classroom. You can listen first, use chat to ask questions, and turn your camera or mic on only when you want to." />
                </p>
              </div>
            )}

            {liveClass.status === 'SCHEDULED' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gold/25 bg-gold/10 px-5 py-4 text-center">
                  <p className="font-display text-lead text-gold">
                    Starts {timeUntil(liveClass.scheduled_at)}
                  </p>
                  <p className="mt-1 text-caption text-cream-dim">
                    {formatDateTime(liveClass.scheduled_at)}. Register now so
                    your seat is ready when the class opens.
                  </p>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={joining}
                  className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-6 font-display text-lead text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                >
                  {joining ? 'Registering...' : 'Register for class'}
                </button>

                <div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-full bg-ink-700 px-6 text-body font-semibold text-cream-faint"
                  >
                    Join class
                  </button>
                  <p className="mt-2.5 text-center text-caption text-cream-dim">
                    The room opens when the teacher starts the class.
                    <HelpTip text="There is no early entry for live classes. Once the teacher starts, this page turns into a Join button and you go straight into the room." />
                  </p>
                </div>
              </div>
            )}

            {isCancelled && (
              <p className="text-center text-body text-cream-dim">
                This class was cancelled. If you paid for a seat, the class
                teacher will share the next step with you.
              </p>
            )}

            {isEnded && !hasReplay && (
              <p className="text-center text-body text-cream-dim">
                {recording?.status === 'processing'
                  ? 'This class has ended. The recording is being processed and the replay will appear here when it is ready.'
                  : 'This class has ended and no replay is available for it.'}
              </p>
            )}
          </div>
        </section>

        {/* What the class covers */}
        {liveClass.description && (
          <section className="mt-6 rounded-3xl border border-cream/10 bg-ink-850 p-6 sm:p-8">
            <h2 className="font-display text-title text-cream">
              What this class covers
            </h2>
            <p className="mt-3 whitespace-pre-line text-body leading-relaxed text-cream-dim">
              {liveClass.description}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <CoverPoint
                title="Live teaching"
                body="Learn in real time and follow along as the teacher works through the topic."
              />
              <CoverPoint
                title="Class chat"
                body="Ask questions in chat during the class without interrupting the teaching."
              />
              <CoverPoint
                title="Replay"
                body={
                  liveClass.recording_enabled
                    ? 'This class is recorded, so the replay is posted here after the session.'
                    : 'This class is not recorded, so try to attend while it is live.'
                }
              />
            </div>
          </section>
        )}

        {/* Replay */}
        {hasReplay && (
          <section className="mt-6 rounded-3xl border border-gold/25 bg-ink-850 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                <Icon name="playCircle" size={26} variant="Bold" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-title text-cream">
                  Replay available
                </h2>
                <p className="mt-0.5 text-caption text-cream-dim">
                  {recording?.duration_seconds
                    ? `${formatRecordingDuration(recording.duration_seconds)} recorded session`
                    : 'Recorded session'}
                </p>
              </div>
            </div>
            <a
              href={recording!.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gold px-6 font-display text-lead text-ink-950 transition hover:bg-gold-light"
            >
              <Icon name="play" size={20} variant="Bold" />
              Watch replay
            </a>
          </section>
        )}

        <p className="mt-6 text-center">
          <Link
            href="/live-classes"
            className="text-caption font-semibold text-gold transition hover:text-gold-light"
          >
            See all live classes
          </Link>
        </p>
      </main>
    </div>
  )
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: 'calendar' | 'clock' | 'people'
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-ink-800 p-4">
      <p className="inline-flex items-center gap-1.5 text-meta font-bold uppercase tracking-wider text-cream-faint">
        <Icon name={icon} size={13} />
        {label}
      </p>
      <p className="mt-1.5 text-body font-semibold leading-snug text-cream">
        {value}
      </p>
    </div>
  )
}

function CoverPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-ink-800 p-4">
      <p className="inline-flex items-center gap-1.5 font-display text-body text-cream">
        <Icon name="check" size={16} variant="Bold" />
        {title}
      </p>
      <p className="mt-1.5 text-caption leading-relaxed text-cream-dim">{body}</p>
    </div>
  )
}
