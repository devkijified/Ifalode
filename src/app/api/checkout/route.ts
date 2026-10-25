import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient, getRouteUser } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notify'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/**
 * The one checkout entry point for courses and store products.
 * The price is ALWAYS read here from the database row. Nothing the
 * client sends can change what is charged.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const user = await getRouteUser(supabase as any)
    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Sign in to check out' },
        { status: 401 }
      )
    }

    const { courseId, productId } = await request.json()

    if (!courseId && !productId) {
      return NextResponse.json(
        { status: 'error', message: 'Nothing to check out' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // ---- Resolve the item and its real price -------------------------
    let amount = 0
    let title = ''

    if (courseId) {
      const { data: course } = await admin
        .from('courses')
        .select('id, title, price, is_published')
        .eq('id', courseId)
        .maybeSingle()

      if (!course || !(course as any).is_published) {
        return NextResponse.json(
          { status: 'error', message: 'Course not found' },
          { status: 404 }
        )
      }
      amount = Number((course as any).price ?? 0)
      title = (course as any).title

      const { data: existing } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ alreadyOwned: true, courseId })
      }
    }

    if (productId) {
      const { data: product } = await admin
        .from('products')
        .select('id, title, price')
        .eq('id', productId)
        .maybeSingle()

      if (!product) {
        return NextResponse.json(
          { status: 'error', message: 'Product not found' },
          { status: 404 }
        )
      }
      amount = Number((product as any).price ?? 0)
      title = (product as any).title

      const { data: owned } = await admin
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('status', 'completed')
        .maybeSingle()

      if (owned) {
        return NextResponse.json({ alreadyOwned: true, productId })
      }
    }

    // ---- Free items open immediately ---------------------------------
    if (!amount || amount <= 0) {
      if (courseId) {
        const { error } = await admin.from('enrollments').insert({
          user_id: user.id,
          course_id: courseId,
          progress: 0,
          completed: false,
        } as any)
        if (error && error.code !== '23505') {
          console.error('Checkout: free enrollment failed', error)
          return NextResponse.json(
            { status: 'error', message: 'Enrollment failed' },
            { status: 500 }
          )
        }
        await notifyUser({
          userId: user.id,
          type: 'enrollment',
          title: 'You are enrolled',
          body: `${title} is open in your learning space. Start whenever you are ready.`,
          link: `/courses/${courseId}/learn`,
        })
        return NextResponse.json({ free: true, courseId })
      }

      // Free product: a completed zero order is the library grant.
      const { data: order, error } = await admin
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: productId,
          amount: 0,
          status: 'completed',
          payment_method: 'free',
        } as any)
        .select('id')
        .single()

      if (error) {
        console.error('Checkout: free product order failed', error)
        return NextResponse.json(
          { status: 'error', message: 'Checkout failed' },
          { status: 500 }
        )
      }
      await notifyUser({
        userId: user.id,
        type: 'purchase',
        title: 'Added to your library',
        body: `${title} is now in your library.`,
        link: '/dashboard',
      })
      return NextResponse.json({ free: true, productId, orderId: (order as any).id })
    }

    // ---- Paid: create the order, then hand off to Paystack -----------
    // The Kijitech Paystack account carries IfaLode payments for now
    // (owner instruction, 2026-10-25). Keys live only in env.
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json(
        { status: 'error', message: 'Payments are not configured' },
        { status: 500 }
      )
    }

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        course_id: courseId || null,
        product_id: productId || null,
        amount,
        status: 'pending',
        payment_method: 'paystack',
      } as any)
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Checkout: order insert failed', orderError)
      return NextResponse.json(
        { status: 'error', message: 'Could not start checkout' },
        { status: 500 }
      )
    }

    const orderId = (order as any).id as string
    // The order id doubles as the Paystack reference, so the webhook and
    // the confirmation page can find this order with one value.
    await admin.from('orders').update({ tx_ref: orderId } as any).eq('id', orderId)

    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: (profile as any)?.email || user.email,
        amount: Math.round(amount * 100), // Paystack charges in kobo
        currency: 'NGN',
        reference: orderId,
        callback_url: `${origin}/courses/confirmation`,
        channels: ['card', 'bank', 'ussd', 'bank_transfer'],
        metadata: {
          order_id: orderId,
          user_id: user.id,
          item_title: title,
        },
      }),
    })

    const data = await response.json()
    const link = data?.data?.authorization_url

    if (!response.ok || !link) {
      console.error('Checkout: Paystack init failed', data)
      await admin
        .from('orders')
        .update({ status: 'failed' } as any)
        .eq('id', orderId)
      return NextResponse.json(
        { status: 'error', message: data?.message || 'Payment could not be started' },
        { status: 502 }
      )
    }

    return NextResponse.json({ link, orderId })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { status: 'error', message: error.message || 'Checkout failed' },
      { status: 500 }
    )
  }
}
