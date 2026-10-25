'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/format'
import { Icon, type IconName } from '@/components/ui/Icon'
import { EmptyState, Skeleton } from '@/components/ui/primitives'

type AppNotification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const TYPE_ICONS: Record<string, IconName> = {
  referral_signup: 'award',
  referral_reward: 'award',
  ticket_reply: 'chat',
  ticket_update: 'chat',
  support: 'chat',
  enrollment: 'book',
  enrolment: 'book',
  course: 'book',
  live_class: 'live',
  class_reminder: 'live',
  live: 'live',
}

function iconFor(type: string): IconName {
  return TYPE_ICONS[type] || 'info'
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return formatDateTime(iso)
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load notifications')
        setNotifications(data.notifications || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {
      // The tap still follows the link; read state can catch up later.
    }
  }

  const openNotification = async (n: AppNotification) => {
    if (!n.read_at) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item
        )
      )
      await markRead(n.id)
    }
    if (n.link) router.push(n.link)
  }

  const markAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.read_at ? item : { ...item, read_at: new Date().toISOString() }
      )
    )
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch {
      // Optimistic state stays; the next load will correct it if needed.
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-2 text-body font-medium text-cream-dim transition hover:text-cream"
      >
        <Icon name="back" size={18} />
        My learning
      </Link>

      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-headline tracking-tight text-cream sm:text-display">
            Notifications
          </h1>
          <p className="mt-2 text-body text-cream-dim">
            {unreadCount > 0
              ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.`
              : 'Class reminders, replies and rewards land here.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-cream/15 px-4 text-body font-semibold text-cream transition hover:border-gold/50 hover:text-gold"
          >
            <Icon name="check" size={17} />
            Mark all read
          </button>
        )}
      </header>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[84px]" />
          <Skeleton className="h-[84px]" />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-live/30 bg-live/10 px-5 py-4 text-body text-cream">
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          title="Nothing here yet"
          body="When a class is about to start, a ticket gets a reply, or a referral earns, it will show up here."
        />
      )}

      {!loading && notifications.length > 0 && (
        <ul className="animate-fade-up divide-y divide-cream/10 rounded-2xl border border-cream/10 bg-ink-850">
          {notifications.map((n) => {
            const unread = !n.read_at
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-cream/[0.03]"
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      unread ? 'bg-gold/15 text-gold' : 'bg-cream/5 text-cream-faint'
                    }`}
                  >
                    <Icon name={iconFor(n.type)} size={19} variant={unread ? 'Bold' : 'Linear'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={`text-body ${unread ? 'font-bold text-cream' : 'font-semibold text-cream-dim'}`}
                      >
                        {n.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-caption text-cream-faint">
                          {relativeTime(n.created_at)}
                        </span>
                        {unread && (
                          <span className="h-2 w-2 rounded-full bg-gold" aria-label="Unread" />
                        )}
                      </span>
                    </span>
                    {n.body && (
                      <span className="mt-1 line-clamp-2 block text-body text-cream-dim">
                        {n.body}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
