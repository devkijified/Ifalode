'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'
import { formatCompactCount, formatDateTime, formatDuration, timeUntil } from '@/lib/format'
import {
  EmptyState,
  HelpTip,
  LiveBadge,
  Price,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'

export default function StudentLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/student/live-classes')
      const data = await res.json()
      setLiveClasses(data.liveClasses || [])
      setLoading(false)
    }
    load()
  }, [])

  const liveNow = liveClasses.filter((lc) => lc.status === 'LIVE')
  const upcoming = liveClasses.filter((lc) => lc.status === 'SCHEDULED')
  const past = liveClasses.filter((lc) =>
    ['ENDED', 'COMPLETED', 'PROCESSING_RECORDING', 'CANCELLED'].includes(
      lc.status
    )
  )

  return (
    <div className="min-h-[100dvh] bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8 sm:px-6">
        <header className="mb-8">
          <h1 className="font-display text-display tracking-tight text-cream">
            Live classes
          </h1>
          <p className="mt-2 max-w-xl text-body text-cream-dim">
            Learn face to face with your teacher, ask questions in chat, and
            watch the replay later when a class is recorded.
          </p>
        </header>

        {loading ? (
          <div className="space-y-4" aria-label="Loading live classes">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : liveClasses.length === 0 ? (
          <EmptyState
            title="No live classes yet"
            body="When your teacher schedules a live class for a course you are taking, it will show up here."
            action={
              <Link
                href="/courses"
                className="inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="space-y-10">
            {liveNow.length > 0 && (
              <section>
                <SectionHeader title="Live now" />
                <div className="space-y-4">
                  {liveNow.map((lc) => (
                    <LiveNowCard key={lc.id} lc={lc} />
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <SectionHeader title="Upcoming" />
                <div className="space-y-4">
                  {upcoming.map((lc) => (
                    <UpcomingCard key={lc.id} lc={lc} />
                  ))}
                </div>
              </section>
            )}

            {liveNow.length === 0 && upcoming.length === 0 && (
              <EmptyState
                title="Nothing scheduled right now"
                body="There are no live or upcoming classes at the moment. Check back soon, new classes are added often."
              />
            )}

            {past.length > 0 && (
              <section>
                <SectionHeader title="Past classes" />
                <div className="space-y-3">
                  {past.map((lc) => (
                    <Link
                      key={lc.id}
                      href={`/live-classes/${lc.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-cream/10 bg-ink-900 px-5 py-4 opacity-75 transition hover:opacity-100"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-lead text-cream">
                          {lc.title}
                        </h3>
                        <p className="mt-0.5 text-caption text-cream-faint">
                          {formatDateTime(lc.scheduled_at)}
                          {lc.status === 'CANCELLED' ? ' · Cancelled' : ' · Ended'}
                        </p>
                      </div>
                      <span className="shrink-0 text-caption font-semibold text-gold">
                        View
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function MetaRow({ lc, light = false }: { lc: LiveClass; light?: boolean }) {
  const color = light ? 'text-cream-dim' : 'text-cream-faint'
  return (
    <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption ${color}`}>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="calendar" size={14} />
        {formatDateTime(lc.scheduled_at)}
      </span>
      {lc.duration_minutes ? (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={14} />
          {formatDuration(lc.duration_minutes)}
        </span>
      ) : null}
      {lc.instructor ? (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="teacher" size={14} />
          {lc.instructor}
        </span>
      ) : null}
      {lc.max_participants ? (
        <span className="inline-flex items-center gap-1.5">
          <Icon name="people" size={14} />
          {formatCompactCount(lc.max_participants)} seats
        </span>
      ) : null}
    </div>
  )
}

function LiveNowCard({ lc }: { lc: LiveClass }) {
  return (
    <article className="rounded-2xl border border-live/40 bg-ink-850 p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <LiveBadge />
          <h3 className="mt-3 font-display text-title leading-snug text-cream">
            {lc.title}
          </h3>
          {lc.description && (
            <p className="mt-1.5 line-clamp-2 text-body text-cream-dim">
              {lc.description}
            </p>
          )}
          <MetaRow lc={lc} light />
          {lc.price != null && lc.price > 0 && (
            <p className="mt-3 text-body text-cream-dim">
              <Price amount={lc.price} className="text-lead text-cream" />
              <HelpTip text="This is the full price for this class. It covers your seat in the live room and the class chat while the class runs." />
            </p>
          )}
        </div>
        <Link
          href={`/live-classes/${lc.id}`}
          className="inline-flex min-h-[48px] shrink-0 items-center gap-2 self-center rounded-full bg-live px-6 text-body font-bold text-white transition hover:opacity-90"
        >
          <Icon name="play" size={18} variant="Bold" />
          Join class
        </Link>
      </div>
    </article>
  )
}

function UpcomingCard({ lc }: { lc: LiveClass }) {
  return (
    <article className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
            {timeUntil(lc.scheduled_at)}
          </span>
          <h3 className="mt-3 font-display text-title leading-snug text-cream">
            {lc.title}
          </h3>
          {lc.description && (
            <p className="mt-1.5 line-clamp-2 text-body text-cream-dim">
              {lc.description}
            </p>
          )}
          <MetaRow lc={lc} />
          {lc.price != null && (
            <p className="mt-3 text-body text-cream-dim">
              {lc.price > 0 ? (
                <>
                  <Price amount={lc.price} className="text-lead text-cream" />
                  <HelpTip text="Paying reserves your seat in this class. You join from this page when the teacher starts the class, and you get the replay if the class is recorded." />
                </>
              ) : (
                <Price amount={lc.price} className="text-lead text-success" />
              )}
            </p>
          )}
        </div>
        <Link
          href={`/live-classes/${lc.id}`}
          className="inline-flex min-h-[44px] shrink-0 items-center self-center rounded-full border border-cream/15 bg-ink-700 px-5 text-body font-semibold text-cream transition hover:bg-ink-600"
        >
          View details
        </Link>
      </div>
    </article>
  )
}
