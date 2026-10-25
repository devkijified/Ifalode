'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import {
  EmptyState,
  HelpTip,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { TicketStatusChip } from '@/components/support/TicketThread'

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'payment', label: 'Payment' },
  { value: 'course_access', label: 'Course access' },
  { value: 'live_class', label: 'Live class' },
  { value: 'technical', label: 'Technical' },
]

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label || value
}

type TicketRow = {
  id: string
  subject: string
  category: string
  status: string
  updated_at: string
  message_count: number
  last_message: { body: string; created_at: string } | null
}

export default function MySupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/tickets')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load your tickets')
        if (mounted) setTickets(data.tickets || [])
      } catch (err: any) {
        if (mounted) setLoadError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create your ticket')
      router.push(`/dashboard/support/${data.id}`)
    } catch (err: any) {
      setCreateError(err.message)
      setCreating(false)
    }
  }

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-cream/10 bg-ink-900 px-4 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-headline tracking-tight text-cream">
        Support tickets
      </h1>
      <p className="mt-1 text-body text-cream-dim">
        Ask about a payment, a course, or a live class. Replies land here and
        in your notifications.
      </p>

      {/* New ticket */}
      <form
        onSubmit={handleCreate}
        className="mt-8 rounded-2xl border border-cream/10 bg-ink-850 p-5"
      >
        <SectionHeader title="New ticket" />
        <div className="space-y-4">
          <div>
            <label htmlFor="ticket-subject" className="mb-1.5 block text-caption font-semibold text-cream-dim">
              Subject
              <HelpTip text="A short line helps us route your ticket faster. Say what the problem is in a few words, for example: Paid but course is locked." />
            </label>
            <input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="What do you need help with?"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ticket-category" className="mb-1.5 block text-caption font-semibold text-cream-dim">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ticket-message" className="mb-1.5 block text-caption font-semibold text-cream-dim">
              Message
            </label>
            <textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Describe the problem and what you already tried"
              className="w-full resize-y rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
            />
          </div>
          {createError && (
            <p className="text-caption font-semibold text-live">{createError}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !subject.trim() || !message.trim()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
            >
              <Icon name="plus" size={17} variant="Bold" />
              {creating ? 'Opening ticket...' : 'Open ticket'}
            </button>
          </div>
        </div>
      </form>

      {/* My tickets */}
      <div className="mt-10">
        <SectionHeader title="My tickets" />
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[76px] w-full" />
            <Skeleton className="h-[76px] w-full" />
            <Skeleton className="h-[76px] w-full" />
          </div>
        ) : loadError ? (
          <EmptyState
            title="Tickets could not load"
            body={loadError}
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            body="When you open a ticket it will appear here, and you can follow the conversation with support."
          />
        ) : (
          <div className="divide-y divide-cream/10 rounded-2xl border border-cream/10 bg-ink-850">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/support/${t.id}`}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-cream/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Icon name="chat" size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-semibold text-cream">
                    {t.subject}
                  </span>
                  <span className="mt-0.5 block truncate text-caption text-cream-faint">
                    {categoryLabel(t.category)} · Updated {formatDateTime(t.updated_at)}
                    {t.last_message ? ` · ${t.last_message.body}` : ''}
                  </span>
                </span>
                <TicketStatusChip status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
