'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { formatMoney } from '@/lib/format'

/** Short explainer for priced, gated, or stateful surfaces. Kijitech law:
    no such surface ships without one. Plain language, zero jargon. */
export function HelpTip({ text, label = 'What does this mean?' }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="ml-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-cream/25 text-[11px] font-bold text-cream-dim transition hover:border-gold hover:text-gold"
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 top-full z-40 mt-2 block w-56 -translate-x-1/2 rounded-xl border border-ink-600 bg-ink-800 p-3 text-left text-caption font-normal normal-case tracking-normal text-cream shadow-sheet">
          {text}
        </span>
      )}
    </span>
  )
}

/** Exact money, never compact. Free renders as a word, not a zero. */
export function Price({
  amount,
  className = '',
  currency,
}: {
  amount: number | null | undefined
  className?: string
  currency?: 'NGN' | 'USD'
}) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      {formatMoney(amount, currency)}
    </span>
  )
}

export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-live px-2 py-1 text-meta font-bold uppercase tracking-wider text-white ${className}`}
    >
      <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-white" />
      Live
    </span>
  )
}

export function LevelBadge({ level }: { level: string | null | undefined }) {
  const label = level ? level[0].toUpperCase() + level.slice(1) : 'All levels'
  return (
    <span className="inline-flex items-center rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-meta font-bold uppercase tracking-wider text-gold">
      {label}
    </span>
  )
}

export function ProgressBar({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={`h-[5px] w-full overflow-hidden rounded-full bg-cream/15 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gold transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function SectionHeader({
  title,
  href,
  actionLabel = 'See all',
  className = '',
}: {
  title: string
  href?: string
  actionLabel?: string
  className?: string
}) {
  return (
    <div className={`mb-3 flex items-end justify-between gap-4 ${className}`}>
      <h2 className="font-display text-title tracking-tight text-cream">{title}</h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-caption font-semibold text-gold transition hover:text-gold-light"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-ink-850 px-6 py-12 text-center">
      <h3 className="font-display text-title text-cream">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />
}

export function PosterFallback({
  title,
  className = '',
}: {
  title: string
  className?: string
}) {
  // Deterministic warm poster when a course has no cover image yet.
  // Real artwork still wins: this only stands in, it never replaces data.
  const hues = [28, 18, 38, 12, 45]
  const hue = hues[(title.length * 7) % hues.length]
  return (
    <div
      className={`flex items-end overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 42% 26%) 0%, hsl(${hue} 48% 14%) 62%, #14100d 100%)`,
      }}
      aria-hidden="true"
    >
      <span className="p-3 font-display text-lead leading-tight text-cream/90 line-clamp-3">
        {title}
      </span>
    </div>
  )
}
