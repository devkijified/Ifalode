import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  createAdminClient,
  getRouteUser,
  isAdminUser,
} from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notify'

const STATUSES = ['open', 'waiting', 'resolved', 'closed'] as const

/** Loads the ticket and checks the caller may see it. Guests hold no
    session, so anonymous callers are always refused. */
async function loadAccessibleTicket(id: string) {
  const supabase = createServerClient()
  const user = await getRouteUser(supabase as any)
  if (!user) return { errorStatus: 403 as const }

  const admin = createAdminClient()
  const { data: ticket } = await admin
    .from('support_tickets')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!ticket) return { errorStatus: 404 as const }

  const isAdmin = await isAdminUser(user.id)
  const isOwner = (ticket as any).user_id === user.id
  if (!isAdmin && !isOwner) return { errorStatus: 403 as const }

  return { user, admin, ticket: ticket as any, isAdmin }
}

/** GET /api/tickets/<id>: the ticket and its full thread, oldest first. */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await loadAccessibleTicket(params.id)
    if ('errorStatus' in access) {
      return NextResponse.json(
        { error: access.errorStatus === 404 ? 'Ticket not found' : 'Forbidden' },
        { status: access.errorStatus }
      )
    }

    const { data: messages, error } = await access.admin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ticket: access.ticket,
      messages: messages || [],
      viewerRole: access.isAdmin ? 'admin' : 'user',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** POST /api/tickets/<id>: add a reply. Admin replies put the ticket in
    "waiting" and notify the owner; student replies reopen it. */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await loadAccessibleTicket(params.id)
    if ('errorStatus' in access) {
      return NextResponse.json(
        { error: access.errorStatus === 404 ? 'Ticket not found' : 'Forbidden' },
        { status: access.errorStatus }
      )
    }

    const body = await request.json().catch(() => null)
    const text = typeof body?.body === 'string' ? body.body.trim() : ''
    if (!text) {
      return NextResponse.json({ error: 'A message is required' }, { status: 400 })
    }

    const { data: message, error } = await access.admin
      .from('support_messages')
      .insert({
        ticket_id: params.id,
        author_id: access.user.id,
        author_role: access.isAdmin ? 'admin' : 'user',
        body: text,
      } as any)
      .select('*')
      .single()

    if (error || !message) {
      return NextResponse.json(
        { error: error?.message || 'Could not send the reply' },
        { status: 500 }
      )
    }

    const nextStatus = access.isAdmin ? 'waiting' : 'open'
    await access.admin
      .from('support_tickets')
      .update({ status: nextStatus, updated_at: new Date().toISOString() } as any)
      .eq('id', params.id)

    if (access.isAdmin && access.ticket.user_id) {
      await notifyUser({
        userId: access.ticket.user_id,
        type: 'ticket_reply',
        title: 'Support replied to your ticket',
        body: access.ticket.subject,
        link: `/dashboard/support/${params.id}`,
      })
    }

    return NextResponse.json({
      message,
      ticket: { ...access.ticket, status: nextStatus },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** PATCH /api/tickets/<id>: admin-only status change. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!(await isAdminUser(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const status = body?.status
    if (!status || !(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: ticket, error } = await admin
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error || !ticket) {
      return NextResponse.json(
        { error: error?.message || 'Ticket not found' },
        { status: error ? 500 : 404 }
      )
    }

    if ((status === 'resolved' || status === 'closed') && (ticket as any).user_id) {
      await notifyUser({
        userId: (ticket as any).user_id,
        type: 'ticket_reply',
        title:
          status === 'resolved'
            ? 'Your support ticket was resolved'
            : 'Your support ticket was closed',
        body: (ticket as any).subject,
        link: `/dashboard/support/${params.id}`,
      })
    }

    return NextResponse.json({ ticket })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
