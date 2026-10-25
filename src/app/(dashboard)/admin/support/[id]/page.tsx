'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { TicketThread } from '@/components/support/TicketThread'

export default function AdminSupportTicketPage() {
  const params = useParams()
  const ticketId = params?.id as string

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/admin/support"
        className="mb-6 inline-flex min-h-[40px] items-center gap-2 text-body font-semibold text-cream-dim transition hover:text-gold"
      >
        <Icon name="back" size={18} />
        Support inbox
      </Link>
      {ticketId && <TicketThread ticketId={ticketId} />}
    </div>
  )
}
