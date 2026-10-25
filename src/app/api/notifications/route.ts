import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient, getRouteUser } from '@/lib/supabase/admin'

/**
 * Notification centre API. Every query is scoped to the caller with the
 * service role client, so a user can only ever read or mark their own rows.
 */
export async function GET() {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: notifications } = await admin
      .from('notifications')
      .select('id, type, title, body, link, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const list = notifications || []
    return NextResponse.json({
      notifications: list,
      unread: list.filter((n: any) => !n.read_at).length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json().catch(() => ({}))
    const admin = createAdminClient()
    const now = new Date().toISOString()

    let query = admin
      .from('notifications')
      .update({ read_at: now } as any)
      .eq('user_id', user.id)
      .is('read_at', null)
    if (id) query = query.eq('id', id)

    const { error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
