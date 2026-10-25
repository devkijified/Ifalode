import { createAdminClient } from '@/lib/supabase/admin'

/**
 * One notification entry point for the whole app. Every notable event
 * (enrolment, ticket reply, referral reward, class starting) calls this:
 * it writes the in-app notification row, and mirrors to web push when the
 * user has a subscription and VAPID keys are configured. Failures are
 * logged, never thrown: a notification must not break the action that
 * triggered it.
 */
export async function notifyUser(input: {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('notifications').insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    } as any)

    await sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      link: input.link,
    })
  } catch (err) {
    console.error('notifyUser failed:', err)
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; link?: string }
): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return // Push not configured yet; in-app still lands.

  try {
    const admin = createAdminClient()
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
    if (!subs || subs.length === 0) return

    const webpush = (await import('web-push')).default
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@ifalode.app',
      publicKey,
      privateKey
    )
    const body = JSON.stringify(payload)
    await Promise.allSettled(
      subs.map((s: any) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        )
      )
    )
  } catch (err) {
    console.error('sendPushToUser failed:', err)
  }
}
