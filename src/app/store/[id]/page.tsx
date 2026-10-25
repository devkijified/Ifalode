'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  cover_image: string | null
  file_url: string | null
  category: string | null
  is_ebook: boolean
  stock: number | null
  created_at: string
}

const BUY_HELP =
  'Buying adds this item to your library on this account. The file opens here only after payment confirms, so your purchase stays yours on any device you sign in on.'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params?.id as string

  const [supabase] = useState(() => createClient())
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [owned, setOwned] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!productId) return
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .maybeSingle()

        if (data) setProduct(data as Product)

        const {
          data: { user: sessionUser },
        } = await supabase.auth.getUser()
        setUser(sessionUser)

        if (sessionUser && data) {
          const { data: ownedOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', sessionUser.id)
            .eq('product_id', productId)
            .eq('status', 'completed')
            .maybeSingle()
          if (ownedOrder) setOwned(true)
        }
      } catch (err) {
        console.error('Product load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [productId, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6" aria-busy="true">
          <Skeleton className="mt-6 aspect-[16/9] w-full lg:aspect-[16/5]" />
          <div className="mt-8 max-w-2xl space-y-3">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-9 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-ink-950 font-sans text-cream">
        <PublicBar />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Item not found"
            body="This store item does not exist, or it may have been removed."
            action={
              <Link
                href="/store"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-cream px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                <Icon name="back" size={16} variant="Bold" />
                Back to the store
              </Link>
            }
          />
        </main>
      </div>
    )
  }

  const buyHref = `/checkout?productId=${product.id}`

  return (
    <div className="min-h-screen bg-ink-950 font-sans text-cream">
      <PublicBar />

      {/* Cinematic header, same pattern as the course detail */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          {product.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.cover_image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <PosterFallback title={product.title} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/72 to-ink-950/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/35 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:pb-14 lg:pt-10">
          <Link
            href="/store"
            className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-cream/20 bg-ink-950/55 px-3.5 text-caption font-semibold text-cream backdrop-blur-md transition hover:border-cream/40"
          >
            <Icon name="back" size={15} variant="Bold" />
            Back to the store
          </Link>

          <div className="mt-16 max-w-3xl sm:mt-24 lg:mt-32">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
                {product.is_ebook ? 'E-book' : 'Product'}
              </span>
              {product.category && (
                <span className="inline-flex items-center rounded-md border border-cream/20 bg-ink-950/50 px-2 py-1 text-meta font-bold uppercase tracking-wider text-cream backdrop-blur-sm">
                  {product.category}
                </span>
              )}
              {owned && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gold px-2 py-1 text-meta font-bold uppercase tracking-wider text-ink-950">
                  <Icon name="check" size={11} variant="Bold" />
                  In your library
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-display tracking-tight text-cream">
              {product.title}
            </h1>

            {product.description && (
              <p className="mt-3 max-w-2xl text-body leading-relaxed text-cream-dim lg:text-lead lg:leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="max-w-3xl">
          {owned ? (
            <section
              className="rounded-2xl border border-success/30 bg-success/10 p-5"
              aria-label="Your copy"
            >
              <p className="flex items-center gap-2 text-body font-semibold text-cream">
                <span className="text-success">
                  <Icon name="check" size={18} variant="Bold" />
                </span>
                This item is in your library.
              </p>
              <p className="mt-1 text-body text-cream-dim">
                Your purchase is tied to your account, so you can download it
                again here any time you are signed in.
              </p>
              {product.file_url ? (
                <a
                  href={product.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-cream px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                >
                  <Icon name="download" size={17} variant="Bold" />
                  Download your copy
                </a>
              ) : (
                <p className="mt-4 text-body text-cream-dim">
                  The file for this item is being prepared. If it does not
                  appear soon, contact support from your dashboard.
                </p>
              )}
            </section>
          ) : (
            <section
              className="rounded-2xl border border-cream/10 bg-ink-850 p-5 shadow-card"
              aria-label="Buy this item"
            >
              <div className="flex items-center gap-1.5">
                <Price amount={product.price} className="text-headline text-cream" />
                <HelpTip text={BUY_HELP} label="How buying works" />
              </div>
              <p className="mt-2 text-body text-cream-dim">
                {product.price > 0
                  ? 'Secure checkout opens on the next step. Card, bank transfer, and USSD are accepted.'
                  : 'This item is free. It goes straight into your library.'}
              </p>
              <Link
                href={user ? buyHref : `/login?redirect=${encodeURIComponent(buyHref)}`}
                className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 shadow-glow transition hover:bg-gold-light sm:w-auto sm:min-w-[240px]"
              >
                {product.price > 0 ? 'Buy now' : 'Get it free'}
              </Link>
              {!user && (
                <p className="mt-3 text-caption text-cream-faint">
                  You will sign in first, then come straight back to checkout.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Spacer so the pinned mobile bar never covers content */}
        {!owned && <div className="h-[76px] lg:hidden" aria-hidden="true" />}
      </main>

      {/* Pinned mobile action bar, above the app tab bar */}
      {!owned && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-cream/10 bg-ink-900/95 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <Price amount={product.price} className="shrink-0 text-title text-cream" />
            <Link
              href={user ? buyHref : `/login?redirect=${encodeURIComponent(buyHref)}`}
              className="inline-flex min-h-[48px] shrink-0 items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              {product.price > 0 ? 'Buy now' : 'Get it free'}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
