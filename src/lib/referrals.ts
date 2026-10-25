import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notify'

/**
 * Referral identity and claiming. Codes live on profiles.referral_code;
 * one referrals row exists per referred student (referred_id is UNIQUE).
 * Rewards are credited later by payment fulfilment; this module only owns
 * the code, the claim, and the signup notification.
 */

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomSuffix(length = 4): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

function codeBase(fullName: string | null | undefined, email: string | null | undefined): string {
  const fromName = (fullName || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6)
  if (fromName.length >= 3) return fromName
  const fromEmail = (email || '')
    .split('@')[0]
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
  return fromEmail || 'IFALODE'
}

/** Return the user's referral code, generating and saving one if needed. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('referral_code, full_name, email')
    .eq('id', userId)
    .maybeSingle()

  if ((profile as any)?.referral_code) return (profile as any).referral_code

  const base = codeBase((profile as any)?.full_name, (profile as any)?.email)
  // Retry on the UNIQUE constraint: another user may hold the same base.
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = `${base}${randomSuffix(4)}`
    const { error } = await admin
      .from('profiles')
      .update({ referral_code: code } as any)
      .eq('id', userId)
    if (!error) return code
    if (!/duplicate|unique/i.test(error.message)) throw new Error(error.message)
  }
  throw new Error('Could not generate a referral code')
}

export type ClaimResult =
  | { ok: true; already?: boolean }
  | { ok: false; reason: string }

/** Attach a referred student to the owner of `rawCode`. Idempotent. */
export async function claimReferral(
  referredUserId: string,
  rawCode: string
): Promise<ClaimResult> {
  const code = (rawCode || '').trim().toUpperCase()
  if (!code) return { ok: false, reason: 'No referral code provided' }

  const admin = createAdminClient()

  const { data: referrer } = await admin
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()
  if (!referrer) return { ok: false, reason: 'That referral code was not recognised' }

  const referrerId = (referrer as any).id as string
  if (referrerId === referredUserId) {
    return { ok: false, reason: 'You cannot use your own referral code' }
  }

  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referred_id', referredUserId)
    .maybeSingle()
  if (existing) return { ok: true, already: true }

  const { error: insertError } = await admin.from('referrals').insert({
    referrer_id: referrerId,
    referred_id: referredUserId,
    code,
    status: 'signed_up',
  } as any)
  if (insertError) {
    // A race can land the row between the check and the insert.
    if (/duplicate|unique/i.test(insertError.message)) {
      return { ok: true, already: true }
    }
    return { ok: false, reason: 'Could not save the referral' }
  }

  await admin
    .from('profiles')
    .update({ referred_by: referrerId } as any)
    .eq('id', referredUserId)

  await notifyUser({
    userId: referrerId,
    type: 'referral_signup',
    title: 'Someone joined with your link',
    body: 'A new student signed up with your referral link. You earn 10% of their first paid order.',
    link: '/dashboard/referrals',
  })

  return { ok: true }
}
