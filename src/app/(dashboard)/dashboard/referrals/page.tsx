'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCompactCount, formatDateTime, formatMoney } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { useBrand } from '@/hooks/useBrand'
import {
  EmptyState,
  HelpTip,
  Price,
  SectionHeader,
  Skeleton,
} from '@/components/ui/primitives'

type ReferralRow = {
  id: string
  referredName: string
  status: 'signed_up' | 'rewarded'
  reward_amount: number | null
  created_at: string
}

type ReferralData = {
  code: string
  link: string
  stats: { signups: number; rewarded: number; earnings: number }
  referrals: ReferralRow[]
}

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Share your link',
    body: 'Send your personal link to anyone who wants to learn. It carries your code, so signups are credited to you automatically.',
  },
  {
    title: 'They join and learn',
    body: 'When someone creates an account with your link, they appear in your list below as a signed up student.',
  },
  {
    title: 'You earn 10%',
    body: 'When a referred student pays for their first order, 10% of what they paid is added to your referral earnings.',
  },
]

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/referrals')
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Could not load referrals')
        setData(json)
      } catch (err: any) {
        setError(err.message)
      }
    }
    load()
  }, [])

  const fullLink =
    data && typeof window !== 'undefined'
      ? `${window.location.origin}${data.link}`
      : ''

  const copyLink = async () => {
    if (!fullLink) return
    try {
      await navigator.clipboard.writeText(fullLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the field stays selectable by hand.
    }
  }

  const { brand } = useBrand()
  const orgName = brand?.display_name || 'IfaLode'
  const inviteText = `Join me on ${orgName} to learn Ifa wisdom through structured courses and live classes. Create your account here: ${fullLink}`

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-2 text-body font-medium text-cream-dim transition hover:text-cream"
      >
        <Icon name="back" size={18} />
        My learning
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-headline tracking-tight text-cream sm:text-display">
          Refer and earn
          <HelpTip text="You earn 10% of a referred student's first paid order. The money is added to your referral earnings here, and earnings are always shown in exact naira." />
        </h1>
        <p className="mt-2 max-w-xl text-body text-cream-dim">
          Share {orgName} with people who want to learn. When they join with
          your link and pay for their first order, you earn 10% of it.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-live/30 bg-live/10 px-5 py-4 text-body text-cream">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="space-y-4">
          <Skeleton className="h-[120px]" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
          </div>
          <Skeleton className="h-[220px]" />
        </div>
      )}

      {data && (
        <div className="animate-fade-up space-y-10">
          {/* Share card */}
          <section className="rounded-2xl border border-gold/25 bg-ink-850 p-5 shadow-card sm:p-6">
            <p className="text-caption font-bold uppercase tracking-wider text-gold">
              Your referral link
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                readOnly
                value={fullLink}
                onFocus={(e) => e.target.select()}
                aria-label="Your referral link"
                className="min-h-[48px] flex-1 rounded-xl border border-cream/10 bg-ink-950 px-4 text-body text-cream outline-none focus:border-gold/50"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                <Icon name={copied ? 'check' : 'share'} size={18} variant="Bold" />
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full border border-cream/15 px-5 text-body font-semibold text-cream transition hover:border-gold/50 hover:text-gold"
              >
                Share on WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(fullLink)}&text=${encodeURIComponent(`Join me on ${orgName} to learn Ifa wisdom through structured courses and live classes.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-full border border-cream/15 px-5 text-body font-semibold text-cream transition hover:border-gold/50 hover:text-gold"
              >
                Share on Telegram
              </a>
            </div>
            <p className="mt-4 text-caption text-cream-faint">
              Your code is{' '}
              <span className="font-bold tracking-wider text-cream">{data.code}</span>.
              Anyone who signs up through this link is counted as your referral.
            </p>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-cream/10 bg-ink-850 p-4 sm:p-5">
              <p className="flex items-center gap-1.5 text-meta font-bold uppercase tracking-wider text-cream-faint">
                <Icon name="people" size={14} />
                Signups
              </p>
              <p className="mt-2 font-display text-headline text-cream">
                {formatCompactCount(data.stats.signups)}
              </p>
            </div>
            <div className="rounded-2xl border border-cream/10 bg-ink-850 p-4 sm:p-5">
              <p className="flex items-center gap-1.5 text-meta font-bold uppercase tracking-wider text-cream-faint">
                <Icon name="award" size={14} />
                Rewarded
              </p>
              <p className="mt-2 font-display text-headline text-cream">
                {formatCompactCount(data.stats.rewarded)}
              </p>
            </div>
            <div className="rounded-2xl border border-cream/10 bg-ink-850 p-4 sm:p-5">
              <p className="text-meta font-bold uppercase tracking-wider text-cream-faint">
                Earnings
              </p>
              <Price
                amount={data.stats.earnings}
                className="mt-2 block text-headline text-gold"
              />
            </div>
          </section>

          {/* How it works */}
          <section>
            <SectionHeader title="How it works" />
            <ol className="grid gap-3 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-cream/10 bg-ink-850 p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-display text-lead text-gold">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-display text-lead text-cream">{step.title}</h3>
                  <p className="mt-1.5 text-body text-cream-dim">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Referral list */}
          <section>
            <SectionHeader title="Your referrals" />
            {data.referrals.length === 0 ? (
              <EmptyState
                title="No referrals yet"
                body="Share your link to see your students here. They appear as soon as they create an account."
              />
            ) : (
              <ul className="divide-y divide-cream/10 rounded-2xl border border-cream/10 bg-ink-850">
                {data.referrals.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-lead text-gold">
                        {row.referredName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-body font-semibold text-cream">
                          {row.referredName}
                        </p>
                        <p className="text-caption text-cream-faint">
                          Joined {formatDateTime(row.created_at)}
                        </p>
                      </div>
                    </div>
                    {row.status === 'rewarded' ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-caption font-bold text-success">
                        <Icon name="award" size={14} variant="Bold" />
                        Rewarded{' '}
                        {row.reward_amount != null
                          ? formatMoney(row.reward_amount)
                          : ''}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-cream/15 bg-cream/5 px-3 py-1.5 text-caption font-bold text-cream-dim">
                        Signed up
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
