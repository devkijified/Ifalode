// Kijitech number law: counts render compact, money always exact.

export function formatCompactCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '0'
  const abs = Math.abs(n)
  if (abs >= 1_000_000) {
    const v = n / 1_000_000
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, '')}M`
  }
  if (abs >= 1_000) {
    const v = n / 1_000
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(n)
}

/** Money is always exact, never compact. Defaults to naira, the house currency. */
export function formatMoney(
  amount: number | null | undefined,
  currency: 'NGN' | 'USD' = 'NGN'
): string {
  if (amount == null) return ''
  if (amount === 0) return 'Free'
  const symbol = currency === 'NGN' ? '₦' : '$'
  return `${symbol}${amount.toLocaleString('en-NG', {
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`
}

export function formatDuration(totalMinutes: number | null | undefined): string {
  if (!totalMinutes) return ''
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Starting now'
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return days === 1 ? 'Tomorrow' : `In ${days} days`
  }
  if (hours > 0) return `In ${hours}h ${mins % 60}m`
  return `In ${mins}m`
}
