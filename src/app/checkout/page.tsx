'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import {
  EmptyState,
  HelpTip,
  PosterFallback,
  Price,
  Skeleton,
} from '@/components/ui/primitives'

const PAYMENT_HELP =
  'Payment is handled securely by Paystack. Your access opens the moment the payment confirms, and a confirmation also arrives in your notifications.'

interface Item {
  id: string
  title: string
  subtitle: string | null
  cover_image: string | null
  price: number | null
  kind: 'course' | 'product'
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  )
}

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const productId = searchParams.get('productId')

  const [supabase] = useState(() => createClient())
  const [item, setItem] = useState<Item | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [owned, setOwned] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser()
        setUser(sessionUser)

        if (courseId) {
          const { data } = await supabase
            .from('courses')
            .select('id, title, instructor, category, price, cover_image')
            .eq('id', courseId)
            .maybeSingle()
          if (data) {
            const c: any = data
            setItem({
              id: c.id,
              title: c.title,
              subtitle: c.instructor || c.category || null,
              cover_image: c.cover_image,
              price: c.price,
              kind: 'course',
            })
            if (sessionUser) {
              const { data: enrollment } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', sessionUser.id)
                .eq('course_id', courseId)
                .maybeSingle()
              if (enrollment) setOwned(true)
            }
          }
        } else if (productId) {
          const { data } = await supabase
            .from('products')
            .select('id, title, category, price, cover_image')
            .eq('id', productId)
            .maybeSingle()
          if (data) {
            const p: any = data
            setItem({
              id: p.id,
              title: p.title,
              subtitle: p.category || null,
              cover_image: p.cover_image,
              price: p.price,
              kind: 'product',
            })
            if (sessionUser) {
              const { data: ownedOrder } = await supabase
                .from('orders')
                .select('id')
                .eq('user_id', sessionUser.id)
                .eq('product_id', productId)
                .eq('status', 'completed')
                .maybeSingle()
              if (ownedOrder) setOwned(true)
            }
          }
        }
      } catch (err) {
        console.error('Checkout load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId, productId, supabase])

  const ownedHref =
    item?.kind === 'course' ? `/courses/${item.id}/learn` : '/dashboard'
  const ownedLabel =
    item?.kind === 'course' ? 'Go to course' : 'Go to your library'

  const handlePay = async () => {
    if (!item) return
    setPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          item.kind === 'course' ? { courseId: item.id } : { productId: item.id }
        ),
      })
      const data = await res.json()

      if (data.link) {
        window.location.href = data.link
        return
      }
      if (data.free) {
        router.push(ownedHref)
        return
      }
      if (data.alreadyOwned) {
        setOwned(true)
        setPaying(false)
        return
      }
      setError(data.message || 'Payment could not be started. Please try again.')
      setPaying(false)
    } catch (err) {
      setError('Payment could not be started. Check your connection and try again.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6" aria-busy="true">
          <Skeleton className="h-9 w-2/5" />
          <Skeleton className="mt-8 aspect-video w-full" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-12 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (!courseId && !productId) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Nothing to check out"
            body="Pick a course or a store item first, then come back here to complete it."
            action={
              <Link
                href="/courses"
                className="inline-flex min-h-[44px] items-center rounded-full bg-cream px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Browse courses
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Item not found"
            body="This item does not exist, or it is no longer available."
            action={
              <Link
                href="/courses"
                className="inline-flex min-h-[44px] items-center rounded-full bg-cream px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Browse courses
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  if (!user) {
    const params = new URLSearchParams()
    if (courseId) params.set('courseId', courseId)
    if (productId) params.set('productId', productId)
    const redirect = `/checkout?${params.toString()}`
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Sign in to check out"
            body="Your course or item is saved on this account only once you are signed in, so sign in and you will come straight back here."
            action={
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Sign in to continue
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  const isFree = !item.price || item.price === 0
  const payLabel = paying
    ? 'Taking you to payment...'
    : isFree
      ? item.kind === 'course'
        ? 'Enroll free'
        : 'Add to my library'
      : 'Pay now'

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="font-display text-headline tracking-tight text-cream">
          Checkout
        </h1>
        <p className="mt-1 text-body text-cream-dim">
          One step left. Review your order, then pay.
        </p>

        {/* Order summary */}
        <section
          className="mt-8 overflow-hidden rounded-2xl border border-cream/10 bg-ink-850 shadow-card"
          aria-label="Order summary"
        >
          <div className="relative aspect-video bg-ink-800">
            {item.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.cover_image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <PosterFallback title={item.title} className="absolute inset-0" />
            )}
          </div>
          <div className="p-5">
            <p className="text-meta font-bold uppercase tracking-wider text-gold">
              {item.kind === 'course' ? 'Course' : 'Store item'}
            </p>
            <h2 className="mt-2 font-display text-title leading-snug text-cream">
              {item.title}
            </h2>
            {item.subtitle && (
              <p className="mt-1 text-body text-cream-dim">{item.subtitle}</p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-cream/10 pt-4">
              <span className="inline-flex items-center text-body font-semibold text-cream-dim">
                Total
                <HelpTip text={PAYMENT_HELP} label="How payment works" />
              </span>
              <Price amount={item.price} className="text-headline text-cream" />
            </div>
            <p className="mt-1 text-right text-caption text-cream-faint">
              {isFree
                ? 'No payment needed. It opens right away.'
                : 'Paid securely through Paystack.'}
            </p>
          </div>
        </section>

        {owned ? (
          <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
            <p className="flex items-center justify-center gap-2 text-body font-semibold text-cream">
              <span className="text-success">
                <Icon name="check" size={18} variant="Bold" />
              </span>
              You already have this {item.kind === 'course' ? 'course' : 'item'}.
            </p>
            <Link
              href={ownedHref}
              className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              {ownedLabel}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div
                className="mt-6 flex items-start gap-3 rounded-2xl border border-live/30 bg-live/10 p-4"
                role="alert"
              >
                <span className="mt-0.5 shrink-0 text-live">
                  <Icon name="warning" size={18} />
                </span>
                <div>
                  <p className="text-body font-semibold text-cream">
                    Payment did not start
                  </p>
                  <p className="mt-0.5 text-body text-cream-dim">{error}</p>
                </div>
              </div>
            )}

            {/* Desktop action */}
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="mt-6 hidden min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 shadow-glow transition hover:bg-gold-light disabled:opacity-50 lg:inline-flex"
            >
              {payLabel}
            </button>
            <p className="mt-3 hidden text-center text-caption text-cream-faint lg:block">
              You can pay by card, bank transfer, or USSD.
            </p>

            {/* Spacer so the pinned mobile bar never covers the summary */}
            <div className="h-[76px] lg:hidden" aria-hidden="true" />
          </>
        )}
      </main>

      {/* Pinned mobile action bar, above the app tab bar */}
      {!owned && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-cream/10 bg-ink-900/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-caption text-cream-dim">Total</p>
              <Price amount={item.price} className="text-title text-cream" />
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="inline-flex min-h-[48px] shrink-0 items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
            >
              {payLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
