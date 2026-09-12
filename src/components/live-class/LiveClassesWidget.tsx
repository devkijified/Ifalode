'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'

export function LiveClassesWidget() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/student/live-classes')
      const data = await res.json()
      setLiveClasses((data.liveClasses || []).slice(0, 3))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-500">
        Loading...
      </div>
    )
  }

  if (liveClasses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-sm text-slate-500">No upcoming live classes</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {liveClasses.map((lc) => (
        <Link
          key={lc.id}
          href={`/live-classes/${lc.id}`}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-brand-primary/50 transition group"
        >
          <span
            className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase mb-3 ${
              lc.status === 'LIVE'
                ? 'bg-red-500/10 text-red-400 animate-pulse'
                : 'bg-brand-primary/10 text-brand-primary'
            }`}
          >
            {lc.status === 'LIVE' ? '● LIVE' : 'UPCOMING'}
          </span>
          <h3 className="font-bold text-white mb-1 group-hover:text-brand-primary transition line-clamp-1">
            {lc.title}
          </h3>
          <p className="text-xs text-slate-500">
            📅 {new Date(lc.scheduled_at).toLocaleString()}
          </p>
        </Link>
      ))}
    </div>
  )
}
