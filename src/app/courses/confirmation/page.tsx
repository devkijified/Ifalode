'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import { Skeleton } from '@/components/ui/primitives'

type Phase = 'verifying' | 'success' | 'pending' | 'failed' | 'signed-out'

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationInner />
    </Suspense>
  )
}

function ConfirmationInner() {
  const searchParams = useSearchParams()
  // Paystack returns the buyer with reference (our order id); tx_ref is
  // also accepted for links generated before the Paystack switch.
  // transaction_id and status params.
  const txRef = searchParams.get('reference') || searchParams.get('tx_ref')
  const gatewayStatus = searchParams.get('status')

  const [supabase] = useState(() => createClient())
  const [phase, setPhase] = useState<Phase>('verifying')
  const [checking, setChecking] = useState(false)
  const [itemTitle, setItemTitle] = useState<string | null>(null)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [productId, setProductId] = useState<string | null>(null)
  const attempts = useRef(0)

  const verify = useCallback(async () => {
    if (!txRef) {
      setPhase(gatewayStatus === 'successful' ? 'pending' : 'failed')
      return
    }

    setChecking(true)
    try {
      const res = await fetch(
        `/api/checkout/verify?tx_ref=${encodeURIComponent(txRef)}`
      )

      if (res.status === 401) {
        setPhase('signed-out')
        return
      }

      const data = await res.json()

      if (data.status === 'completed') {
        setCourseId(data.courseId ?? null)
        setProductId(data.productId ?? null)
        if (data.courseId) {
          const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', data.courseId)
            .maybeSingle()
          if (course) setItemTitle((course as any).title)
        } else if (data.productId) {
          const { data: product } = await supabase
            .from('products')
            .select('title')
            .eq('id', data.productId)
            .maybeSingle()
          if (product) setItemTitle((product as any).title)
        }
        setPhase('success')
        return
      }

      if (data.status === 'failed' || data.status === 'not_found') {
        setPhase('failed')
        return
      }

      setPhase('pending')
    } catch (err) {
      console.error('Confirmation verify error:', err)
      setPhase('pending')
    } finally {
      setChecking(false)
    }
  }, [txRef, gatewayStatus, supabase])

  useEffect(() => {
    verify()
  }, [verify])

  // Bank transfers can take a few minutes to confirm, so check again on
  // its own for a short while before leaving it to the manual retry.
  useEffect(() => {
    if (phase !== 'pending') return
    if (attempts.current >= 5) return
    const timer = setTimeout(() => {
      attempts.current += 1
      verify()
    }, 6000)
    return () => clearTimeout(timer)
  }, [phase, verify])

  const primaryHref = courseId
    ? `/courses/${courseId}/learn`
    : '/dashboard'
  const primaryLabel = courseId ? 'Start learning' : 'Go to your library'

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        {phase === 'verifying' && (
          <div className="text-center" aria-busy="true">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-[3px] border-gold/25 border-t-gold" />
            <h1 className="mt-6 font-display text-headline tracking-tight text-cream">
              Confirming your payment
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              We are checking with Paystack now. This only takes a moment.
            </p>
            <div className="mx-auto mt-8 max-w-sm space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5 mx-auto" />
            </div>
          </div>
        )}

        {phase === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-gold/10 text-gold shadow-glow">
              <Icon name="check" size={36} variant="Bold" />
            </div>
            <h1 className="mt-6 font-display text-headline tracking-tight text-cream">
              Payment confirmed
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              {itemTitle
                ? `${itemTitle} is yours. It has been added to your account and a confirmation is in your notifications.`
                : 'Your payment went through and your access is open. A confirmation is in your notifications.'}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light sm:w-auto sm:min-w-[260px]"
              >
                <Icon name="play" size={17} variant="Bold" />
                {primaryLabel}
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-cream/20 px-6 text-body font-semibold text-cream transition hover:border-cream/40"
              >
                Browse more courses
              </Link>
            </div>
          </div>
        )}

        {phase === 'pending' && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-cream/20 bg-ink-850 text-cream-dim">
              <Icon name="clock" size={34} />
            </div>
            <h1 className="mt-6 font-display text-headline tracking-tight text-cream">
              Payment not confirmed yet
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              Bank transfers can take a few minutes to confirm. Your access
              opens on its own the moment Paystack confirms, and we will
              send you a notification. You can also check again now.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => verify()}
                disabled={checking}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50 sm:w-auto sm:min-w-[260px]"
              >
                {checking ? 'Checking...' : 'Check again'}
              </button>
              <Link
                href="/dashboard"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-cream/20 px-6 text-body font-semibold text-cream transition hover:border-cream/40"
              >
                Go to your dashboard
              </Link>
            </div>
          </div>
        )}

        {phase === 'failed' && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-live/40 bg-live/10 text-live">
              <Icon name="warning" size={34} />
            </div>
            <h1 className="mt-6 font-display text-headline tracking-tight text-cream">
              We could not confirm this payment
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              If money left your account, do not pay again. Send us a message
              with your payment reference and we will sort it out.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/dashboard/support"
                className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light sm:w-auto sm:min-w-[260px]"
              >
                <Icon name="support" size={18} />
                Contact support
              </Link>
              <Link
                href="/courses"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-cream/20 px-6 text-body font-semibold text-cream transition hover:border-cream/40"
              >
                Browse courses
              </Link>
            </div>
          </div>
        )}

        {phase === 'signed-out' && (
          <div className="text-center">
            <h1 className="font-display text-headline tracking-tight text-cream">
              Sign in to see your confirmation
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              Your payment is tied to your account. Sign in and this page will
              finish confirming it.
            </p>
            <Link
              href={`/login?redirect=${encodeURIComponent(
                `/courses/confirmation?tx_ref=${txRef ?? ''}`
              )}`}
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              Sign in
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
