'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/format'
import {
  EmptyState,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'
import { TicketStatusChip } from '@/components/support/TicketThread'

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

type TicketRow = {
  id: string
  subject: string
  category: string
  priority: string
  status: string
  updated_at: string
  guest_name: string | null
  guest_email: string | null
  requester_name: string | null
  requester_email: string | null
  message_count: number
}

export default function AdminSupportPage() {
  const [filter, setFilter] = useState('')
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    const load = async () => {
      try {
        const url = filter ? `/api/tickets?status=${filter}` : '/api/tickets'
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Could not load the inbox')
        if (mounted) {
          setTickets(data.tickets || [])
          setError(null)
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
  }, [filter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-headline tracking-tight text-cream">
        Support inbox
      </h1>
      <p className="mt-1 text-body text-cream-dim">
        Every ticket from students and guests, newest activity first.
      </p>

      {/* Status filter */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`min-h-[40px] shrink-0 rounded-full border px-4 text-body font-semibold transition ${
              filter === f.value
                ? 'border-gold bg-gold text-ink-950'
                : 'border-cream/15 text-cream-dim hover:border-gold/50 hover:text-cream'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[72px] w-full" />
            <Skeleton className="h-[72px] w-full" />
            <Skeleton className="h-[72px] w-full" />
            <Skeleton className="h-[72px] w-full" />
          </div>
        ) : error ? (
          <EmptyState title="Inbox could not load" body={error} />
        ) : tickets.length === 0 ? (
          <EmptyState
            title="Nothing here"
            body={
              filter
                ? 'No tickets carry this status right now.'
                : 'No support tickets have been opened yet.'
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-ink-850">
            <div className="hidden grid-cols-[1fr_180px_110px_90px_150px_110px] gap-4 border-b border-cream/10 px-5 py-3 text-meta font-bold uppercase tracking-wider text-cream-faint lg:grid">
              <span>Subject</span>
              <span>Requester</span>
              <span>Category</span>
              <span>Priority</span>
              <span>Updated</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-cream/10">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/support/${t.id}`}
                  className="grid grid-cols-1 gap-2 px-5 py-4 transition hover:bg-cream/5 lg:grid-cols-[1fr_180px_110px_90px_150px_110px] lg:items-center lg:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body font-semibold text-cream">
                      {t.subject}
                    </span>
                    <span className="mt-0.5 block text-caption text-cream-faint lg:hidden">
                      {t.requester_name || t.requester_email || 'Guest'} ·{' '}
                      {formatDateTime(t.updated_at)}
                    </span>
                  </span>
                  <span className="hidden truncate text-body text-cream-dim lg:block">
                    {t.requester_name || t.requester_email || 'Guest'}
                  </span>
                  <span className="hidden text-body capitalize text-cream-dim lg:block">
                    {t.category.replace(/_/g, ' ')}
                  </span>
                  <span className="hidden lg:block">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-meta font-bold uppercase tracking-wider ${
                        t.priority === 'high'
                          ? 'border-live/40 bg-live/10 text-live'
                          : 'border-cream/15 bg-cream/5 text-cream-dim'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </span>
                  <span className="hidden text-caption text-cream-faint lg:block">
                    {formatDateTime(t.updated_at)}
                  </span>
                  <span>
                    <TicketStatusChip status={t.status} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
