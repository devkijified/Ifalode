'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ParticipantTile,
  GridLayout,
  CarouselLayout,
  Chat,
  TrackToggle,
  StartAudio,
  useTracks,
  useParticipants,
  useConnectionState,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, ConnectionState } from 'livekit-client'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'
import type { JoinTokenResponse } from '@/types/live-class'
import { formatCompactCount } from '@/lib/format'
import { LiveBadge, HelpTip } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

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
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-950 px-6">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[3px] border-cream/15 border-t-gold" />
          <p className="font-display text-title text-cream">{liveClassTitle}</p>
          <p className="mt-2 text-body text-cream-dim">Joining the class</p>
          <p className="mt-1 text-caption text-cream-faint">
            Setting up your camera, sound and seat in the room.
          </p>
        </div>
      </div>
    )
  }

  if (error || !tokenData) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-ink-950 p-6">
        <div className="w-full max-w-md rounded-2xl border border-cream/10 bg-ink-850 p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-live/15 text-live">
            <Icon name="warning" size={24} variant="Bold" />
          </div>
          <h1 className="font-display text-headline text-cream">Cannot join</h1>
          <p className="mt-2 text-body text-cream-dim">
            {error || 'Unable to join this class'}
          </p>
          <button
            onClick={() =>
              router.push(
                isTeacher ? '/admin/lms/live-classes' : '/live-classes'
              )
            }
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lk-room h-[100dvh] bg-ink-950 text-cream">
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
        <RoomTheatre
          liveClassId={liveClassId}
          liveClassTitle={liveClassTitle}
          isTeacher={isTeacher}
          recordingEnabled={recordingEnabled}
          onLeave={handleStudentLeave}
          onEndClass={handleEndClass}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}

/**
 * Theatre layout, modelled on the Intima and TikTok web live rooms.
 * Desktop: slim session rail on the left, spotlight stage in the centre,
 * 320px rail on the right with the class strip and chat.
 * Mobile: fullscreen stage, overlay header, chat as a bottom sheet,
 * controls pinned at the bottom. Leave and End are never in a menu.
 *
 * Controls are built from LiveKit TrackToggle primitives (mic, camera,
 * screen share) plus our own chat toggle and leave/end actions, so the
 * room owns its layout instead of inheriting the stock ControlBar.
 */
function RoomTheatre({
  liveClassId,
  liveClassTitle,
  isTeacher,
  recordingEnabled,
  onLeave,
  onEndClass,
}: {
  liveClassId: string
  liveClassTitle: string
  isTeacher: boolean
  recordingEnabled: boolean
  onLeave: () => void
  onEndClass: () => void
}) {
  const participants = useParticipants()
  const connectionState = useConnectionState()
  const connected = connectionState === ConnectionState.Connected
  const [chatOpen, setChatOpen] = useState(false)
  const [focusedSid, setFocusedSid] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ])

  const screenShareTrack = useMemo(
    () => tracks.find((t) => t.source === Track.Source.ScreenShare),
    [tracks]
  )

  const spotlight = useMemo<TrackReferenceOrPlaceholder | undefined>(() => {
    if (screenShareTrack) return screenShareTrack
    if (focusedSid) {
      const focused = tracks.find((t) => t.participant.sid === focusedSid)
      if (focused) return focused
    }
    if (isTeacher) {
      return tracks.find((t) => t.participant.isLocal) ?? tracks[0]
    }
    return tracks.find((t) => !t.participant.isLocal) ?? tracks[0]
  }, [tracks, screenShareTrack, focusedSid, isTeacher])

  const filmstripTracks = useMemo(() => {
    if (!spotlight) return tracks
    return tracks.filter(
      (t) =>
        !(
          t.participant.sid === spotlight.participant.sid &&
          t.source === spotlight.source
        )
    )
  }, [tracks, spotlight])

  const useGrid = !screenShareTrack && !focusedSid && tracks.length > 4
  const topParticipants = participants.slice(0, 3)

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const mm = m.toString().padStart(2, '0')
    const ss = sec.toString().padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: on mobile this sits as the top overlay of the stage. */}
      <header className="pt-safe z-20 flex items-center gap-3 border-b border-cream/10 bg-ink-900 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {connected && <LiveBadge />}
            <span
              className={`inline-flex items-center rounded-md border px-2 py-1 text-meta font-bold uppercase tracking-wider ${
                isTeacher
                  ? 'border-gold/30 bg-gold/10 text-gold'
                  : 'border-cream/15 bg-cream/5 text-cream-dim'
              }`}
            >
              {isTeacher ? 'Teacher' : 'Student'}
            </span>
            <span className="inline-flex items-center gap-1 text-caption tabular-nums text-cream-dim">
              <Icon name="clock" size={14} />
              {formatElapsed(elapsed)}
            </span>
          </div>
          <h1 className="mt-1 truncate font-display text-lead leading-tight text-cream">
            {liveClassTitle}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-cream/10 bg-ink-800 px-3 py-1.5 text-caption font-semibold text-cream">
          <Icon name="eye" size={16} />
          {formatCompactCount(participants.length)}
          <span className="hidden font-normal text-cream-dim sm:inline">
            in class
          </span>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {/* Left session rail, wide desktop only so the stage never crowds. */}
        <aside className="hidden w-[220px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-cream/10 bg-ink-900 p-4 xl:flex">
          <div>
            <p className="text-meta font-bold uppercase tracking-wider text-cream-faint">
              Now teaching
            </p>
            <p className="mt-1.5 font-display text-lead leading-snug text-cream">
              {liveClassTitle}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-cream-dim">
              <Icon name="teacher" size={14} />
              {isTeacher ? 'You are teaching this class' : 'Taught live by your teacher'}
            </p>
          </div>
          <div className="space-y-3 border-t border-cream/10 pt-4">
            <p className="flex items-center justify-between text-caption text-cream-dim">
              <span>Session time</span>
              <span className="font-semibold tabular-nums text-cream">
                {formatElapsed(elapsed)}
              </span>
            </p>
            <p className="flex items-center justify-between text-caption text-cream-dim">
              <span>In class</span>
              <span className="font-semibold text-cream">
                {formatCompactCount(participants.length)}
              </span>
            </p>
            <p className="flex items-center justify-between text-caption text-cream-dim">
              <span>Status</span>
              <span className="font-semibold text-cream">
                {connected ? 'Connected' : 'Connecting'}
              </span>
            </p>
          </div>
          <p className="text-caption leading-relaxed text-cream-faint">
            Tap any person in the strip under the stage to bring them to the
            main view. Use chat to ask questions during the class.
            <HelpTip text="The main view shows whoever is teaching or sharing a screen. Tap a smaller video to focus on that person instead." />
          </p>
        </aside>

        {/* Centre stage */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-ink-950">
          <div className="relative min-h-0 flex-1 p-2 sm:p-3">
            <StartAudio
              label="Tap for sound"
              className="!absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full !bg-gold px-4 py-2 text-caption font-bold !text-ink-950 shadow-glow"
            />
            {tracks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-cream/10 bg-ink-850 px-6 text-center">
                <div>
                  <p className="font-display text-title text-cream">
                    Waiting to start
                  </p>
                  <p className="mt-2 text-body text-cream-dim">
                    Video will appear here as soon as someone turns on a camera.
                  </p>
                </div>
              </div>
            ) : useGrid ? (
              <GridLayout tracks={tracks} className="h-full">
                <ParticipantTile />
              </GridLayout>
            ) : spotlight ? (
              <div className="h-full overflow-hidden rounded-2xl">
                <ParticipantTile trackRef={spotlight} className="h-full" />
              </div>
            ) : null}
          </div>

          {/* Filmstrip of everyone not on the main stage */}
          {!useGrid && filmstripTracks.length > 0 && (
            <div className="shrink-0 px-2 pb-2 sm:px-3 sm:pb-3">
              <CarouselLayout
                tracks={filmstripTracks}
                orientation="horizontal"
                className="h-20 gap-2 sm:h-24"
              >
                <ParticipantTile
                  onParticipantClick={(evt) =>
                    setFocusedSid(evt.participant.sid)
                  }
                />
              </CarouselLayout>
              {focusedSid && (
                <button
                  type="button"
                  onClick={() => setFocusedSid(null)}
                  className="mt-2 text-caption font-semibold text-gold transition hover:text-gold-light"
                >
                  Back to teacher view
                </button>
              )}
            </div>
          )}

          {/* Control bar, pinned with safe-area padding. Leave and End
              class are always visible here, never inside a menu. */}
          <div className="pb-safe z-20 flex items-center gap-2 border-t border-cream/10 bg-ink-900 px-3 py-3 sm:gap-3 sm:px-4">
            <TrackToggle
              source={Track.Source.Microphone}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink-700 px-3.5 text-caption font-semibold text-cream transition hover:bg-ink-600"
            >
              <span className="hidden md:inline">Mic</span>
            </TrackToggle>
            <TrackToggle
              source={Track.Source.Camera}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink-700 px-3.5 text-caption font-semibold text-cream transition hover:bg-ink-600"
            >
              <span className="hidden md:inline">Camera</span>
            </TrackToggle>
            {isTeacher && (
              <TrackToggle
                source={Track.Source.ScreenShare}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink-700 px-3.5 text-caption font-semibold text-cream transition hover:bg-ink-600"
              >
                <span className="hidden md:inline">Share</span>
              </TrackToggle>
            )}
            <button
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              aria-expanded={chatOpen}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 text-caption font-semibold transition lg:hidden ${
                chatOpen
                  ? 'bg-gold text-ink-950'
                  : 'bg-ink-700 text-cream hover:bg-ink-600'
              }`}
            >
              <Icon name="chat" size={18} variant="Bold" />
              Chat
            </button>
            {isTeacher && recordingEnabled && (
              <RecordingControl liveClassId={liveClassId} />
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={isTeacher ? onEndClass : onLeave}
              className="inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-live px-5 text-body font-bold text-white transition hover:opacity-90"
            >
              {isTeacher ? 'End class' : 'Leave'}
            </button>
          </div>
        </main>

        {/* Right rail: class strip plus chat. On mobile this becomes a
            bottom sheet over the stage when chat is toggled open. */}
        <aside
          className={`fixed inset-x-0 bottom-0 z-30 flex h-[72dvh] flex-col border-t border-cream/10 bg-ink-900 shadow-sheet transition-transform duration-300 lg:static lg:z-auto lg:h-auto lg:w-[320px] lg:shrink-0 lg:border-l lg:border-t-0 lg:shadow-none lg:transition-none ${
            chatOpen
              ? 'translate-y-0'
              : 'pointer-events-none translate-y-full lg:pointer-events-auto lg:translate-y-0'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-cream/10 px-4 py-3">
            <p className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-cream-dim">
              <Icon name="people" size={16} />
              In this class
            </p>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-full text-cream-dim transition hover:bg-cream/5 hover:text-cream lg:hidden"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="space-y-1 px-2 py-2">
            {topParticipants.map((p, i) => (
              <div
                key={p.sid}
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-caption text-gold">
                  {(p.name || p.identity || 'G').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-cream">
                    {p.name || p.identity}
                    {p.isLocal ? ' (You)' : ''}
                  </span>
                  <span className="block text-caption text-cream-faint">
                    {i === 0 && isTeacher && p.isLocal
                      ? 'Teacher'
                      : p.isSpeaking
                        ? 'Speaking now'
                        : 'In class'}
                  </span>
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    p.isMicrophoneEnabled ? 'bg-success' : 'bg-cream/25'
                  }`}
                  aria-hidden="true"
                />
              </div>
            ))}
            {participants.length > 3 && (
              <p className="px-2 pb-1 text-caption text-cream-faint">
                and {formatCompactCount(participants.length - 3)} more in class
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-t border-cream/10">
            <p className="px-4 pb-1 pt-3 text-caption font-bold uppercase tracking-wider text-cream-dim">
              Class chat
            </p>
            <Chat className="min-h-0 flex-1" />
          </div>
        </aside>
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
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 text-caption font-semibold transition disabled:opacity-50 ${
        recording
          ? 'bg-live text-white hover:opacity-90'
          : 'bg-ink-700 text-cream hover:bg-ink-600'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          recording ? 'animate-live-pulse bg-white' : 'bg-live'
        }`}
      />
      <span className="hidden md:inline">
        {busy
          ? 'Working'
          : recording
            ? `Recording ${formatTime(elapsed)}`
            : 'Record'}
      </span>
      <span className="md:hidden">{busy ? '...' : recording ? formatTime(elapsed) : 'Rec'}</span>
    </button>
  )
}
