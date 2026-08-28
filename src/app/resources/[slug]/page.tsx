'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
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

// Resource data - could also come from a database
const resourcesData = {
  'morning-prayer': {
    title: 'Morning prayer in Ifá',
    type: 'PRAYER',
    content: `
      <p>This is a simple morning prayer that you can offer to greet the new day, honor your Ori, and ask for protection and clarity.</p>

      <p>It is best said at sunrise, or as soon as you wake, facing the direction of the rising sun.</p>

      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 my-6">
        <p class="text-lg font-semibold text-brand-primary mb-2">Morning Prayer</p>
        <p class="text-slate-200 italic">"Ori mi, mo ki o. Ori mi, mo pe o. Ori mi, mo fi ara mi le o."</p>
        <p class="text-sm text-slate-400 mt-2">Translation: "My Ori, I greet you. My Ori, I call upon you. My Ori, I place myself in your hands."</p>
      </div>

      <p>After the prayer, offer a small amount of cool water and say:</p>

      <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-6 my-6">
        <p class="text-slate-200 italic">"Eku oro, eku odun, eku irole, eku isinmi. Ki a ba te si ayo, ki a ba te si ire."</p>
        <p class="text-sm text-slate-400 mt-2">Translation: "Blessed morning, blessed year, blessed evening, blessed rest. May we walk in joy, may we walk in blessings."</p>
      </div>

      <p>You can say this prayer every morning to start your day with intention and connection to your spiritual self.</p>

      <h2>When to Pray</h2>

      <ul>
        <li>At sunrise or as soon as you wake</li>
        <li>Before any important decision</li>
        <li>When you feel uncertain or afraid</li>
        <li>To express gratitude for a blessing received</li>
      </ul>

      <div class="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 my-6">
        <p class="text-sm text-slate-300">
          <strong class="text-brand-primary">Note:</strong> These prayers are personal devotions. For specific needs, consult with a Babalawo who can guide you according to the Odu.
        </p>
      </div>
    `,
    related: ['ori-orientation', 'altar-basics']
  },
  'ori-orientation': {
    title: 'Working with your Ori',
    type: 'GUIDE',
    content: `
      <p>Your Ori is your inner head, your personal divinity, and the essence of your destiny. Working with your Ori is one of the most important practices in the Ifá tradition.</p>

      <p>This guide offers practical ways to honor and align with your Ori through simple daily practices.</p>

      <h2>Daily Practices</h2>

      <ul>
        <li><strong>Greeting:</strong> Each morning, greet your Ori with a simple prayer or acknowledgment.</li>
        <li><strong>Offerings:</strong> Offer a small amount of cool water, kola nut, or white cloth to your Ori.</li>
        <li><strong>Meditation:</strong> Sit quietly and listen to your inner voice.</li>
        <li><strong>Reflection:</strong> At the end of the day, reflect on your choices and whether they aligned with your deeper truth.</li>
      </ul>

      <h2>How to Make an Offering to Your Ori</h2>

      <p>You don't need a complex ritual to honor your Ori. A simple, sincere offering is often the most powerful.</p>

      <ul>
        <li>Place a white cloth on a small table</li>
        <li>Set a cup of cool water on the cloth</li>
        <li>Light a white candle</li>
        <li>Speak your prayer or intention out loud or in silence</li>
        <li>Sit in silence for a few moments</li>
      </ul>

      <h2>Listening to Your Ori</h2>

      <p>Your Ori communicates through:</p>

      <ul>
        <li>Intuition and gut feelings</li>
        <li>Dreams and visions</li>
        <li>Subtle signs and synchronicities</li>
        <li>Emotions and physical sensations</li>
      </ul>

      <p>Learning to listen takes patience and practice. Start by setting aside five minutes each day to sit in quiet reflection.</p>
    `,
    related: ['morning-prayer', 'altar-basics']
  },
  'odu-list': {
    title: 'The 16 principal Odu',
    type: 'REFERENCE',
    content: `
      <p>The Odu are the sacred verses of the Ifá divination system. The 16 principal Odu are the foundation of Ifá knowledge.</p>

      <h2>The 16 Principal Odu</h2>

      <ul>
        <li><strong>Ogbe:</strong> The Odu of light, clarity, and new beginnings.</li>
        <li><strong>Oyekun:</strong> The Odu of depth, darkness, and the ancestors.</li>
        <li><strong>Iwori:</strong> The Odu of transformation and change.</li>
        <li><strong>Di:</strong> The Odu of conflict and resolution.</li>
        <li><strong>Bara:</strong> The Odu of celebration and joy.</li>
        <li><strong>Ose:</strong> The Odu of creativity and the arts.</li>
        <li><strong>Odi:</strong> The Odu of stillness and patience.</li>
        <li><strong>Osa:</strong> The Odu of movement and action.</li>
        <li><strong>Irete:</strong> The Odu of stability and foundation.</li>
        <li><strong>Ofun:</strong> The Odu of completeness and wholeness.</li>
        <li><strong>Ika:</strong> The Odu of boundaries and protection.</li>
        <li><strong>Ejila:</strong> The Odu of partnership and balance.</li>
        <li><strong>Obe:</strong> The Odu of justice and truth.</li>
        <li><strong>Egun:</strong> The Odu of conflict and the warrior spirit.</li>
        <li><strong>Otu:</strong> The Odu of healing and restoration.</li>
        <li><strong>Otura:</strong> The Odu of leadership and responsibility.</li>
      </ul>

      <p>Each Odu contains countless verses (ese) that speak to specific situations and challenges.</p>

      <h2>Studying the Odu</h2>

      <p>To study the Odu:</p>

      <ul>
        <li>Read the ese Ifá with an open mind</li>
        <li>Observe how the themes of each Odu appear in your life</li>
        <li>Seek guidance from a qualified Babalawo for deeper understanding</li>
        <li>Study the stories and myths associated with each Odu</li>
      </ul>
    `,
    related: ['reading-questions', 'ori-orientation']
  },
  'ebo-guide': {
    title: 'Understanding Ebó',
    type: 'GUIDE',
    content: `
      <p>Ebó, often translated as "offering" or "sacrifice," is a practice central to the Ifá tradition. It involves making offerings to restore balance and receive blessings.</p>

      <p>This guide explains the logic of offerings: why they are given and how they function.</p>

      <h2>Why Offerings Are Made</h2>

      <p>Offerings are made for many reasons:</p>

      <ul>
        <li>To remove obstacles</li>
        <li>To seek healing</li>
        <li>To ask for protection</li>
        <li>To bring abundance</li>
        <li>To honor the ancestors</li>
        <li>To fulfill a promise</li>
      </ul>

      <h2>What Can Be Offered</h2>

      <ul>
        <li><strong>Simple offerings:</strong> Water, kola nut, palm oil, white cloth</li>
        <li><strong>Food offerings:</strong> Goat, chicken, fish, cornmeal</li>
        <li><strong>Sacred items:</strong> Cowry shells, beads, palm fronds</li>
        <li><strong>Personal offerings:</strong> Prayers, acts of service, charity</li>
      </ul>

      <h2>How Offerings Work</h2>

      <p>Offerings work on multiple levels:</p>

      <ul>
        <li><strong>Spiritual:</strong> They honor the divine and invite blessings</li>
        <li><strong>Psychological:</strong> They focus intention and commitment</li>
        <li><strong>Practical:</strong> They create tangible actions and accountability</li>
      </ul>

      <h2>Important Note</h2>

      <div class="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 my-6">
        <p class="text-sm text-slate-300">
          <strong class="text-brand-primary">Important:</strong> The nature of ebó should be determined through divination by a qualified Babalawo. Never perform major offerings without proper guidance.
        </p>
      </div>
    `,
    related: ['altar-basics', 'ori-orientation']
  },
  'reading-questions': {
    title: 'Questions for your reading',
    type: 'READING AID',
    content: `
      <p>Preparing for an Ifá consultation (Dáfá) helps you get the most from your session. This guide provides suggested questions to consider before your reading.</p>

      <h2>General Questions</h2>

      <ul>
        <li>"What is the primary challenge in my life right now?"</li>
        <li>"What blessings are available to me at this time?"</li>
        <li>"What do I need to know about my current path?"</li>
        <li>"What should I focus on in the coming months?"</li>
      </ul>

      <h2>Specific Areas</h2>

      <h3>Health</h3>
      <ul>
        <li>"What is the root of my health concern?"</li>
        <li>"What steps can I take for healing?"</li>
      </ul>

      <h3>Relationships</h3>
      <ul>
        <li>"What is the lesson in this relationship?"</li>
        <li>"What do I need to understand about this connection?"</li>
      </ul>

      <h3>Work & Purpose</h3>
      <ul>
        <li>"Am I aligned with my purpose?"</li>
        <li>"What direction should I pursue?"</li>
      </ul>

      <h3>Spiritual</h3>
      <ul>
        <li>"What does my Ori want me to know?"</li>
        <li>"What offerings would benefit my path?"</li>
      </ul>

      <h2>How to Prepare</h2>

      <ul>
        <li>Write down your questions before the session</li>
        <li>Be open to what is revealed</li>
        <li>Trust the process</li>
        <li>Follow the guidance given</li>
      </ul>
    `,
    related: ['odu-list', 'ori-orientation']
  },
  'altar-basics': {
    title: 'Simple home altar basics',
    type: 'GUIDE',
    content: `
      <p>Setting up a small, respectful space at home for prayer and offerings is a meaningful way to maintain a spiritual practice.</p>

      <p>This guide shows you how to create a simple home altar that honors the divine, your ancestors, and your Ori.</p>

      <h2>What You Need</h2>

      <ul>
        <li><strong>A table or shelf:</strong> A small, clean surface</li>
        <li><strong>A white cloth:</strong> To cover the surface</li>
        <li><strong>A candle:</strong> White is traditional</li>
        <li><strong>A cup or bowl:</strong> For water offerings</li>
        <li><strong>A small bowl:</strong> For other offerings</li>
        <li><strong>A symbol of your Ori:</strong> A small stone, shell, or other object</li>
        <li><strong>Ancestral photo:</strong> A photo of a departed loved one (optional)</li>
      </ul>

      <h2>Setting Up Your Altar</h2>

      <ol>
        <li>Place the table or shelf in a quiet, clean space</li>
        <li>Cover it with the white cloth</li>
        <li>Place the candle in the center</li>
        <li>Place the water cup to the right of the candle</li>
        <li>Place the offering bowl to the left</li>
        <li>Place your Ori symbol in front of the candle</li>
        <li>Add any ancestral photos or sacred objects</li>
      </ol>

      <h2>Maintaining Your Altar</h2>

      <ul>
        <li>Keep the altar clean and tidy</li>
        <li>Change the water daily</li>
        <li>Light the candle during prayer or meditation</li>
        <li>Make offerings regularly</li>
        <li>Reflect on your spiritual path at your altar</li>
      </ul>

      <h2>Simple Daily Practice</h2>

      <ul>
        <li>Greet your Ori</li>
        <li>Offer a prayer</li>
        <li>Sit in silence for a few minutes</li>
        <li>Give thanks</li>
      </ul>
    `,
    related: ['morning-prayer', 'ori-orientation']
  }
}

export default function ResourcePage() {
  const { brand } = useBrand()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const slug = params?.slug as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const resource = slug ? resourcesData[slug as keyof typeof resourcesData] : null

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
  const avatar = user?.user_metadata?.avatar_url || null

  const PRIEST_NAME = 'Akinsoji Elebuibon'
  const TRADITION = 'Yoruba / Ifá tradition'

  // If resource not found
  if (!resource) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Resource Not Found</h1>
          <p className="text-slate-400 mb-6">The resource you're looking for doesn't exist.</p>
          <Link href="/resources" className="text-brand-primary hover:underline">← Back to Resources</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/10">
            <div className="h-full px-5 flex items-center justify-between">
              <Link href="/" className="shrink-0 text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {brand?.display_name || PRIEST_NAME}
              </Link>
              <div className="hidden lg:flex items-center gap-8 ml-10">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/teachings">Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </div>
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
                          <AccountLink href="/dashboard" icon="⌂" label="Dashboard" />
                          <AccountLink href="/readings" icon="📿" label="My Readings" />
                          <AccountLink href="/profile" icon="◉" label="Profile" />
                          <AccountLink href="/settings" icon="⚙" label="Settings" />
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

      {/* RESOURCE CONTENT */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[5%] w-72 h-72 rounded-full bg-brand-primary/10 blur-[120px]" />
          <div className="absolute top-40 right-[5%] w-96 h-96 rounded-full bg-brand-secondary/10 blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-8">
            ← Back to Resources
          </Link>

          <div className="space-y-2 mb-6">
            <span className="text-xs tracking-[.15em] text-brand-primary font-bold uppercase">
              {resource.type}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              {resource.title}
            </h1>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: resource.content }} />
          </div>

          {resource.related && resource.related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Related Resources</h3>
              <div className="flex flex-wrap gap-3">
                {resource.related.map((relatedSlug) => {
                  const related = resourcesData[relatedSlug as keyof typeof resourcesData]
                  if (!related) return null
                  return (
                    <Link
                      key={relatedSlug}
                      href={`/resources/${relatedSlug}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:border-brand-primary hover:text-white transition"
                    >
                      {related.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <Link href="/" className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
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
              © {new Date().getFullYear()} {brand?.display_name || PRIEST_NAME}. All rights reserved.
            </p>
            <div className="flex gap-5">
              <Link href="/privacy" className="text-xs text-slate-700 hover:text-slate-400 transition">Privacy</Link>
              <Link href="/terms" className="text-xs text-slate-700 hover:text-slate-400 transition">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}

// ===================== COMPONENTS =====================

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
        active ? 'text-white font-semibold' : 'text-slate-500 hover:text-white'
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
