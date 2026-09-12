'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import '@livekit/components-styles'
import type { JoinTokenResponse } from '@/types/live-class'

interface Props {
  liveClassId: string
  liveClassTitle: string
  isTeacher: boolean
  recordingEnabled?: boolean
}

export function LiveClassRoom({
  liveClassId,
  liveClassTitle,
  isTeacher,
  recordingEnabled = true,
}: Props) {
  const router = useRouter()
  const [tokenData, setTokenData] = useState<JoinTokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/live-classes/${liveClassId}/join`, {
          method: 'POST',
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to join')
        }

        setTokenData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [liveClassId])

  const handleLeave = async () => {
    try {
      await fetch(`/api/live-classes/${liveClassId}/leave`, { method: 'POST' })
    } catch (e) {
      console.error('Leave error:', e)
    }
  }

  const handleEndClass = async () => {
    if (!confirm('End the class for everyone?')) return

    try {
      await fetch(`/api/live-classes/${liveClassId}/leave`, { method: 'POST' })
      const res = await fetch(`/api/live-classes/${liveClassId}/end`, {
        method: 'POST',
      })
      if (res.ok) {
        router.push('/admin/lms/live-classes')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to end class')
      }
    } catch (e) {
      console.error('End class error:', e)
    }
  }

  const handleStudentLeave = async () => {
    await handleLeave()
    router.push('/live-classes')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Joining classroom...</p>
        </div>
      </div>
    )
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Cannot Join</h1>
          <p className="text-slate-400 mb-6">
            {error || 'Unable to join this class'}
          </p>
          <button
            onClick={() =>
              router.push(
                isTeacher ? '/admin/lms/live-classes' : '/live-classes'
              )
            }
            className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col" data-lk-theme="default">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-white font-bold">{liveClassTitle}</h1>
          <p className="text-xs text-slate-500">
            {isTeacher ? 'Teacher View' : 'Student View'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher && recordingEnabled && (
            <RecordingControl liveClassId={liveClassId} />
          )}
          <button
            onClick={isTeacher ? handleEndClass : handleStudentLeave}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
          >
            {isTeacher ? 'End Class' : 'Leave'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          token={tokenData.token}
          serverUrl={tokenData.livekitUrl}
          connect={true}
          audio={isTeacher}
          video={isTeacher}
          onDisconnected={isTeacher ? handleEndClass : handleStudentLeave}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  )
}

// ============================================================
// RECORDING CONTROL
// ============================================================
function RecordingControl({ liveClassId }: { liveClassId: string }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!recording) {
      setElapsed(0)
      return
    }
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [recording])

  const toggle = async () => {
    setBusy(true)
    try {
      const action = recording ? 'stop' : 'start'
      const res = await fetch(
        `/api/live-classes/${liveClassId}/recording/${action}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (res.ok) {
        setRecording(!recording)
      } else {
        alert(data.error || 'Recording action failed')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
        recording
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${recording ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
      {busy ? '...' : recording ? `● REC ${formatTime(elapsed)}` : 'Start Recording'}
    </button>
  )
}
