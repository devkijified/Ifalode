'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type Service = {
  id: string
  title: string
  subtitle: string
  description: string
  price: string
  duration: string
  emoji: string
  highlights: string[]
  cta: string
  href: string
  popular?: boolean
}

export default function ServicesPage() {
  const { brand } = useBrand()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

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

  const services: Service[] = [
    {
      id: 'consultation',
      title: 'Ifá Consultation',
      subtitle: 'Divination & Guidance',
      description:
        'A full Ifá divination session to understand your situation, questions, and path forward. You will receive clear guidance, warnings, and recommendations based on the Odu that speak for you.',
      price: '[Your Price]',
      duration: '60–90 minutes',
      emoji: '📿',
      highlights: [
        'In-depth reading of your Odu',
        'Clarity on challenges and opportunities',
        'Spiritual recommendations and next steps',
        'Option for follow-up questions',
      ],
      cta: 'Book consultation',
      href: '/contact?service=consultation',
      popular: true,
    },
    {
      id: 'ritual',
      title: 'Ritual & Ceremony',
      subtitle: 'Offerings & Alignments',
      description:
        'Custom ritual work designed to restore balance, open the way, or support a specific intention. This may include offerings, prayers, and ceremonies aligned with your Odu and spiritual needs.',
      price: 'From [Your Price]',
      duration: 'Varies by ritual',
      emoji: '🕯️',
      highlights: [
        'Tailored to your situation and Odu',
        'Cleansing, opening, or stabilization work',
        'Clear explanation of purpose and process',
        'Guidance on aftercare and follow-up',
      ],
      cta: 'Request a ritual',
      href: '/contact?service=ritual',
    },
    {
      id: 'naming',
      title: 'Naming Ceremony',
      subtitle: 'For Children & New Beginnings',
      description:
        'Ifá naming and blessing ceremony for newborns, children, or new projects. We seek the right name and spiritual support to align the new life or endeavor with its destiny.',
      price: '[Your Price]',
      duration: '60–120 minutes',
      emoji: '👶',
      highlights: [
        'Divination to determine suitable names',
        'Blessings for the child or new venture',
        'Guidance for parents or initiators',
        'Optional written summary',
      ],
      cta: 'Inquire about naming',
      href: '/contact?service=naming',
    },
    {
      id: 'counseling',
      title: 'Spiritual Counseling',
      subtitle: 'Ongoing Support',
      description:
        'Ongoing spiritual guidance and check-ins for those who want continuous support on their path. This is not therapy, but a sacred space to discuss your journey in light of Ifá.',
      price: '[Your Price] / session',
      duration: '45–60 minutes',
      emoji: '🤝',
      highlights: [
        'Regular check-ins and guidance',
        'Support in implementing recommendations',
        'Clarification of signs and experiences',
        'A trusted spiritual companion',
      ],
      cta: 'Ask about counseling',
      href: '/contact?service=counseling',
    },
  ]

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
                <NavLink href="/services" active>
                  Services
                </NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>

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
                Services & Offerings
              </span>

            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[.98] font-black tracking-[-0.045em]">

              Guidance rooted in
              <br />
              <span className="text-brand-primary">
                the Ifá tradition.
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-400">

              As a priest of Ifá, Akinsoji Elebuibon offers consultations,
              rituals, and ceremonies to help you understand your path, restore
              balance, and walk in alignment with your destiny.

            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          SERVICES GRID
      ===================================================== */}

      <section className="pb-20 sm:pb-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid md:grid-cols-2 gap-5">

            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}

          </div>

          {/* Note / disclaimer */}
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6">

            <p className="text-sm text-slate-400">

              All services are offered with respect and confidentiality. Prices
              and availability may vary depending on the complexity of the work.
              If you are unsure which service is right for you, you can start
              with a consultation.

            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-slate-900/35 border-y border-slate-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-12 items-center">

            <div>

              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold mb-4">
                How it works
              </p>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Simple, respectful,
                <br />
                <span className="text-slate-500">
                  and clear from the start.
                </span>
              </h2>

            </div>

            <div className="grid sm:grid-cols-3 gap-6">

              <Step
                number="01"
                title="Reach out"
                text="Send a message describing your situation or questions."
              />

              <Step
                number="02"
                title="Agree on details"
                text="We confirm the type of service, timing, and offering."
              />

              <Step
                number="03"
                title="Receive guidance"
                text="You receive your reading, ritual, or ceremony with clear next steps."
              />

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          ABOUT PRIEST (SHORT)
      ===================================================== */}

      <section className="py-20 sm:py-28">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="relative rounded-[28px] overflow-hidden border border-slate-800 bg-slate-900">

            <div className="absolute top-0 right-0 w-[45%] h-full bg-brand-primary/5" />

            <div className="relative grid lg:grid-cols-[1fr_.8fr] items-center">

              <div className="p-7 sm:p-10 lg:p-14">

                <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                  About the priest
                </p>

                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Akinsoji Elebuibon
                  <br />
                  <span className="text-slate-500">
                    {PRIEST_TITLE}.
                  </span>
                </h2>

                <p className="mt-5 max-w-lg text-slate-500 leading-7">

                  Akinsoji Elebuibon is a priest of Ifá serving from Nigeria and
                  the USA. His work is dedicated to helping people understand
                  their destiny, make aligned choices, and live in harmony with
                  the wisdom of the Odu.

                </p>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  Learn more about Akinsoji
                  <span>→</span>
                </Link>

              </div>

              {/* Visual */}
              <div className="p-8 lg:p-12">

                <div className="relative mx-auto max-w-[300px] aspect-[.78] rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-7 shadow-2xl shadow-brand-primary/10 rotate-[-4deg]">

                  <div className="absolute inset-3 rounded-lg border border-white/15" />

                  <div className="relative h-full flex flex-col justify-between">

                    <div>

                      <p className="text-[9px] uppercase tracking-[.25em] text-white/60">
                        {brand?.display_name?.toUpperCase() || 'IFÁ'}
                      </p>

                      <div className="mt-12">

                        <p className="text-3xl font-black text-white leading-none">
                          WISDOM
                        </p>

                        <p className="text-3xl font-black text-white leading-none">
                          THROUGH
                        </p>

                        <p className="text-3xl font-black text-white leading-none">
                          THE ODU.
                        </p>

                      </div>

                    </div>

                    <p className="text-xs text-white/60">
                      {TRADITION}
                    </p>

                  </div>

                </div>

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

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      className={`group relative rounded-2xl border bg-slate-900 p-6 sm:p-7 transition ${
        service.popular
          ? 'border-brand-primary/40 shadow-lg shadow-brand-primary/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >

      {service.popular && (
        <div className="absolute -top-3 left-6 inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1">

          <span className="text-[10px] font-bold tracking-[.12em] text-brand-primary">
            MOST POPULAR
          </span>

        </div>
      )}

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-xl bg-brand-primary/10 flex items-center justify-center text-2xl">
            {service.emoji}
          </div>

          <div>

            <h3 className="text-xl font-bold">{service.title}</h3>

            <p className="text-sm text-slate-500">{service.subtitle}</p>

          </div>

        </div>

        <div className="text-right">

          <p className="text-sm font-bold text-slate-200">{service.price}</p>

          <p className="text-xs text-slate-500">{service.duration}</p>

        </div>

      </div>

      <p className="mt-5 text-sm leading-6 text-slate-400">

        {service.description}

      </p>

      <ul className="mt-5 space-y-2">

        {service.highlights.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">

            <span className="mt-1 text-brand-primary">•</span>

            <span>{point}</span>

          </li>
        ))}

      </ul>

      <div className="mt-6">

        <Link
          href={service.href}
          className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
        >
          {service.cta}
          <span>→</span>
        </Link>

      </div>

    </div>
  )
}

function Step({
  number,
  title,
  text,
}: {
  number: string
  title: string
  text: string
}) {
  return (
    <div className="relative">

      <p className="text-[10px] uppercase tracking-[.2em] text-brand-primary font-bold">

        {number}

      </p>

      <h3 className="mt-2 text-lg font-bold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>

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
