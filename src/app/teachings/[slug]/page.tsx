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

// Teaching data - could also come from a database
const teachingsData = {
  'ori': {
    title: 'On understanding your Ori',
    category: 'LESSON',
    date: 'Aug 2026',
    content: `
      <p>The concept of Ori is fundamental in the Ifá tradition. Ori translates to "head," but in a spiritual sense, it represents your inner self, your destiny, and your personal divinity.</p>
      
      <p>Every person has a unique Ori, which is chosen before birth. This Ori contains your purpose, your challenges, and your gifts. Understanding your Ori is the first step toward living a life of alignment and fulfillment.</p>
      
      <h2>What is Ori?</h2>
      
      <p>Ori is the part of you that existed before you were born. It is the essence that carries your destiny (Ayanmo) and your character (Ìwà). Your Ori is your spiritual guide, your intuition, and your connection to the divine.</p>
      
      <p>When you honor your Ori, you honor your true self. When you neglect your Ori, you wander through life without direction.</p>
      
      <h2>How to Connect with Your Ori</h2>
      
      <ul>
        <li><strong>Meditation:</strong> Spend quiet time listening to your inner voice.</li>
        <li><strong>Prayer:</strong> Speak to your Ori as you would speak to a wise elder.</li>
        <li><strong>Offerings:</strong> Simple offerings like water, kola nut, or white candles can honor your Ori.</li>
        <li><strong>Reflection:</strong> Examine your choices—are they aligned with your deeper truth?</li>
      </ul>
      
      <p>Your Ori never leaves you. It speaks through your dreams, your feelings, and the subtle signs of life. Learning to listen takes patience, but it is one of the most important skills on any spiritual path.</p>
    `,
    related: ['iwa-pele', 'destiny']
  },
  'ire': {
    title: 'Living with Ire',
    category: 'INSIGHT',
    date: 'Jul 2026',
    content: `
      <p>Ire means "goodness," "blessing," or "good fortune." In the Ifá tradition, ire is not just luck—it is a way of living that invites blessing into your life.</p>
      
      <p>Living with ire means walking in alignment with your Ori, respecting the divine, and treating others with compassion and integrity. When you live this way, you open yourself to receiving abundance, protection, and peace.</p>
      
      <h2>How to Cultivate Ire</h2>
      
      <ul>
        <li><strong>Gratitude:</strong> Acknowledge the blessings you already have.</li>
        <li><strong>Integrity:</strong> Speak truth and act with honesty.</li>
        <li><strong>Generosity:</strong> Share what you have with others.</li>
        <li><strong>Patience:</strong> Trust that good things take time.</li>
      </ul>
      
      <p>Ire is not something you can force. It is something you invite. When you align your thoughts, words, and actions with goodness, ire naturally flows into your life.</p>
    `,
    related: ['iwa-pele', 'ori']
  },
  'odu-language': {
    title: 'The language of the Odu',
    category: 'ODU STUDY',
    date: 'Jun 2026',
    content: `
      <p>The Odu are the sacred verses of the Ifá divination system. They are not merely stories—they are living teachings that contain wisdom for every situation in life.</p>
      
      <p>Each Odu contains countless verses, known as ese, which describe the paths of life. Through these verses, the Odu speak to us about our challenges, our opportunities, and the guidance we need to navigate our journey.</p>
      
      <h2>How the Odu Speak</h2>
      
      <p>The Odu speak through the divination process, which is known as Dáfá. A trained priest (Babalawo) interprets the signs that appear through the divination instruments, reading the language of the Odu to reveal the message that is meant for you.</p>
      
      <p>The language of the Odu is symbolic and layered. It uses metaphors, stories, and patterns that connect to the larger cycles of nature and human experience. Understanding this language requires both study and practice.</p>
      
      <h2>Study Resources</h2>
      
      <ul>
        <li>Read the ese Ifá with an open mind</li>
        <li>Observe how the patterns of the Odu appear in your own life</li>
        <li>Seek guidance from a qualified Babalawo for deeper understanding</li>
      </ul>
    `,
    related: ['ori', 'destiny']
  },
  'ebo': {
    title: 'Understanding Ebó',
    category: 'PRACTICE',
    date: 'May 2026',
    content: `
      <p>Ebó, often translated as "offering" or "sacrifice," is a practice that is central to the Ifá tradition. It involves making offerings to the divine, the ancestors, or the forces of nature to restore balance and receive blessings.</p>
      
      <p>Ebó is not about appeasement—it is about alignment. When we make offerings, we are acknowledging our place in the cosmos, and we are taking responsibility for our actions and our path.</p>
      
      <h2>The Purpose of Ebó</h2>
      
      <p>The purpose of ebó is to remove obstacles, to heal, to protect, and to bring blessings. Ebó can be offered for many reasons, including:</p>
      
      <ul>
        <li>Seeking direction</li>
        <li>Asking for protection</li>
        <li>Healing from illness</li>
        <li>Opening the way for abundance</li>
      </ul>
      
      <h2>What is Offered?</h2>
      
      <p>Offerings can include:</p>
      
      <ul>
        <li>Simple items like water, kola nut, or palm oil</li>
        <li>Food offerings such as goat, chicken, or fish</li>
        <li>Sacred objects like cowry shells or beads</li>
        <li>Personal offerings like prayers or acts of service</li>
      </ul>
      
      <p>The nature of the ebó is determined by the divination process. It is always specific to the person and the situation.</p>
    `,
    related: ['iwa-pele', 'ori']
  },
  'iwa-pele': {
    title: 'Ìwà Pẹ̀lẹ́: Good character',
    category: 'LESSON',
    date: 'Apr 2026',
    content: `
      <p>Ìwà Pẹ̀lẹ́ translates to "good character" or "gentle character." It is the foundation of any genuine spiritual path, especially in the Ifá tradition. Without good character, all rituals, offerings, and prayers are empty.</p>
      
      <p>Ìwà Pẹ̀lẹ́ is a way of being that is reflected in how you treat yourself, how you treat others, and how you walk in the world.</p>
      
      <h2>The Elements of Good Character</h2>
      
      <ul>
        <li><strong>Truthfulness:</strong> Speak the truth, even when it is difficult.</li>
        <li><strong>Integrity:</strong> Align your actions with your values.</li>
        <li><strong>Kindness:</strong> Show compassion to all beings.</li>
        <li><strong>Patience:</strong> Practice patience in the face of difficulty.</li>
        <li><strong>Humility:</strong> Remember that you are part of a larger order.</li>
      </ul>
      
      <p>Developing good character is a lifelong journey. It requires self-reflection, accountability, and the willingness to grow. When you embody Ìwà Pẹ̀lẹ́, you become a person of true spiritual depth.</p>
      
      <h2>Good Character in Practice</h2>
      
      <p>To cultivate Ìwà Pẹ̀lẹ́ in daily life:</p>
      
      <ul>
        <li>Pause before responding to others</li>
        <li>Admit when you are wrong and seek to make amends</li>
        <li>Be generous with your time and resources</li>
        <li>Speak well of others, especially when they are not present</li>
      </ul>
      
      <p>These small acts build the foundation of a life that honors the divine, your ancestors, and your own Ori.</p>
    `,
    related: ['ori', 'destiny']
  },
  'destiny': {
    title: 'Destiny and free will',
    category: 'INSIGHT',
    date: 'Mar 2026',
    content: `
      <p>In the Ifá tradition, destiny (Ayanmo) is understood as the path you chose before you were born. It contains your purpose, your lessons, and the major events of your life. However, destiny is not a fixed fate—it is a living path that interacts with your free will.</p>
      
      <p>Your Ori guides you toward your destiny, but how you walk that path depends on your choices. Every decision you make shapes the way your destiny unfolds.</p>
      
      <h2>How Destiny and Free Will Interact</h2>
      
      <p>Think of your destiny as a road map. The map shows you the routes, the destinations, and the landmarks along the way. But how you choose to travel, whether you stop at certain places, or how fast you go—these are determined by your free will.</p>
      
      <p>This means that while you cannot change your fundamental purpose, you can choose how to fulfill it. You can embrace your destiny with courage, or you can resist it. Both choices have consequences.</p>
      
      <h2>Aligning with Your Destiny</h2>
      
      <p>To align with your destiny, you can:</p>
      
      <ul>
        <li>Seek guidance through divination</li>
        <li>Listen to your intuition and inner knowing</li>
        <li>Make choices that align with your higher values</li>
        <li>Release attachment to outcomes and trust the process</li>
      </ul>
      
      <p>When you walk in alignment with your destiny, you experience greater peace, purpose, and fulfillment.</p>
    `,
    related: ['iwa-pele', 'ori']
  }
}

export default function TeachingPage() {
  const { brand } = useBrand()
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const slug = params?.slug as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const teaching = slug ? teachingsData[slug as keyof typeof teachingsData] : null

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

  // If teaching not found
  if (!teaching) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Teaching Not Found</h1>
          <p className="text-slate-400 mb-6">The teaching you're looking for doesn't exist.</p>
          <Link href="/teachings" className="text-brand-primary hover:underline">← Back to Teachings</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">

      {/* HEADER - Same as teachings page */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <nav className="h-[68px] rounded-2xl border border-slate-800/80 bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/10">
            <div className="h-full px-5 flex items-center justify-between">
              <Link href="/" className="shrink-0 text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                {brand?.display_name || PRIEST_NAME}
              </Link>
              <div className="hidden lg:flex items-center gap-8 ml-10">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/teachings" active>Teachings</NavLink>
                <NavLink href="/services">Services</NavLink>
                <NavLink href="/about">About</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </div>
              {/* ... Rest of header (same as teachings page) */}
            </div>
          </nav>
        </div>
      </header>

      {/* TEACHING CONTENT */}
      <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[5%] w-72 h-72 rounded-full bg-brand-primary/10 blur-[120px]" />
          <div className="absolute top-40 right-[5%] w-96 h-96 rounded-full bg-brand-secondary/10 blur-[140px]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/teachings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-8">
            ← Back to Teachings
          </Link>

          <div className="space-y-2 mb-6">
            <span className="text-xs tracking-[.15em] text-brand-primary font-bold uppercase">
              {teaching.category}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              {teaching.title}
            </h1>
            <p className="text-sm text-slate-500">{teaching.date}</p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: teaching.content }} />
          </div>

          {teaching.related && teaching.related.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Related Teachings</h3>
              <div className="flex flex-wrap gap-3">
                {teaching.related.map((relatedSlug) => {
                  const related = teachingsData[relatedSlug as keyof typeof teachingsData]
                  if (!related) return null
                  return (
                    <Link
                      key={relatedSlug}
                      href={`/teachings/${relatedSlug}`}
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

      {/* FOOTER - Same as teachings page */}
      <footer className="border-t border-slate-900 bg-slate-950">
        {/* ... footer content (same as teachings page) ... */}
      </footer>
    </main>
  )
}

// Components (same as teachings page)
function NavLink({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} className={`text-sm transition ${active ? 'text-white font-semibold' : 'text-slate-500 hover:text-white'}`}>
      {children}
    </Link>
  )
}
