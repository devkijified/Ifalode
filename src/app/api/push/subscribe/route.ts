import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient, getRouteUser } from '@/lib/supabase/admin'

async function authedUser() {
  const supabase = createServerClient()
  return getRouteUser(supabase as any)
}

/** Save or refresh this device's web push subscription for the caller. */
export async function POST(request: NextRequest) {
  try {
    const user = await authedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription } = await request.json().catch(() => ({}))
    const endpoint = subscription?.endpoint
    const p256dh = subscription?.keys?.p256dh
    const auth = subscription?.keys?.auth
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: 'A complete push subscription is required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { error } = await admin.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      } as any,
      { onConflict: 'endpoint' }
    )
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** Remove this device's subscription for the caller. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await authedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint } = await request.json().catch(() => ({}))
    if (!endpoint) {
      return NextResponse.json(
        { error: 'An endpoint is required' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
