import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { fulfillOrder } from '@/lib/payments/fulfill'

/**
 * Paystack webhook. Paystack signs the raw body with HMAC SHA512 using
 * the secret key and sends it as x-paystack-signature. Only a valid
 * charge.success fulfils an order, and fulfilment is idempotent, so
 * retries and double delivery are safe. The reference IS the order id.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json(
      { status: 'error', message: 'Payments are not configured' },
      { status: 500 }
    )
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature')
  const expected = crypto
    .createHmac('sha512', secretKey)
    .update(rawBody)
    .digest('hex')

  if (!signature || signature !== expected) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid signature' },
      { status: 401 }
    )
  }

  try {
    const payload = JSON.parse(rawBody)

    if (payload.event === 'charge.success') {
      const reference: string | undefined = payload.data?.reference
      const amountKobo = Number(payload.data?.amount || 0)

      if (reference) {
        const admin = createAdminClient()
        const { data: order } = await admin
          .from('orders')
          .select('id, amount, status')
          .eq('id', reference)
          .maybeSingle()

        if (
          order &&
          (order as any).status !== 'completed' &&
          amountKobo >= Math.round(Number((order as any).amount) * 100)
        ) {
          await admin
            .from('orders')
            .update({
              payment_reference: payload.data?.id
                ? String(payload.data.id)
                : reference,
              payment_metadata: {
                paystack_reference: reference,
                transaction_id: payload.data?.id ?? null,
                amount_kobo: amountKobo,
                currency: payload.data?.currency ?? null,
                channel: payload.data?.channel ?? null,
                source: 'webhook',
              },
            } as any)
            .eq('id', (order as any).id)

          await fulfillOrder((order as any).id)
        }
      }
    }

    // Always 200 for valid signatures so Paystack stops retrying.
    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json(
      { status: 'error', message: error.message || 'Webhook failed' },
      { status: 500 }
    )
  }
}
