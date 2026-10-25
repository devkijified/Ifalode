'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'
import { formatDateTime, timeUntil } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { LiveBadge, Skeleton } from '@/components/ui/primitives'

export function LiveClassesWidget() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/student/live-classes')
        const data = await res.json()
        setLiveClasses((data.liveClasses || []).slice(0, 3))
      } catch (err) {
        console.error('LiveClassesWidget fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-[132px]" />
        <Skeleton className="hidden h-[132px] md:block" />
        <Skeleton className="hidden h-[132px] xl:block" />
      </div>
    )
  }

  if (liveClasses.length === 0) {
    return (
      <div className="rounded-2xl border border-cream/10 bg-ink-850 px-6 py-8 text-center">
        <p className="text-body text-cream-dim">No upcoming live classes</p>
        <p className="mt-1 text-caption text-cream-faint">
          New sessions appear here as soon as they are scheduled.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {liveClasses.map((lc) => {
        const isLive = lc.status === 'LIVE'
        return (
          <Link
            key={lc.id}
            href={`/live-classes/${lc.id}`}
            className="group rounded-2xl border border-cream/10 bg-ink-850 p-5 transition hover:border-gold/40"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              {isLive ? (
                <LiveBadge />
              ) : (
                <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
                  {timeUntil(lc.scheduled_at)}
                </span>
              )}
              {isLive && (
                <span className="text-caption font-semibold text-live">Join now</span>
              )}
            </div>
            <h3 className="line-clamp-1 font-display text-lead tracking-tight text-cream transition group-hover:text-gold">
              {lc.title}
            </h3>
            <p className="mt-2 flex items-center gap-2 text-caption text-cream-faint">
              <Icon name="calendar" size={15} />
              {formatDateTime(lc.scheduled_at)}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
