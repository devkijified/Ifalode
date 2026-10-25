import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notify'
import { formatMoney } from '@/lib/format'

/**
 * The single place a paid order becomes access. Called by the Paystack
 * webhook and by the checkout verify route, so both paths behave the same
 * and both are safe to call twice: a completed order returns early.
 *
 * Amounts are always read from the order row, never from client input.
 * Referral reward: on the buyer's FIRST completed order, if the buyer was
 * referred and the referral is still at 'signed_up', the referrer earns
 * 10 percent of that order, once.
 */
export async function fulfillOrder(
  orderId: string
): Promise<{ ok: boolean; already?: boolean }> {
  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) {
    console.error('fulfillOrder: order not found', orderId, orderError)
    return { ok: false }
  }

  const row: any = order
  if (row.status === 'completed') {
    return { ok: true, already: true }
  }

  // Count prior completed orders BEFORE marking this one, so the referral
  // reward fires only on the buyer's first completed order.
  const { count: priorCompleted } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', row.user_id)
    .eq('status', 'completed')
    .neq('id', row.id)

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'completed' } as any)
    .eq('id', row.id)

  if (updateError) {
    console.error('fulfillOrder: could not complete order', row.id, updateError)
    return { ok: false }
  }

  // Course access is an enrollment row. The unique (user_id, course_id)
  // constraint makes a double insert harmless; ignore that conflict.
  if (row.course_id) {
    const { error: enrollError } = await admin.from('enrollments').insert({
      user_id: row.user_id,
      course_id: row.course_id,
      progress: 0,
      completed: false,
    } as any)
    if (enrollError && enrollError.code !== '23505') {
      console.error('fulfillOrder: enrollment insert failed', enrollError)
    }
  }
  // Product access needs nothing extra: the completed order row is the
  // grant, and the library reads completed orders.

  await maybeAwardReferral(admin, row, (priorCompleted ?? 0) === 0)

  // Tell the buyer their access is open.
  if (row.course_id) {
    const { data: course } = await admin
      .from('courses')
      .select('title')
      .eq('id', row.course_id)
      .maybeSingle()
    await notifyUser({
      userId: row.user_id,
      type: 'enrollment',
      title: 'You are enrolled',
      body: course?.title
        ? `${course.title} is open in your learning space. Start whenever you are ready.`
        : 'Your course is open in your learning space.',
      link: `/courses/${row.course_id}/learn`,
    })
  } else if (row.product_id) {
    const { data: product } = await admin
      .from('products')
      .select('title')
      .eq('id', row.product_id)
      .maybeSingle()
    await notifyUser({
      userId: row.user_id,
      type: 'purchase',
      title: 'Purchase complete',
      body: product?.title
        ? `${product.title} is now in your library.`
        : 'Your purchase is now in your library.',
      link: '/dashboard',
    })
  }

  return { ok: true }
}

async function maybeAwardReferral(
  admin: ReturnType<typeof createAdminClient>,
  order: any,
  isFirstCompletedOrder: boolean
): Promise<void> {
  try {
    if (!isFirstCompletedOrder) return

    const { data: buyer } = await admin
      .from('profiles')
      .select('referred_by')
      .eq('id', order.user_id)
      .maybeSingle()

    const referrerId = (buyer as any)?.referred_by as string | null
    if (!referrerId) return

    const { data: referral } = await admin
      .from('referrals')
      .select('*')
      .eq('referred_id', order.user_id)
      .eq('status', 'signed_up')
      .maybeSingle()

    if (!referral) return

    const reward = Math.round(Number(order.amount) * 0.1 * 100) / 100
    if (!(reward > 0)) return

    const { error: referralError } = await admin
      .from('referrals')
      .update({
        status: 'rewarded',
        reward_amount: reward,
        rewarded_at: new Date().toISOString(),
      } as any)
      .eq('id', (referral as any).id)

    if (referralError) {
      console.error('fulfillOrder: referral update failed', referralError)
      return
    }

    const { data: referrer } = await admin
      .from('profiles')
      .select('referral_earnings')
      .eq('id', referrerId)
      .maybeSingle()

    const newTotal =
      Math.round((Number((referrer as any)?.referral_earnings ?? 0) + reward) * 100) / 100

    await admin
      .from('profiles')
      .update({ referral_earnings: newTotal } as any)
      .eq('id', referrerId)

    await notifyUser({
      userId: referrerId,
      type: 'referral_reward',
      title: 'Referral reward earned',
      body: `Someone you invited made their first purchase. ${formatMoney(reward)} has been added to your referral earnings.`,
      link: '/dashboard/referrals',
    })
  } catch (err) {
    // A referral problem must never fail a paid order.
    console.error('fulfillOrder: referral award failed', err)
  }
}
