'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { LiveClass } from '@/types/live-class'

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/live-classes')
    const data = await res.json()
    setLiveClasses(data.liveClasses || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return

    const res = await fetch(`/api/live-classes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLiveClasses(liveClasses.filter(lc => lc.id !== id))
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete')
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'SCHEDULED': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
      case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
      case 'ENDED': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
      default: return 'bg-slate-800 text-slate-400 border-slate-700'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Live Classes
            </h1>
            <p className="text-slate-500 mt-1">Schedule and manage virtual classrooms</p>
          </div>
          <Link
            href="/admin/lms/live-classes/new"
            className="px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            + Create Live Class
          </Link>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading...</div>
        ) : liveClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-lg font-bold mb-2">No live classes yet</h3>
            <p className="text-slate-500 mb-6">Create your first live class to get started.</p>
            <Link
              href="/admin/lms/live-classes/new"
              className="inline-block px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
            >
              Create Live Class
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {liveClasses.map((lc) => (
              <div
                key={lc.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${statusColor(lc.status)}`}>
                        {lc.status}
                      </span>
                      {lc.price > 0 && (
                        <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold">
                          ₦{lc.price.toLocaleString()}
                        </span>
                      )}
                      {lc.recording_enabled && (
                        <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-[10px] font-bold">
                          ● REC
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-white truncate">{lc.title}</h3>
                    {lc.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{lc.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>📅 {new Date(lc.scheduled_at).toLocaleString()}</span>
                      <span>⏱️ {lc.duration_minutes} min</span>
                      <span>👥 {lc.max_participants} seats</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/lms/live-classes/${lc.id}`}
                      className="px-4 py-2 rounded-lg bg-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
                    >
                      Edit
                    </Link>
                    {['DRAFT', 'SCHEDULED', 'CANCELLED'].includes(lc.status) && (
                      <button
                        onClick={() => handleDelete(lc.id, lc.title)}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
