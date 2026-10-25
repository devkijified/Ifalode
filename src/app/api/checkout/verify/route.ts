import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient, getRouteUser, isAdminUser } from '@/lib/supabase/admin'
import { fulfillOrder } from '@/lib/payments/fulfill'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/**
 * Confirmation page poll target. Paystack sends the buyer back with the
 * reference (which is the order id here, accepted as tx_ref too). We
 * never trust the redirect alone: the order is re-checked against
 * Paystack server to server, and only a successful charge at or above
 * the order amount fulfils it.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Sign in to verify a payment' },
        { status: 401 }
      )
    }

    const txRef =
      request.nextUrl.searchParams.get('tx_ref') ||
      request.nextUrl.searchParams.get('reference')
    if (!txRef) {
      return NextResponse.json(
        { status: 'error', message: 'Missing payment reference' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    let { data: order } = await admin
      .from('orders')
      .select('*')
      .eq('id', txRef)
      .maybeSingle()

    if (!order) {
      const byTxRef = await admin
        .from('orders')
        .select('*')
        .eq('tx_ref', txRef)
        .maybeSingle()
      order = byTxRef.data
    }

    if (!order) {
      return NextResponse.json(
        { status: 'not_found' },
        { status: 404 }
      )
    }

    const row: any = order

    // The order must belong to the caller, unless the caller is an admin.
    if (row.user_id !== user.id && !(await isAdminUser(user.id))) {
      return NextResponse.json(
        { status: 'error', message: 'This order belongs to another account' },
        { status: 403 }
      )
    }

    const base = { courseId: row.course_id ?? null, productId: row.product_id ?? null }

    if (row.status === 'completed') {
      return NextResponse.json({ status: 'completed', ...base })
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { status: 'error', message: 'Payments are not configured' },
        { status: 500 }
      )
    }

    const res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    )
    const data = await res.json()
    const charge = data?.data

    // Paystack amounts are in kobo; the order amount is in naira.
    if (
      charge &&
      charge.status === 'success' &&
      Number(charge.amount) >= Math.round(Number(row.amount) * 100)
    ) {
      await admin
        .from('orders')
        .update({
          payment_reference: charge.id ? String(charge.id) : txRef,
          payment_metadata: {
            paystack_reference: txRef,
            transaction_id: charge.id ?? null,
            amount_kobo: charge.amount ?? null,
            currency: charge.currency ?? null,
            channel: charge.channel ?? null,
            source: 'verify',
          },
        } as any)
        .eq('id', row.id)

      const result = await fulfillOrder(row.id)
      if (result.ok) {
        return NextResponse.json({ status: 'completed', ...base })
      }
      return NextResponse.json(
        { status: 'error', message: 'Payment confirmed but fulfilment failed' },
        { status: 500 }
      )
    }

    // Not confirmed by Paystack yet. Bank transfers can lag, so this
    // is a pending state, not a failure.
    return NextResponse.json({ status: row.status || 'pending', ...base })
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { status: 'error', message: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
