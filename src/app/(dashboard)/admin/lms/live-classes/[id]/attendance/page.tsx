'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AttendanceTable } from '@/components/live-class/AttendanceTable'
import type { LiveClass } from '@/types/live-class'

export default function AttendancePage() {
  const params = useParams()
  const liveClassId = params?.id as string

  const [attendance, setAttendance] = useState<any[]>([])
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!liveClassId) return

    const load = async () => {
      const [attendanceRes, classRes] = await Promise.all([
        fetch(`/api/live-classes/${liveClassId}/attendance`),
        fetch(`/api/live-classes/${liveClassId}`),
      ])

      const attendanceData = await attendanceRes.json()
      const classData = await classRes.json()

      setAttendance(attendanceData.attendance || [])
      setLiveClass(classData.liveClass || null)
      setLoading(false)
    }

    load()
  }, [liveClassId])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center text-cream-dim">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950 text-cream py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href="/admin/lms/live-classes"
          className="inline-flex items-center gap-2 text-sm text-cream-faint hover:text-white transition mb-6"
        >
          ← Back to Live Classes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-cream font-display">
            Attendance
          </h1>
          {liveClass && (
            <p className="text-cream-faint mt-2">
              {liveClass.title} — {new Date(liveClass.scheduled_at).toLocaleString()}
            </p>
          )}
        </div>

        <AttendanceTable attendance={attendance} />
      </div>
    </div>
  )
}
