'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { LiveClass } from '@/types/live-class'
import { LiveClassRoom } from '@/components/live-class/LiveClassRoom'

export default function StudentLiveClassPage() {
  const params = useParams()
  const router = useRouter()
  const liveClassId = params?.id as string

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/live-classes/${liveClassId}`)
        if (!res.ok) throw new Error('Class not found')
        const data = await res.json()
        setLiveClass(data.liveClass)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (liveClassId) load()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (error || !liveClass) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Not Found</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link href="/live-classes" className="text-brand-primary hover:underline">
            ← Back to Live Classes
          </Link>
        </div>
      </div>
    )
  }

  // If LIVE and user clicks join → show the classroom
  if (liveClass.status === 'LIVE') {
    return (
      <LiveClassRoom
        liveClassId={liveClass.id}
        liveClassTitle={liveClass.title}
        isTeacher={false}
      />
    )
  }

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
          <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-brand-primary/10 text-brand-primary border border-brand-primary/30 mb-3">
            UPCOMING
          </span>

          <h1 className="text-3xl font-bold text-white mb-3">{liveClass.title}</h1>
          {liveClass.description && (
            <p className="text-slate-400 mb-6">{liveClass.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <InfoTile label="Date" value={new Date(liveClass.scheduled_at).toLocaleDateString()} />
            <InfoTile label="Time" value={new Date(liveClass.scheduled_at).toLocaleTimeString()} />
            <InfoTile label="Duration" value={`${liveClass.duration_minutes} min`} />
            <InfoTile label="Seats" value={`${liveClass.max_participants}`} />
          </div>

          {liveClass.price && liveClass.price > 0 ? (
            <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30 mb-6">
              <p className="text-sm text-slate-300">Price</p>
              <p className="text-2xl font-bold text-green-400">
                ₦{liveClass.price.toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-brand-primary/10 border border-brand-primary/30 mb-6">
              <p className="text-sm text-brand-primary font-semibold">Free Class</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={joining}
            className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {joining ? 'Registering...' : 'Register for Class'}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            You'll be able to join when the class goes live
          </p>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
