import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-9906a6bc52447d89af0acef6ac6e8ed7-X"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('verif-hash')

    // Verify webhook signature
    if (!signature || signature !== FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid signature' },
        { status: 401 }
      )
    }

    const { event, data } = body

    if (event === 'charge.completed') {
      const supabase = createServerClient() as any
      const { tx_ref, status, transaction_id, amount, currency } = data

      if (status === 'successful') {
        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_reference: transaction_id,
            payment_metadata: {
              flutterwave_tx_ref: tx_ref,
              amount: amount,
              currency: currency
            }
          })
          .eq('id', tx_ref)

        if (orderError) {
          console.error('Error updating order:', orderError)
          return NextResponse.json(
            { status: 'error', message: 'Failed to update order' },
            { status: 500 }
          )
        }

        // Get the order to find the course_id
        const { data: orderData, error: orderFetchError } = await supabase
          .from('orders')
          .select('user_id, course_id')
          .eq('id', tx_ref)
          .single()

        if (orderFetchError) {
          console.error('Error fetching order:', orderFetchError)
          return NextResponse.json(
            { status: 'error', message: 'Failed to fetch order' },
            { status: 500 }
          )
        }

        if (orderData && orderData.course_id) {
          // Enroll the user
          const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
              user_id: orderData.user_id,
              course_id: orderData.course_id,
              progress: 0,
              completed: false
            })

          if (enrollError) {
            console.error('Error creating enrollment:', enrollError)
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { status: 'error', message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
