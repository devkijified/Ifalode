import { NextRequest, NextResponse } from 'next/server'

const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-9906a6bc52447d89af0acef6ac6e8ed7-X"
const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      amount,
      currency,
      reference,
      customer,
      customizations,
      redirect_url,
      payment_options,
      meta
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { status: 'error', message: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!customer || !customer.email) {
      return NextResponse.json(
        { status: 'error', message: 'Customer email is required' },
        { status: 400 }
      )
    }

    const payload = {
      tx_ref: reference || `IFALODE-${Date.now()}`,
      amount: amount,
      currency: currency || "NGN",
      redirect_url: redirect_url || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/courses/confirmation`,
      payment_options: payment_options || "card,ussd,account,banktransfer",
      meta: meta || {},
      customer: {
        email: customer.email,
        name: customer.name || customer.email,
        phone_number: customer.phone_number || "08012345678",
      },
      customizations: {
        title: customizations?.title || "IfaLode - Course Enrollment",
        description: customizations?.description || "Premium Ifá Course",
        logo: customizations?.logo || "https://ifalode.vercel.app/logo.png",
      },
    }

    console.log("🚀 Sending to Flutterwave:", JSON.stringify(payload, null, 2))

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log("✅ Flutterwave response:", JSON.stringify(data, null, 2))

    return NextResponse.json(data)
    
  } catch (error: any) {
    console.error("❌ Payment API error:", error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Payment initialization failed' 
      },
      { status: 500 }
    )
  }
}
