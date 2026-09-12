'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'

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

  const timeUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now()
    if (diff <= 0) return 'Starting now'
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    if (hours > 24) return `In ${Math.floor(hours / 24)} days`
    if (hours > 0) return `In ${hours}h ${mins}m`
    return `In ${mins}m`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Live Classes
          </h1>
          <p className="text-slate-500 mt-1">Your upcoming live sessions</p>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading...</div>
        ) : liveClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-lg font-bold mb-2">No upcoming classes</h3>
            <p className="text-slate-500">Enroll in a course to see scheduled classes here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveClasses.map((lc) => {
              const canJoin = lc.status === 'LIVE'
              const isSoon = lc.status === 'SCHEDULED'

              return (
                <div
                  key={lc.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border mb-2 ${
                          lc.status === 'LIVE'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                            : 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                        }`}
                      >
                        {lc.status === 'LIVE' ? '● LIVE NOW' : 'UPCOMING'}
                      </span>
                      <h3 className="text-xl font-bold text-white">{lc.title}</h3>
                      {lc.description && (
                        <p className="text-sm text-slate-400 mt-1">{lc.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>📅 {new Date(lc.scheduled_at).toLocaleString()}</span>
                        <span>⏱️ {lc.duration_minutes} min</span>
                        {lc.price && lc.price > 0 && (
                          <span className="text-green-400">
                            ₦{lc.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isSoon && (
                        <p className="text-xs text-slate-500">
                          {timeUntil(lc.scheduled_at)}
                        </p>
                      )}
                      {canJoin ? (
                        <Link
                          href={`/live-classes/${lc.id}`}
                          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                        >
                          Join Class →
                        </Link>
                      ) : (
                        <Link
                          href={`/live-classes/${lc.id}`}
                          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
