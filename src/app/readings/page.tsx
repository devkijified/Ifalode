'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PublicBar } from '@/components/shell/PublicBar'
import { Icon } from '@/components/ui/Icon'
import { HelpTip, SectionHeader } from '@/components/ui/primitives'
import { createClient } from '@/lib/supabase/client'

const READING_TYPES = [
  {
    id: 'ifa-consultation',
    title: 'Ifá Consultation',
    subtitle: 'Divination and guidance',
    body: 'A full consultation on a question or season of life: the Odu that speaks, what it asks of you, and the steps that follow.',
  },
  {
    id: 'ritual-ceremony',
    title: 'Ritual and Ceremony',
    subtitle: 'Offerings and alignments',
    body: 'Prescribed offerings and ceremonial work arising from a consultation, arranged and guided step by step.',
  },
  {
    id: 'naming-ceremony',
    title: 'Naming Ceremony',
    subtitle: 'For children and new beginnings',
    body: 'Traditional naming for a child or a new chapter, with the family guided through every part of the day.',
  },
  {
    id: 'spiritual-counseling',
    title: 'Spiritual Counseling',
    subtitle: 'Ongoing support',
    body: 'Continuing guidance over time for students and seekers walking the path with regular counsel.',
  },
] as const

const TIME_WINDOWS = ['Morning', 'Afternoon', 'Evening'] as const

export default function ReadingsPage() {
  const [selected, setSelected] = useState<string>('ifa-consultation')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [timeWindow, setTimeWindow] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [error, setError] = useState('')

  const active = READING_TYPES.find((r) => r.id === selected)!

  // A signed-in student books under their account: name and email come
  // from the profile, and the request can be tracked in their inbox.
  useEffect(() => {
    const supabase = createClient() as any
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) return
      setSignedIn(true)
      if (user.email) setEmail(user.email)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.full_name) setName(profile.full_name)
    })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const parts: string[] = []
      if (preferredDate || timeWindow) {
        const dateLabel = preferredDate
          ? new Date(`${preferredDate}T12:00:00`).toLocaleDateString('en-NG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'Any date'
        parts.push(
          `Preferred time: ${dateLabel} · ${timeWindow || 'Any time of day'}`
        )
      }
      parts.push(message.trim())

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Reading request: ${active.title}`,
          category: 'consultation',
          message: parts.join('\n\n'),
          guest_name: name.trim() || undefined,
          guest_email: email.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          data.error ||
            'Your request could not be sent. If you are signed in, your name and email are already on your account; otherwise both are required.'
        )
      }
      if (data.id) setTicketId(data.id)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="max-w-2xl">
          <h1 className="font-display text-display tracking-tight">Book a reading</h1>
          <p className="mt-3 text-lead text-cream-dim">
            Choose the kind of work you need, tell us briefly what brings you,
            and you will hear back with times and the fee for your session
            before anything is booked.
            <HelpTip text="Fees are confirmed in the reply before your session is arranged, so you always know the full cost before you commit to anything." />
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section aria-label="Reading types">
            <SectionHeader title="What do you need?" />
            <div className="space-y-3">
              {READING_TYPES.map((r) => {
                const isActive = r.id === selected
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r.id)}
                    aria-pressed={isActive}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      isActive
                        ? 'border-gold/60 bg-ink-850 shadow-glow'
                        : 'border-cream/10 bg-ink-850 hover:border-cream/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-display text-title tracking-tight text-cream">
                          {r.title}
                        </h2>
                        <p className="mt-0.5 text-caption font-semibold uppercase tracking-wider text-gold">
                          {r.subtitle}
                        </p>
                      </div>
                      <span
                        className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isActive
                            ? 'border-gold bg-gold text-ink-950'
                            : 'border-cream/25 text-transparent'
                        }`}
                      >
                        <Icon name="check" size={14} variant="Bold" />
                      </span>
                    </div>
                    <p className="mt-3 text-body text-cream-dim">{r.body}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-cream/10 bg-ink-850 p-5">
              <h2 className="font-display text-title tracking-tight">How it works</h2>
              <ol className="mt-4 space-y-4">
                {[
                  'Send your request with a few lines about what you need, and a day and time that suit you if you have one.',
                  'You get a reply confirming the time and the exact fee.',
                  'Your session holds in person or remotely, as arranged.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold font-display text-caption text-ink-950">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-body text-cream-dim">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section aria-label="Request form">
            <SectionHeader title="Your request" />
            {submitted ? (
              <div className="rounded-2xl border border-gold/30 bg-ink-850 px-6 py-12 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink-950 shadow-glow">
                  <Icon name="check" size={26} variant="Bold" />
                </span>
                <h2 className="mt-5 font-display text-title">Request received</h2>
                <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
                  {signedIn
                    ? `Your ${active.title} request is booked in. Replies land in your Support inbox, and you will get a notification when one arrives.`
                    : `Your ${active.title} request is with us. Watch your email for the confirmed time and the fee for your session.`}
                </p>
                {signedIn && ticketId ? (
                  <Link
                    href={`/dashboard/support/${ticketId}`}
                    className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                  >
                    Track your consultation
                  </Link>
                ) : (
                  <Link
                    href="/courses"
                    className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light"
                  >
                    Browse courses while you wait
                  </Link>
                )}
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6"
              >
                <p className="text-body text-cream-dim">
                  Requesting: <span className="font-semibold text-cream">{active.title}</span>
                </p>
                <div className="mt-5 space-y-4">
                  {!signedIn && (
                    <>
                      <div>
                        <label htmlFor="rd-name" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-cream-dim">
                          Your name
                        </label>
                        <input
                          id="rd-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="rd-email" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-cream-dim">
                          Email
                        </label>
                        <input
                          id="rd-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="The reply comes to this email"
                          className="w-full rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rd-date" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-cream-dim">
                        Preferred day
                      </label>
                      <input
                        id="rd-date"
                        type="date"
                        min={today}
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="rd-window" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-cream-dim">
                        Time of day
                      </label>
                      <select
                        id="rd-window"
                        value={timeWindow}
                        onChange={(e) => setTimeWindow(e.target.value)}
                        className="w-full rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Any time</option>
                        {TIME_WINDOWS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="rd-message" className="mb-2 block text-caption font-semibold uppercase tracking-wider text-cream-dim">
                      What brings you?
                    </label>
                    <textarea
                      id="rd-message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="A few lines is enough. You can share more during the session itself."
                      className="w-full rounded-xl border border-cream/10 bg-ink-900 px-4 py-3 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>
                {error && (
                  <p className="mt-4 rounded-xl border border-live/40 bg-live/10 px-4 py-3 text-body text-cream">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gold text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                >
                  <Icon name="send" size={18} variant="Bold" />
                  {submitting ? 'Sending...' : 'Send request'}
                </button>
                <p className="mt-3 text-center text-caption text-cream-faint">
                  {signedIn
                    ? 'This request attaches to your account, so you can follow the reply under Support in My learning.'
                    : 'Have an account? Sign in first and you can follow the reply inside the app as well.'}
                </p>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
