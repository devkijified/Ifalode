import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  createAdminClient,
  getRouteUser,
  isAdminUser,
} from '@/lib/supabase/admin'

const STATUSES = ['open', 'waiting', 'resolved', 'closed'] as const

/**
 * GET /api/tickets
 * Signed-in callers only. Admins see every ticket, students see their own.
 * Each ticket carries its message count and a preview of the last message
 * so list screens do not need a second round trip per row.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const isAdmin = await isAdminUser(user.id)
    const status = request.nextUrl.searchParams.get('status')
    const category = request.nextUrl.searchParams.get('category')

    let query = admin
      .from('support_tickets')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }
    if (status && (STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status)
    }
    if (category && /^[a-z_]{1,40}$/.test(category)) {
      query = query.eq('category', category)
    }

    const { data: tickets, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows = (tickets as any[]) || []
    if (rows.length === 0) {
      return NextResponse.json({ tickets: [], viewerRole: isAdmin ? 'admin' : 'user' })
    }

    // Message previews and counts in one query.
    const ticketIds = rows.map((t) => t.id)
    const { data: messages } = await admin
      .from('support_messages')
      .select('ticket_id, body, author_role, created_at')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true })

    const counts = new Map<string, number>()
    const lastByTicket = new Map<string, any>()
    for (const m of (messages as any[]) || []) {
      counts.set(m.ticket_id, (counts.get(m.ticket_id) || 0) + 1)
      lastByTicket.set(m.ticket_id, m)
    }

    // Requester names for the admin inbox (students never see other people).
    const requesterById = new Map<string, { full_name: string | null; email: string }>()
    if (isAdmin) {
      const userIds = Array.from(
        new Set(rows.map((t) => t.user_id).filter(Boolean))
      ) as string[]
      if (userIds.length > 0) {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        for (const p of (profiles as any[]) || []) {
          requesterById.set(p.id, { full_name: p.full_name, email: p.email })
        }
      }
    }

    const enriched = rows.map((t) => {
      const last = lastByTicket.get(t.id)
      const requester = t.user_id ? requesterById.get(t.user_id) : undefined
      return {
        ...t,
        message_count: counts.get(t.id) || 0,
        last_message: last
          ? { body: last.body, author_role: last.author_role, created_at: last.created_at }
          : null,
        requester_name: requester?.full_name || t.guest_name || null,
        requester_email: requester?.email || t.guest_email || null,
      }
    })

    return NextResponse.json({
      tickets: enriched,
      viewerRole: isAdmin ? 'admin' : 'user',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/tickets
 * Creates a ticket plus its first message. Signed-in users are attached to
 * their account; guests must give a name and email so support can reply.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const category =
      typeof body?.category === 'string' && body.category.trim()
        ? body.category.trim()
        : 'general'

    if (!subject) {
      return NextResponse.json({ error: 'A subject is required' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'A message is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    const admin = createAdminClient()

    let userId: string | null = null
    let guestName: string | null = null
    let guestEmail: string | null = null
    let authorRole: 'user' | 'guest' = 'guest'

    if (user) {
      userId = user.id
      authorRole = 'user'
    } else {
      guestName =
        typeof body?.guest_name === 'string' ? body.guest_name.trim() : ''
      guestEmail =
        typeof body?.guest_email === 'string' ? body.guest_email.trim() : ''
      if (!guestName || !guestEmail) {
        return NextResponse.json(
          { error: 'Please give your name and email so we can reply to you' },
          { status: 400 }
        )
      }
    }

    const { data: ticket, error: ticketError } = await admin
      .from('support_tickets')
      .insert({
        user_id: userId,
        guest_name: guestName,
        guest_email: guestEmail,
        subject,
        category,
        status: 'open',
      } as any)
      .select('id')
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: ticketError?.message || 'Could not create the ticket' },
        { status: 500 }
      )
    }

    const { error: messageError } = await admin.from('support_messages').insert({
      ticket_id: (ticket as any).id,
      author_id: userId,
      author_role: authorRole,
      body: message,
    } as any)

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 500 })
    }

    return NextResponse.json({ id: (ticket as any).id }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
