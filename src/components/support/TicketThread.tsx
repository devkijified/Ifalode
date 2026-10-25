'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/primitives'

export type TicketStatus = 'open' | 'waiting' | 'resolved' | 'closed'

export const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function TicketStatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'border-gold/40 bg-gold/10 text-gold',
    waiting: 'border-cream/20 bg-cream/5 text-cream-dim',
    resolved: 'border-success/40 bg-success/10 text-success',
    closed: 'border-cream/10 bg-cream/5 text-cream-faint',
  }
  const label =
    TICKET_STATUSES.find((s) => s.value === status)?.label || status
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-meta font-bold uppercase tracking-wider ${styles[status] || styles.closed}`}
    >
      {label}
    </span>
  )
}

type Ticket = {
  id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  subject: string
  category: string
  priority: string
  status: string
  created_at: string
  updated_at: string
}

type Message = {
  id: string
  author_role: 'user' | 'admin' | 'guest'
  body: string
  created_at: string
}

/** Shared thread view for the student and admin support pages. The API
    decides who the viewer is; this component only renders what it gets. */
export function TicketThread({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [viewerRole, setViewerRole] = useState<'admin' | 'user'>('user')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load this ticket')
        if (mounted) {
          setTicket(data.ticket)
          setMessages(data.messages || [])
          setViewerRole(data.viewerRole === 'admin' ? 'admin' : 'user')
        }
      } catch (err: any) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [ticketId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = reply.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send your reply')
      setMessages((prev) => [...prev, data.message])
      if (data.ticket) setTicket(data.ticket)
      setReply('')
    } catch (err: any) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticket || statusBusy) return
    setStatusBusy(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not update the status')
      setTicket(data.ticket)
    } catch {
      // The select snaps back because ticket state did not change.
    } finally {
      setStatusBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="ml-auto h-16 w-2/3" />
        <Skeleton className="h-16 w-3/4" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="rounded-2xl border border-cream/10 bg-ink-850 px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-live/10 text-live">
          <Icon name="warning" size={24} />
        </div>
        <h2 className="font-display text-title text-cream">Ticket unavailable</h2>
        <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
          {error || 'This ticket could not be found.'}
        </p>
      </div>
    )
  }

  const isAdmin = viewerRole === 'admin'
  const isSettled = ticket.status === 'resolved' || ticket.status === 'closed'
  const requesterLabel = ticket.guest_name || 'Student'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-cream/10 bg-ink-850 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-headline tracking-tight text-cream">
              {ticket.subject}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-cream-faint">
              <span className="capitalize">{ticket.category.replace(/_/g, ' ')}</span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={14} />
                Opened {formatDateTime(ticket.created_at)}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="profile" size={14} />
                  {ticket.guest_name || 'Registered student'}
                  {ticket.guest_email ? ` (${ticket.guest_email})` : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TicketStatusChip status={ticket.status} />
            {isAdmin && (
              <label className="flex items-center gap-2 text-caption text-cream-dim">
                Status
                <select
                  value={ticket.status}
                  disabled={statusBusy}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="min-h-[40px] rounded-lg border border-cream/15 bg-ink-800 px-3 text-body text-cream focus:border-gold focus:outline-none disabled:opacity-50"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((m) => {
          const fromSupport = m.author_role === 'admin'
          const own = isAdmin ? fromSupport : !fromSupport
          return (
            <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                  fromSupport
                    ? 'border border-gold/25 bg-gold/10'
                    : own
                      ? 'bg-ink-700'
                      : 'border border-cream/10 bg-ink-850'
                }`}
              >
                <p className="mb-1 flex items-center gap-2 text-meta font-bold uppercase tracking-wider">
                  {fromSupport ? (
                    <span className="text-gold">Support</span>
                  ) : (
                    <span className="text-cream-dim">
                      {own ? 'You' : requesterLabel}
                    </span>
                  )}
                  <span className="font-medium normal-case tracking-normal text-cream-faint">
                    {formatDateTime(m.created_at)}
                  </span>
                </p>
                <p className="whitespace-pre-wrap text-body text-cream">{m.body}</p>
              </div>
            </div>
          )
        })}
      </div>

      {isSettled && (
        <div className="flex items-start gap-3 rounded-xl border border-cream/10 bg-ink-850 px-4 py-3">
          <span className="mt-0.5 text-gold">
            <Icon name="info" size={18} />
          </span>
          <p className="text-body text-cream-dim">
            This ticket is {ticket.status}. If you still need help, write a
            reply below and it will reopen.
          </p>
        </div>
      )}

      {/* Reply */}
      <form
        onSubmit={handleReply}
        className="rounded-2xl border border-cream/10 bg-ink-850 p-4"
      >
        <label htmlFor="ticket-reply" className="mb-2 block text-caption font-semibold text-cream-dim">
          Write a reply
        </label>
        <textarea
          id="ticket-reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Type your message here"
          className="w-full resize-y rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
        />
        {sendError && (
          <p className="mt-2 text-caption font-semibold text-live">{sendError}</p>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
          >
            <Icon name="send" size={17} variant="Bold" />
            {sending ? 'Sending...' : 'Send reply'}
          </button>
        </div>
      </form>
    </div>
  )
}
