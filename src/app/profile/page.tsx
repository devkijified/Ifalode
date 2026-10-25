'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/format'
import { Icon, type IconName } from '@/components/ui/Icon'
import { PublicBar } from '@/components/shell/PublicBar'
import { Skeleton } from '@/components/ui/primitives'

const QUICK_LINKS: {
  href: string
  icon: IconName
  label: string
  caption: string
}[] = [
  { href: '/dashboard', icon: 'learn', label: 'My learning', caption: 'Courses, progress and your library' },
  { href: '/dashboard/referrals', icon: 'people', label: 'Referrals', caption: 'Your code, invites and rewards' },
  { href: '/dashboard/support', icon: 'chat', label: 'Support tickets', caption: 'Help with payments, courses and classes' },
  { href: '/dashboard/notifications', icon: 'info', label: 'Notifications', caption: 'Replies, rewards and class alerts' },
  { href: '/settings', icon: 'lock', label: 'Settings', caption: 'Password, notifications and sign out' },
]

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (mounted) {
          setProfile(data)
          setNameInput((data as any)?.full_name || '')
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Member'
  const email = profile?.email || user?.email || ''
  const initial = displayName.charAt(0).toUpperCase()

  const handleSaveName = async () => {
    const name = nameInput.trim()
    if (!name || !user || saving) return
    setSaving(true)
    setSaveState('idle')
    const { error } = await (supabase.from('profiles') as any)
      .update({ full_name: name })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setSaveState('error')
      return
    }
    setProfile((p: any) => ({ ...p, full_name: name }))
    setSaveState('saved')
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        ) : !user ? (
          <div className="rounded-2xl border border-cream/10 bg-ink-850 px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Icon name="profile" size={30} />
            </div>
            <h1 className="font-display text-headline tracking-tight text-cream">
              You are not signed in
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              Sign in to see your profile, courses and referrals.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-[48px] items-center rounded-full border border-cream/20 px-6 text-body font-semibold text-cream transition hover:border-gold hover:text-gold"
              >
                Create an account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Identity card */}
            <section className="rounded-2xl border border-cream/10 bg-ink-850 p-6">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold font-display text-display text-ink-950">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your full name"
                        autoFocus
                        className="min-h-[48px] min-w-[220px] flex-1 rounded-xl border border-cream/15 bg-ink-900 px-4 text-body text-cream focus:border-gold focus:outline-none"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={saving || !nameInput.trim()}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                      >
                        <Icon name="check" size={17} variant="Bold" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setNameInput(profile?.full_name || '')
                        }}
                        className="inline-flex min-h-[48px] items-center rounded-full border border-cream/20 px-5 text-body font-semibold text-cream-dim transition hover:text-cream"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="font-display text-headline tracking-tight text-cream">
                        {displayName}
                      </h1>
                      <button
                        onClick={() => setEditing(true)}
                        className="inline-flex min-h-[36px] items-center rounded-full border border-cream/20 px-4 text-caption font-semibold text-cream-dim transition hover:border-gold hover:text-gold"
                      >
                        Edit name
                      </button>
                    </div>
                  )}
                  <p className="mt-1 truncate text-body text-cream-dim">{email}</p>
                  {profile?.created_at && (
                    <p className="mt-1 text-caption text-cream-faint">
                      Member since {formatDateTime(profile.created_at)}
                    </p>
                  )}
                  {saveState === 'saved' && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-caption font-semibold text-success">
                      <Icon name="check" size={14} variant="Bold" />
                      Name saved
                    </p>
                  )}
                  {saveState === 'error' && (
                    <p className="mt-2 text-caption font-semibold text-live">
                      Your name could not be saved. Please try again.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Quick links */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-4 rounded-2xl border border-cream/10 bg-ink-850 p-5 transition hover:border-gold/40"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Icon name={link.icon} size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold text-cream">
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-caption text-cream-faint">
                      {link.caption}
                    </span>
                  </span>
                  <span className="text-cream-faint transition group-hover:text-gold">
                    <Icon name="forward" size={18} />
                  </span>
                </Link>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
