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

// TODO: Replace these with your details
const PRIEST_NAME = 'Babalawo Akinsoji Elebuibon'
const PRIEST_TITLE = 'Ifá Priest'
const TRADITION = 'Yoruba / Ifá tradition'
const LOCATION = 'Nigeria, USA'

const NAV_LINKS: [string, string][] = [
  ['Home', '/'],
  ['Teachings', '/teachings'],
  ['Services', '/services'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

// brand_settings.display_name defaults to the literal string "IfaLode" in the
// database — that's a placeholder, not a real choice, so it should never
// outrank the priest's actual name. Only trust it once it's been changed.
function resolveSiteName(displayName: string | null | undefined) {
  const trimmed = displayName?.trim()
  if (!trimmed || trimmed.toLowerCase() === 'ifalode') return PRIEST_NAME
  return trimmed
}

export default function HomePage() {
  const { brand } = useBrand()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const accountRef = useRef<HTMLDivElement>(null)

  const siteName = resolveSiteName(brand?.display_name)

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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

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
  const avatar = user?.user_metadata?.avatar_url || null

  return (
    <main className="min-h-screen bg-[#14100D] text-[#F3ECE0]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

        html {
          scroll-behavior: smooth;
        }

        .font-display {
          font-family: 'Instrument Serif', Georgia, serif;
        }

        @keyframes rim-draw {
          from {
            stroke-dashoffset: 720;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        .rim-draw {
          stroke-dasharray: 720;
          animation: rim-draw 1.6s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .rim-draw {
            animation: none;
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#F3ECE0]/10 bg-[#14100D]/92 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <nav className="h-[64px] flex items-center justify-between">
            <Link href="/" className="shrink-0 flex items-center gap-2.5">
              <OduMark
                pattern={[1, 0, 1]}
                className="w-4 h-6 text-brand-secondary"
              />

              <span className="font-display text-xl sm:text-2xl tracking-tight text-[#F3ECE0]">
                {siteName}
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-9 ml-10">
              {NAV_LINKS.map(([label, href]) => (
                <NavLink key={href} href={href} active={href === '/'}>
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/resources"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-[#A99A87] hover:text-[#F3ECE0] hover:bg-[#F3ECE0]/5 transition"
                title="Resources"
              >
                <IconScroll className="w-[18px] h-[18px]" />
              </Link>

              {!loading && !user && (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex px-4 py-2 text-sm text-[#A99A87] hover:text-[#F3ECE0] transition"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/register"
                    className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-brand-secondary text-[#14100D] text-sm font-semibold hover:opacity-90 transition"
                  >
                    Get updates
                  </Link>
                </>
              )}

              {!loading && user && (
                <div
                  ref={accountRef}
                  className="relative hidden sm:block"
                >
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    className="flex items-center gap-2.5 rounded-full pl-2 pr-3 py-1.5 hover:bg-[#F3ECE0]/5 transition"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-brand-secondary/40 flex items-center justify-center text-sm font-display text-brand-secondary">
                        {firstName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="text-sm max-w-[100px] truncate">
                      {firstName}
                    </span>
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-[#F3ECE0]/10 bg-[#1E1712] shadow-2xl overflow-hidden">
                      <div className="px-4 py-4 border-b border-[#F3ECE0]/10">
                        <p className="text-sm font-semibold text-[#F3ECE0] truncate">
                          {displayName}
                        </p>

                        <p className="text-xs text-[#A99A87] truncate mt-1">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-2">
                        <AccountLink
                          href="/dashboard"
                          label="Dashboard"
                          icon={<IconHome className="w-[17px] h-[17px]" />}
                        />

                        <AccountLink
                          href="/readings"
                          label="My readings"
                          icon={<IconMark className="w-[17px] h-[17px]" />}
                        />

                        <AccountLink
                          href="/profile"
                          label="Profile"
                          icon={<IconUser className="w-[17px] h-[17px]" />}
                        />

                        <AccountLink
                          href="/settings"
                          label="Settings"
                          icon={<IconSettings className="w-[17px] h-[17px]" />}
                        />

                        <div className="my-2 border-t border-[#F3ECE0]/10" />

                        <button
                          onClick={signOut}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition"
                        >
                          <IconLogout className="w-[17px] h-[17px]" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-[#F3ECE0] hover:bg-[#F3ECE0]/5 transition"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <IconMenu className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-[#0C0906]/90 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        <div
          className={`absolute inset-y-0 right-0 w-[86%] max-w-sm bg-[#1A1410] border-l border-[#F3ECE0]/10 flex flex-col transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-[64px] px-5 flex items-center justify-between border-b border-[#F3ECE0]/10">
            <div className="flex items-center gap-2.5">
              <OduMark
                pattern={[1, 0, 1]}
                className="w-4 h-6 text-brand-secondary"
              />

              <span className="font-display text-lg text-[#F3ECE0]">
                {siteName}
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-9 h-9 rounded-full text-[#A99A87] hover:text-[#F3ECE0] hover:bg-[#F3ECE0]/5 transition"
              aria-label="Close menu"
            >
              <IconClose className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-6">
            <div className="flex flex-col">
              {NAV_LINKS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-4 border-b border-[#F3ECE0]/10 font-display text-2xl text-[#F3ECE0]"
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/resources"
                onClick={() => setMobileMenuOpen(false)}
                className="py-4 border-b border-[#F3ECE0]/10 font-display text-2xl text-[#F3ECE0]"
              >
                Resources
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {!loading && !user && (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center px-5 py-3.5 rounded-full bg-brand-secondary text-[#14100D] font-semibold text-sm"
                  >
                    Get updates
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center justify-center px-5 py-3.5 rounded-full border border-[#F3ECE0]/15 text-[#F3ECE0] font-semibold text-sm"
                  >
                    Sign in
                  </Link>
                </>
              )}

              {!loading && user && (
                <>
                  <div className="flex items-center gap-3 px-1 py-2">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-brand-secondary/40 flex items-center justify-center font-display text-brand-secondary">
                        {firstName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-[#F3ECE0]">
                        {displayName}
                      </p>

                      <p className="text-xs text-[#A99A87]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <MobileAccountLink
                    href="/dashboard"
                    label="Dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  />

                  <MobileAccountLink
                    href="/readings"
                    label="My readings"
                    onClick={() => setMobileMenuOpen(false)}
                  />

                  <MobileAccountLink
                    href="/profile"
                    label="Profile"
                    onClick={() => setMobileMenuOpen(false)}
                  />

                  <MobileAccountLink
                    href="/settings"
                    label="Settings"
                    onClick={() => setMobileMenuOpen(false)}
                  />

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="mt-2 inline-flex items-center justify-center px-5 py-3.5 rounded-full border border-red-500/20 text-red-400 font-semibold text-sm"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-14 lg:gap-16 items-center">
            <div>
              <p className="flex items-center gap-2 text-sm text-brand-secondary mb-6">
                <OduMark pattern={[0, 1]} className="w-3 h-4" />
                Ifá · wisdom · guidance
              </p>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[.96] tracking-tight text-[#F3ECE0]">
                I am {PRIEST_NAME.split(' ')[0]},
                <br />
                {PRIEST_TITLE.toLowerCase()} and
                <br />
                keeper of the{' '}
                <span className="italic text-brand-secondary">
                  {TRADITION}
                </span>
                .
              </h1>

              <p className="mt-7 max-w-md text-base sm:text-lg leading-8 text-[#A99A87]">
                This is my space for sharing teachings, offerings, and guidance
                from the Ifá tradition — wisdom, rituals, and ways to walk a
                more aligned path.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-9">
                <Link
                  href="/teachings"
                  className="inline-flex items-center px-6 py-3.5 rounded-full bg-brand-secondary text-[#14100D] font-semibold text-sm hover:opacity-90 transition"
                >
                  Explore teachings
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center px-6 py-3.5 rounded-full border border-[#F3ECE0]/15 text-[#F3ECE0] font-semibold text-sm hover:bg-[#F3ECE0]/5 transition"
                >
                  View services
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-8 mt-12 pt-7 border-t border-[#F3ECE0]/10">
                <MiniStat
                  value="Teachings"
                  label="Wisdom & insights"
                />

                <MiniStat
                  value="Services"
                  label="Readings & rituals"
                />

                <MiniStat
                  value="Resources"
                  label="Prayers & guides"
                />
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    <path
                      id="rimPath"
                      d="M150,150 m-124,0 a124,124 0 1,1 248,0 a124,124 0 1,1 -248,0"
                    />
                  </defs>

                  <circle
                    cx="150"
                    cy="150"
                    r="145"
                    fill="none"
                    stroke="#F3ECE0"
                    strokeOpacity="0.06"
                  />

                  <circle
                    cx="150"
                    cy="150"
                    r="124"
                    fill="none"
                    stroke="currentColor"
                    className="text-brand-secondary/60 rim-draw"
                    strokeWidth="1.2"
                  />

                  <circle
                    cx="150"
                    cy="150"
                    r="96"
                    fill="none"
                    stroke="#F3ECE0"
                    strokeOpacity="0.08"
                  />

                  <text
                    fontSize="10.5"
                    letterSpacing="2.5"
                    fill="#A99A87"
                  >
                    <textPath href="#rimPath" startOffset="0%">
                      wisdom of the odù &nbsp;&nbsp;&nbsp; wisdom of the odù
                      &nbsp;&nbsp;&nbsp;
                    </textPath>
                  </text>

                  <g transform="translate(150,150)">
                    <foreignObject
                      x="-60"
                      y="-46"
                      width="120"
                      height="92"
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <OduMark
                          pattern={[1, 0, 1, 1]}
                          className="w-9 h-12 text-[#F3ECE0]"
                        />

                        <span className="font-display italic text-sm text-[#A99A87]">
                          Ògúndá Méjì
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                </svg>

                <div className="absolute -bottom-4 -left-4 rounded-xl border-t-2 border-brand-accent bg-[#1E1712] px-4 py-3 shadow-xl">
                  <p className="text-[11px] text-[#A99A87]">
                    Serving from
                  </p>

                  <p className="text-sm font-semibold text-[#F3ECE0]">
                    {LOCATION}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT I OFFER
      ===================================================== */}

      <section className="py-20 sm:py-28 border-t border-[#F3ECE0]/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[.65fr_1.35fr] gap-10 items-end mb-12">
            <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#F3ECE0]">
              Guidance rooted in the Ifá tradition
            </h2>

            <p className="max-w-xl text-[#A99A87] leading-7">
              As a priest of Ifá, I offer consultations, rituals, and teachings
              grounded in the wisdom of the Odù. Everything here is intended
              to support clarity, alignment, and spiritual growth.
            </p>
          </div>

          <div className="border-t border-[#F3ECE0]/10">
            <OfferRow
              mark={[1, 1]}
              title="Consultations"
              text="Ifá divination and guidance to help you understand your path and choices."
            />

            <OfferRow
              mark={[0, 1]}
              title="Rituals"
              text="Ceremonies and offerings designed to restore balance and open the way."
            />

            <OfferRow
              mark={[1, 0]}
              title="Teachings"
              text="Lessons on the Odù, ethics, and living in harmony with your destiny."
            />

            <OfferRow
              mark={[0, 0]}
              title="Resources"
              text="Prayers, guides, and references to support your spiritual practice."
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          RECENT TEACHINGS
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-[#1A1410] border-y border-[#F3ECE0]/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <SectionHeading
            title="Recent insights and lessons"
            description="Selections from ongoing teachings on the Odù, ethics, and spiritual living."
            action="View all teachings"
            href="/teachings"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            <TeachingCard
              category="Lesson"
              title="On understanding your Orí"
              description="Exploring the role of the inner head in destiny, choices, and spiritual alignment."
              date="Aug 2026"
              href="/teachings"
            />

            <TeachingCard
              category="Insight"
              title="Living with Ire"
              description="What it means to walk in goodness, and how to cultivate ire in daily life."
              date="Jul 2026"
              href="/teachings"
            />

            <TeachingCard
              category="Lesson"
              title="The language of the Odù"
              description="How the Odù speak through signs, stories, and patterns in your life."
              date="Jun 2026"
              href="/teachings"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          ODÙ MARQUEE
      ===================================================== */}

      <OduMarquee />

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[1fr_.75fr] gap-12 items-center rounded-3xl border border-[#F3ECE0]/10 bg-[#1E1712] p-8 sm:p-12 lg:p-16">
            <div>
              <p className="text-sm text-brand-secondary mb-4">
                Services
              </p>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#F3ECE0]">
                Readings and rituals for clarity and alignment
              </h2>

              <p className="mt-5 max-w-lg text-[#A99A87] leading-7">
                If you are seeking guidance, healing, or direction, I offer
                Ifá consultations and ritual work tailored to your situation
                and questions.
              </p>

              <Link
                href="/services"
                className="inline-flex items-center mt-8 px-5 py-3 rounded-full bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition"
              >
                Book a consultation
              </Link>
            </div>

            <div className="relative mx-auto max-w-[260px]">
              <div className="rounded-2xl border border-[#F3ECE0]/15 bg-[#14100D] p-6 -rotate-3">
                <OduMark
                  pattern={[1, 0, 0, 1]}
                  className="w-10 h-14 text-brand-secondary mb-6"
                />

                <p className="font-display italic text-2xl leading-tight text-[#F3ECE0]">
                  Clarity through the Odù
                </p>

                <p className="mt-6 text-xs text-[#A99A87] border-t border-[#F3ECE0]/10 pt-4">
                  Consultations &amp; rituals
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <FaqSection />

      {/* =====================================================
          ABOUT PRIEST
      ===================================================== */}

      <section className="py-20 sm:py-28 bg-[#1A1410] border-y border-[#F3ECE0]/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[.7fr_1.3fr] gap-14 items-center">
            <div className="mx-auto lg:mx-0 w-full max-w-[320px] aspect-square rounded-full border border-[#F3ECE0]/15 flex items-center justify-center p-3">
              <div className="w-full h-full rounded-full border border-brand-secondary/30 flex flex-col items-center justify-center text-center p-8">
                <span className="font-display text-5xl text-brand-secondary">
                  {PRIEST_NAME.split(' ')[1]?.charAt(0) || 'I'}
                </span>

                <p className="mt-5 text-sm text-brand-secondary">
                  {siteName}
                </p>

                <h3 className="font-display italic text-lg mt-2 text-[#F3ECE0] leading-snug">
                  {PRIEST_TITLE} · {LOCATION}
                </h3>
              </div>
            </div>

            <div>
              <p className="text-sm text-brand-secondary mb-4">
                About the priest
              </p>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight text-[#F3ECE0]">
                A spiritual home grounded in Ifá
              </h2>

              <p className="mt-6 text-[#A99A87] leading-8 max-w-xl">
                I am {PRIEST_NAME}, a priest of Ifá serving from {LOCATION}. My
                work is dedicated to helping people understand their destiny,
                make aligned choices, and live in harmony with the wisdom of
                the Odù. This site is an extension of that service.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-8">
                <SimpleLink title="About me" href="/about" />
                <SimpleLink title="All teachings" href="/teachings" />
                <SimpleLink title="Services" href="/services" />
                <SimpleLink title="Contact" href="/contact" />
              </div>

              <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-[#F3ECE0]/10">
                <StatCounter
                  target={12}
                  suffix="+"
                  label="Years in practice"
                />

                <StatCounter
                  target={400}
                  suffix="+"
                  label="Consultations given"
                />

                <StatCounter
                  target={30}
                  suffix="+"
                  label="Students taught"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PERSONALIZED MEMBER SECTION
      ===================================================== */}

      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {user ? (
            <div className="rounded-3xl border border-[#F3ECE0]/10 bg-[#1E1712] p-8 sm:p-12">
              <p className="text-sm text-brand-secondary">
                Welcome back
              </p>

              <h2 className="mt-3 font-display text-3xl sm:text-4xl text-[#F3ECE0]">
                Good to see you, {firstName}.
              </h2>

              <p className="mt-3 text-[#A99A87]">
                Continue your spiritual journey or explore new teachings.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mt-8">
                <MemberAction
                  title="Latest teachings"
                  text="Read recent lessons"
                  href="/teachings"
                />

                <MemberAction
                  title="My readings"
                  text="View your consultations"
                  href="/readings"
                />

                <MemberAction
                  title="Services"
                  text="Book a reading or ritual"
                  href="/services"
                />
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-[#3A2A1C] p-8 sm:p-14">
              <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                <div>
                  <p className="text-sm text-brand-secondary">
                    Stay connected
                  </p>

                  <h2 className="mt-3 font-display text-3xl sm:text-4xl text-[#F3ECE0]">
                    New teachings and insights, shared regularly
                  </h2>

                  <p className="mt-4 text-[#F3ECE0]/70 max-w-xl leading-7">
                    Create a free account to receive updates when new
                    teachings, resources, or service offerings are published.
                  </p>
                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-[#F3ECE0] text-[#14100D] text-sm font-bold hover:bg-white transition whitespace-nowrap"
                >
                  Create your account
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-[#F3ECE0]/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <OduMark
                  pattern={[1, 0, 1]}
                  className="w-4 h-6 text-brand-secondary"
                />

                <span className="font-display text-2xl text-[#F3ECE0]">
                  {siteName}
                </span>
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-[#A99A87]">
                A spiritual home for Ifá teachings, consultations, and
                resources rooted in the {TRADITION}.
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

          <div className="mt-12 pt-6 border-t border-[#F3ECE0]/10 flex flex-col sm:flex-row justify-between gap-3">
            <p className="text-xs text-[#A99A87]/60">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>

            <div className="flex gap-5">
              <Link
                href="/privacy"
                className="text-xs text-[#A99A87]/60 hover:text-[#A99A87] transition"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-xs text-[#A99A87]/60 hover:text-[#A99A87] transition"
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
   DECORATIVE MARK
========================================================= */

function OduMark({
  pattern,
  className = '',
}: {
  pattern: (0 | 1)[]
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 40 56"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {pattern.map((mark, col) => {
        const x =
          4 + col * (32 / Math.max(pattern.length - 1, 1))

        return mark ? (
          <line
            key={col}
            x1={x}
            y1="4"
            x2={x}
            y2="52"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        ) : (
          <g key={col}>
            <line
              x1={x - 1.6}
              y1="4"
              x2={x - 1.6}
              y2="52"
              stroke="currentColor"
              strokeWidth="2.2"
            />

            <line
              x1={x + 1.6}
              y1="4"
              x2={x + 1.6}
              y2="52"
              stroke="currentColor"
              strokeWidth="2.2"
            />
          </g>
        )
      })}
    </svg>
  )
}

/* =========================================================
   ODÙ MARQUEE
========================================================= */

function OduMarquee() {
  const names = [
    'Èjì Ogbè',
    'Ọ̀yẹ̀kú Méjì',
    'Ìwòrì Méjì',
    'Òdí Méjì',
    'Ìrosùn Méjì',
    'Ọ̀wọ́nrín Méjì',
    'Ọ̀bàrà Méjì',
    'Ọ̀kànràn Méjì',
  ]

  return (
    <div className="relative py-8 border-y border-[#F3ECE0]/10 overflow-hidden">
      <div className="marquee-track flex w-max">
        <div className="flex items-center gap-12 shrink-0 pr-12">
          {names.map((name, i) => (
            <span
              key={`first-${i}`}
              className="font-display italic text-2xl text-[#A99A87]/70 shrink-0"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-12 shrink-0 pr-12">
          {names.map((name, i) => (
            <span
              key={`second-${i}`}
              className="font-display italic text-2xl text-[#A99A87]/70 shrink-0"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#14100D] to-transparent" />

      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#14100D] to-transparent" />

      <style jsx>{`
        .marquee-track {
          animation: odu-marquee 28s linear infinite;
          will-change: transform;
        }

        @keyframes odu-marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

/* =========================================================
   ANIMATED STAT COUNTER
========================================================= */

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current

    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true

          const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
          ).matches

          if (prefersReduced) {
            setValue(target)
            return
          }

          const start = performance.now()

          const tick = (now: number) => {
            const progress = Math.min(
              (now - start) / durationMs,
              1,
            )

            const eased = 1 - Math.pow(1 - progress, 3)

            setValue(Math.round(eased * target))

            if (progress < 1) {
              requestAnimationFrame(tick)
            }
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [target, durationMs])

  return { value, ref }
}

function StatCounter({
  target,
  suffix = '',
  label,
}: {
  target: number
  suffix?: string
  label: string
}) {
  const { value, ref } = useCountUp(target)

  return (
    <div ref={ref}>
      <p className="font-display text-4xl sm:text-5xl text-[#F3ECE0]">
        {value}
        {suffix}
      </p>

      <p className="mt-2 text-sm text-[#A99A87]">
        {label}
      </p>
    </div>
  )
}

/* =========================================================
   FAQ
========================================================= */

function FaqItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#F3ECE0]/10 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg sm:text-xl text-[#F3ECE0]">
          {question}
        </span>

        <span
          className={`shrink-0 w-6 h-6 flex items-center justify-center text-brand-secondary transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="w-4 h-4"
          >
            <path
              d="M12 5v14M5 12h14"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <p className="pt-4 text-sm leading-6 text-[#A99A87] max-w-xl">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function FaqSection() {
  const faqs = [
    {
      q: 'What happens during a consultation?',
      a: 'We begin with Ifá divination to identify the Odù that speaks to your situation, then discuss what it means for the questions you bring.',
    },
    {
      q: 'How should I prepare?',
      a: 'Come with a clear question or intention in mind. No special preparation is required beyond an open, honest heart.',
    },
    {
      q: 'Do you offer remote consultations?',
      a: 'Yes — readings and guidance are available both in person and remotely, depending on your location and the nature of the work.',
    },
    {
      q: 'What if I need a ritual or ceremony?',
      a: 'After a reading, we discuss whether ritual work is called for, what it involves, and how to prepare for it.',
    },
  ]

  return (
    <section className="py-20 sm:py-28 border-t border-[#F3ECE0]/10">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <p className="text-sm text-brand-secondary mb-4">
          Common questions
        </p>

        <h2 className="font-display text-3xl sm:text-4xl text-[#F3ECE0] mb-8">
          Before you book a reading
        </h2>

        <div>
          {faqs.map((f) => (
            <FaqItem
              key={f.q}
              question={f.q}
              answer={f.a}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   SHARED UI HELPERS
========================================================= */

function NavLink({
  href,
  active = false,
  children,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative text-sm transition ${
        active
          ? 'text-[#F3ECE0]'
          : 'text-[#A99A87] hover:text-[#F3ECE0]'
      }`}
    >
      {children}

      {active && (
        <span className="absolute -bottom-2 left-0 right-0 mx-auto h-px bg-brand-secondary" />
      )}
    </Link>
  )
}

function SectionHeading({
  title,
  description,
  action,
  href,
}: {
  title: string
  description: string
  action?: string
  href?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
      <div>
        <p className="text-sm text-brand-secondary mb-4">
          Teachings
        </p>

        <h2 className="font-display text-3xl sm:text-4xl text-[#F3ECE0]">
          {title}
        </h2>

        <p className="mt-3 max-w-xl text-[#A99A87] leading-7">
          {description}
        </p>
      </div>

      {action && href && (
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-brand-secondary hover:text-[#F3ECE0] transition"
        >
          {action} →
        </Link>
      )}
    </div>
  )
}

function TeachingCard({
  category,
  title,
  description,
  date,
  href,
}: {
  category: string
  title: string
  description: string
  date: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#F3ECE0]/10 bg-[#14100D] p-6 hover:border-brand-secondary/30 hover:-translate-y-0.5 transition"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-[0.18em] text-brand-secondary">
          {category}
        </span>

        <span className="text-xs text-[#A99A87]/60">
          {date}
        </span>
      </div>

      <h3 className="mt-8 font-display text-2xl text-[#F3ECE0] group-hover:text-brand-secondary transition">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#A99A87]">
        {description}
      </p>

      <span className="inline-block mt-6 text-sm text-[#F3ECE0]/70 group-hover:text-[#F3ECE0] transition">
        Read lesson →
      </span>
    </Link>
  )
}

function OfferRow({
  mark,
  title,
  text,
}: {
  mark: (0 | 1)[]
  title: string
  text: string
}) {
  const href =
    title === 'Teachings'
      ? '/teachings'
      : title === 'Resources'
        ? '/resources'
        : '/services'

  return (
    <Link
      href={href}
      className="group grid sm:grid-cols-[80px_180px_1fr] gap-5 items-center py-6 border-b border-[#F3ECE0]/10"
    >
      <OduMark
        pattern={mark}
        className="w-7 h-10 text-brand-secondary"
      />

      <h3 className="font-display text-2xl text-[#F3ECE0] group-hover:text-brand-secondary transition">
        {title}
      </h3>

      <p className="text-sm leading-6 text-[#A99A87]">
        {text}
      </p>
    </Link>
  )
}

function SimpleLink({
  title,
  href,
}: {
  title: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-[#F3ECE0]/10 px-4 py-3 text-sm text-[#F3ECE0] hover:border-brand-secondary/30 hover:bg-[#F3ECE0]/5 transition"
    >
      <span>{title}</span>
      <span className="text-brand-secondary">→</span>
    </Link>
  )
}

function MemberAction({
  title,
  text,
  href,
}: {
  title: string
  text: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#F3ECE0]/10 p-5 hover:border-brand-secondary/30 hover:bg-[#F3ECE0]/5 transition"
    >
      <p className="font-semibold text-[#F3ECE0]">
        {title}
      </p>

      <p className="mt-1 text-sm text-[#A99A87]">
        {text}
      </p>
    </Link>
  )
}

function MiniStat({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div>
      <p className="font-display text-xl text-[#F3ECE0]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#A99A87]">
        {label}
      </p>
    </div>
  )
}

function AccountLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A99A87] hover:text-[#F3ECE0] hover:bg-[#F3ECE0]/5 transition"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileAccountLink({
  href,
  label,
  onClick,
}: {
  href: string
  label: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-1 py-3 text-sm text-[#A99A87] border-b border-[#F3ECE0]/10"
    >
      {label}
    </Link>
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
      <h3 className="text-sm font-semibold text-[#F3ECE0]">
        {title}
      </h3>

      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-[#A99A87] hover:text-[#F3ECE0] transition"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
   ICONS
========================================================= */

function IconHome(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="M4 11.5 12 4l8 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUser(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <circle cx="12" cy="8" r="3.5" />

      <path
        d="M5 20c.8-3.5 3.1-5.2 7-5.2s6.2 1.7 7 5.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconSettings(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />

      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconLogout(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="M14 5h5v14h-5M10 12h9M14 8l-3 4 3 4M5 5h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMenu(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconClose(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="m6 6 12 12M18 6 6 18"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconScroll(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMark(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <path
        d="M7 4v16M12 4v16M17 4v16"
        strokeLinecap="round"
      />

      <path
        d="M5 4h4M10 20h4M15 4h4"
        strokeLinecap="round"
      />
    </svg>
  )
}
