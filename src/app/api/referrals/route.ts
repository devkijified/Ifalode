import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient, getRouteUser } from '@/lib/supabase/admin'
import { claimReferral, ensureReferralCode } from '@/lib/referrals'

async function authedUser() {
  const supabase = createServerClient()
  return getRouteUser(supabase as any)
}

export async function GET() {
  try {
    const user = await authedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const code = await ensureReferralCode(user.id)
    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('referral_earnings')
      .eq('id', user.id)
      .maybeSingle()

    const { data: rows } = await admin
      .from('referrals')
      .select('id, referred_id, status, reward_amount, created_at')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const list = (rows as any[]) || []
    const referredIds = list.map((r) => r.referred_id)
    const names = new Map<string, string>()
    if (referredIds.length > 0) {
      const { data: referredProfiles } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', referredIds)
      for (const p of (referredProfiles as any[]) || []) {
        names.set(
          p.id,
          p.full_name || (p.email ? p.email.split('@')[0] : 'A student')
        )
      }
    }

    return NextResponse.json({
      code,
      link: `/signup?ref=${code}`,
      stats: {
        signups: list.length,
        rewarded: list.filter((r) => r.status === 'rewarded').length,
        earnings: Number((profile as any)?.referral_earnings ?? 0),
      },
      referrals: list.map((r) => ({
        id: r.id,
        referredName: names.get(r.referred_id) || 'A student',
        status: r.status,
        reward_amount:
          r.reward_amount == null ? null : Number(r.reward_amount),
        created_at: r.created_at,
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json().catch(() => ({}))
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { ok: false, reason: 'No referral code provided' },
        { status: 400 }
      )
    }

    const result = await claimReferral(user.id, code)
    return NextResponse.json(result, { status: result.ok ? 200 : 422 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
