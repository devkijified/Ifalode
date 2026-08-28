'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

type User = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

export default function ContactPage() {
  const { brand } = useBrand()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    location: '',
    service: searchParams.get('service') || 'consultation',
    message: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted) {
        setUser(user as User | null)
        setLoading(false)
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user as User | null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', close)

    return () => {
      document.removeEventListener('mousedown', close)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setAccountOpen(false)
    setUser(null)
    router.refresh()
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member'

  const firstName = displayName.split(' ')[0]

  const avatar =
    user?.user_metadata?.avatar_url ||
    null

  const PRIEST_NAME = 'Akinsoji Elebuibon'
  const PRIEST_TITLE = 'Ifá Priest'
  const TRADITION = 'Yoruba / Ifá tradition'
  const LOCATION = 'Nigeria, USA'

  // TODO: Replace with your real contact details
  const CONTACT_EMAIL = 'your-email@example.com'
  const CONTACT_WHATSAPP = '+234 XXX XXX XXXX'
  const CONTACT_WHATSAPP_LINK = 'https://wa.me/234XXXXXXXXXX'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSubmitted(false)

    try {
      // TODO: Replace with your actual API / server action
      // Example: await fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })

      // Simulate network delay
      await new Promise((res) => setTimeout(res, 800))

      setSubmitted(true)
      setForm({
        name: '',
        email: '',
        location: '',
        service: 'consultation',
        message: '',
      })
    } catch (err) {
      setError('Something went wrong. Please try again or send a message directly via email or WhatsApp.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed top-0 inset-x-0 z-50">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">

          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/10">

            <div className="h-full px-5 flex items-center justify-between">

              {/* Logo */}
              <Link
                href="/"
                className="shrink-0 text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              {/* Desktop navigation */}
              <div className="hidden lg:flex items-center gap-8 ml-10">

                <NavLink href="/">Home</NavLink>
                <NavLink href="/teachings">Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact" active>
                  Contact
                </NavLink>

              </div>

              {/* Right */}
              <div className="flex items-center gap-2 sm:gap-3">

                <Link
                  href="/resources"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Resources"
                >
                  📿
                </Link>

                {!loading && !user && (
                  <>
                    <Link
                      href="/login"
                      className="hidden sm:inline-flex px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-brand-primary/10"
                    >
                      Get Updates
                    </Link>
                  </>
                )}

                {!loading && user && (
                  <div ref={accountRef} className="relative">

                    <button
                      onClick={() => setAccountOpen(!accountOpen)}
                      className="flex items-center gap-2.5 rounded-xl pl-2 pr-2 py-1.5 hover:bg-slate-800 transition"
                    >

                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-sm font-bold">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">
                        {firstName}
                      </span>

                      <span
                        className={`text-slate-500 text-xs transition-transform ${
                          accountOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ▾
                      </span>

                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">

                        <div className="px-4 py-4 border-b border-slate-800">

                          <p className="text-sm font-semibold text-white truncate">
                            {displayName}
                          </p>

                          <p className="text-xs text-slate-500 truncate mt-1">
                            {user.email}
                          </p>

                        </div>

                        <div className="p-2">

                          <AccountLink
                            href="/dashboard"
                            icon="⌂"
                            label="Dashboard"
                          />

                          <AccountLink
                            href="/readings"
                            icon="📿"
                            label="My Readings"
                          />

                          <AccountLink
                            href="/profile"
                            icon="◉"
                            label="Profile"
                          />

                          <AccountLink
                            href="/settings"
                            icon="⚙"
                            label="Settings"
                          />

                          <div className="my-2 border-t border-slate-800" />

                          <button
                            onClick={signOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition"
                          >
                            <span>↪</span>
                            Sign Out
                          </button>

                        </div>

                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </nav>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative pt-36 pb-16 sm:pt-44 sm:pb-20">

        {/* ambient background */}
        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-20 left-[5%] w-72 h-72 rounded-full bg-brand-primary/10 blur-[120px]" />

          <div className="absolute top-40 right-[5%] w-96 h-96 rounded-full bg-brand-secondary/10 blur-[140px]" />

          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />

        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3.5 py-2 mb-7">

              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />

              <span className="text-xs font-semibold text-brand-primary">
                Get in touch
              </span>

            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[.98] font-black tracking-[-0.045em]">

              Reach out for
              <br />
              <span className="text-brand-primary">
                guidance and support.
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-400">

              If you have questions about a reading, ritual, or your spiritual
              path, you can send a message below or contact Akinsoji Elebuibon
              directly via email or WhatsApp.

            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONTACT CONTENT
      ===================================================== */}

      <section className="pb-20 sm:pb-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[1fr_1fr] gap-10">

            {/* Left: Contact info */}
            <div>

              <h2 className="text-2xl sm:text-3xl font-bold">

                Contact information

              </h2>

              <p className="mt-3 text-slate-400">

                You can reach out using any of the options below. For new
                inquiries, the form on this page is usually the fastest way to
                get a response.

              </p>

              <div className="mt-6 space-y-4">

                <ContactInfoRow
                  emoji="✉️"
                  label="Email"
                  value={CONTACT_EMAIL}
                  href={`mailto:${CONTACT_EMAIL}`}
                />

                <ContactInfoRow
                  emoji="💬"
                  label="WhatsApp"
                  value={CONTACT_WHATSAPP}
                  href={CONTACT_WHATSAPP_LINK}
                />

                <ContactInfoRow
                  emoji="🌍"
                  label="Location"
                  value={LOCATION}
                  href={undefined}
                />

              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">

                <p className="text-sm text-slate-400">

                  When you write, please include a brief description of your
                  situation, what you are seeking help with, and your time zone.
                  This helps Akinsoji understand how best to support you.

                </p>

              </div>

            </div>


            {/* Right: Contact form */}
            <div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">

                <h3 className="text-lg font-bold">Send a message</h3>

                {submitted && (
                  <div className="mt-4 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4">

                    <p className="text-sm text-slate-200">

                      Thank you. Your message has been sent. Akinsoji or the
                      team will get back to you as soon as possible.

                    </p>

                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                    <p className="text-sm text-red-200">{error}</p>

                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">

                  <div>

                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold text-slate-400 mb-1"
                    >
                      Name
                    </label>

                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      placeholder="Your full name"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-400 mb-1"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      placeholder="you@example.com"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="location"
                      className="block text-xs font-semibold text-slate-400 mb-1"
                    >
                      Location (city & country)
                    </label>

                    <input
                      id="location"
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, location: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      placeholder="Lagos, Nigeria"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="service"
                      className="block text-xs font-semibold text-slate-400 mb-1"
                    >
                      Service interested in
                    </label>

                    <select
                      id="service"
                      value={form.service}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, service: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                    >

                      <option value="consultation">
                        Ifá Consultation
                      </option>

                      <option value="ritual">
                        Ritual & Ceremony
                      </option>

                      <option value="naming">
                        Naming Ceremony
                      </option>

                      <option value="counseling">
                        Spiritual Counseling
                      </option>

                      <option value="other">
                        Other / Not sure
                      </option>

                    </select>

                  </div>

                  <div>

                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold text-slate-400 mb-1"
                    >
                      Message
                    </label>

                    <textarea
                      id="message"
                      required
                      value={form.message}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, message: e.target.value }))
                      }
                      rows={5}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                      placeholder="Briefly describe your situation, questions, and what you hope to achieve."
                    />

                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >

                    {submitting ? 'Sending…' : 'Send message'}

                    <span>→</span>

                  </button>

                </form>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-900 bg-slate-950">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

            <div className="lg:col-span-2">

              <Link
                href="/"
                className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent"
              >
                {brand?.display_name || PRIEST_NAME}
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
                A spiritual home for Ifá teachings, consultations, and resources
                rooted in the {TRADITION}.
              </p>

            </div>

            <FooterColumn
              title="Explore"
              links={[
                ['Teachings', '/teachings'],
                ['Services', '/services'],
                ['Resources', '/resources'],
                ['About', '/about'],
              ]}
            />

            <FooterColumn
              title="Account"
              links={[
                ['Dashboard', '/dashboard'],
                ['Readings', '/readings'],
                ['Profile', '/profile'],
                ['Settings', '/settings'],
              ]}
            />

          </div>

          <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between gap-3">

            <p className="text-xs text-slate-700">
              © {new Date().getFullYear()} {brand?.display_name || PRIEST_NAME}.
              All rights reserved.
            </p>

            <div className="flex gap-5">

              <Link
                href="/privacy"
                className="text-xs text-slate-700 hover:text-slate-400 transition"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs text-slate-700 hover:text-slate-400 transition"
              >
                Terms
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}


/* =========================================================
   COMPONENTS
========================================================= */

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`text-sm transition ${
        active
          ? 'text-white font-semibold'
          : 'text-slate-500 hover:text-white'
      }`}
    >
      {children}
    </Link>
  )
}

function AccountLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  )
}

function ContactInfoRow({
  emoji,
  label,
  value,
  href,
}: {
  emoji: string
  label: string
  value: string
  href?: string
}) {
  const content = (
    <div className="flex items-start gap-3">

      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-lg shrink-0">

        {emoji}

      </div>

      <div>

        <p className="text-xs font-semibold text-slate-500">{label}</p>

        <p className="text-sm text-slate-200">{value}</p>

      </div>

    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition"
      >

        {content}

      </a>
    )
  }

  return (
    <div className="block rounded-xl border border-slate-800 bg-slate-900/50 p-4">

      {content}

    </div>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: [string, string][]
}) {
  return (
    <div>

      <h4 className="text-xs uppercase tracking-[.15em] text-slate-500 font-bold">

        {title}

      </h4>

      <div className="mt-4 space-y-3">

        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="block text-sm text-slate-700 hover:text-slate-300 transition"
          >

            {label}

          </Link>
        ))}

      </div>

    </div>
  )
}
