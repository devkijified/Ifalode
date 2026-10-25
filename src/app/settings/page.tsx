'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icon'
import { PublicBar } from '@/components/shell/PublicBar'
import { HelpTip, Skeleton } from '@/components/ui/primitives'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

type PushState = 'checking' | 'off' | 'on' | 'busy' | 'unsupported'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')

  // Account
  const [fullName, setFullName] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameState, setNameState] = useState<'idle' | 'saved' | 'error'>('idle')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Push
  const [pushState, setPushState] = useState<PushState>('checking')
  const [pushMessage, setPushMessage] = useState<string | null>(null)

  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!mounted) return
      setUser(user)
      if (user) {
        setEmail(user.email || '')
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle()
        if (mounted && data) {
          setFullName((data as any).full_name || '')
          if ((data as any).email) setEmail((data as any).email)
        }
      }
      setLoading(false)
    }
    load()

    // Push state
    const checkPush = async () => {
      if (
        typeof window === 'undefined' ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      ) {
        setPushState('unsupported')
        return
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        const sub = reg ? await reg.pushManager.getSubscription() : null
        setPushState(sub ? 'on' : 'off')
      } catch {
        setPushState('off')
      }
    }
    checkPush()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveName = async () => {
    const name = fullName.trim()
    if (!name || !user || nameSaving) return
    setNameSaving(true)
    setNameState('idle')
    const { error } = await (supabase.from('profiles') as any)
      .update({ full_name: name })
      .eq('id', user.id)
    setNameSaving(false)
    setNameState(error ? 'error' : 'saved')
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMessage(null)
    if (newPassword.length < 6) {
      setPwMessage({ ok: false, text: 'Your new password needs at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMessage({ ok: false, text: 'The two passwords do not match.' })
      return
    }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) {
      setPwMessage({ ok: false, text: error.message })
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPwMessage({ ok: true, text: 'Password updated. Use it the next time you sign in.' })
  }

  const enablePush = async () => {
    if (!VAPID_PUBLIC_KEY) return
    setPushState('busy')
    setPushMessage(null)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState('off')
        setPushMessage('Notifications are blocked in this browser. Allow them in your browser settings, then try again.')
        return
      }
      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }))
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('subscribe failed')
      setPushState('on')
    } catch {
      setPushState('off')
      setPushMessage('Push could not be turned on. Please try again.')
    }
  }

  const disablePush = async () => {
    setPushState('busy')
    setPushMessage(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setPushState('off')
    } catch {
      setPushState('on')
      setPushMessage('Push could not be turned off. Please try again.')
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-cream/10 bg-ink-900 px-4 text-body text-cream placeholder:text-cream-faint focus:border-gold focus:outline-none'
  const sectionClass = 'rounded-2xl border border-cream/10 bg-ink-850 p-5 sm:p-6'
  const sectionTitle = 'font-display text-title tracking-tight text-cream'

  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-headline tracking-tight text-cream">
          Settings
        </h1>
        <p className="mt-1 text-body text-cream-dim">
          Your account, password and notifications.
        </p>

        {loading ? (
          <div className="mt-8 space-y-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : !user ? (
          <div className="mt-8 rounded-2xl border border-cream/10 bg-ink-850 px-6 py-14 text-center">
            <h2 className="font-display text-title text-cream">You are not signed in</h2>
            <p className="mx-auto mt-2 max-w-sm text-body text-cream-dim">
              Sign in to change your settings.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {/* Account */}
            <section className={sectionClass}>
              <h2 className={sectionTitle}>Account</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="settings-name" className="mb-1.5 block text-caption font-semibold text-cream-dim">
                    Full name
                  </label>
                  <input
                    id="settings-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="mb-1.5 block text-caption font-semibold text-cream-dim">
                    Email
                  </label>
                  <input
                    id="settings-email"
                    value={email}
                    readOnly
                    className={`${inputClass} opacity-60`}
                  />
                  <p className="mt-1.5 text-caption text-cream-faint">
                    Your email is your sign-in name, so it cannot be changed here.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveName}
                    disabled={nameSaving || !fullName.trim()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gold px-5 text-body font-bold text-ink-950 transition hover:bg-gold-light disabled:opacity-50"
                  >
                    <Icon name="check" size={16} variant="Bold" />
                    {nameSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  {nameState === 'saved' && (
                    <span className="text-caption font-semibold text-success">Saved</span>
                  )}
                  {nameState === 'error' && (
                    <span className="text-caption font-semibold text-live">
                      Could not save. Please try again.
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Password */}
            <section className={sectionClass}>
              <h2 className={sectionTitle}>
                Password
                <HelpTip text="Changing your password keeps you signed in on this device. Other devices will ask for the new password next time." />
              </h2>
              <form onSubmit={handlePassword} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="settings-new-password" className="mb-1.5 block text-caption font-semibold text-cream-dim">
                    New password
                  </label>
                  <input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="settings-confirm-password" className="mb-1.5 block text-caption font-semibold text-cream-dim">
                    Confirm new password
                  </label>
                  <input
                    id="settings-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type the new password again"
                    className={inputClass}
                  />
                </div>
                {pwMessage && (
                  <p className={`text-caption font-semibold ${pwMessage.ok ? 'text-success' : 'text-live'}`}>
                    {pwMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={pwSaving || !newPassword || !confirmPassword}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-cream/25 px-5 text-body font-semibold text-cream transition hover:border-gold hover:text-gold disabled:opacity-50"
                >
                  {pwSaving ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </section>

            {/* Notifications */}
            <section className={sectionClass}>
              <h2 className={sectionTitle}>Notifications</h2>
              <p className="mt-2 text-body text-cream-dim">
                Get a push on this device when support replies, a class is
                about to start, or a referral reward lands.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {!VAPID_PUBLIC_KEY ? (
                  <>
                    <button
                      type="button"
                      disabled
                      aria-pressed={false}
                      className="relative h-8 w-14 shrink-0 cursor-not-allowed rounded-full bg-ink-700 opacity-50"
                    >
                      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-cream-dim" />
                    </button>
                    <p className="text-body text-cream-faint">
                      Push notifications are being set up
                    </p>
                  </>
                ) : pushState === 'unsupported' ? (
                  <p className="text-body text-cream-faint">
                    This browser does not support push notifications. Your
                    in-app notification centre still works.
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pushState === 'on'}
                      aria-label="Push notifications"
                      disabled={pushState === 'checking' || pushState === 'busy'}
                      onClick={pushState === 'on' ? disablePush : enablePush}
                      className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
                        pushState === 'on' ? 'bg-gold' : 'bg-ink-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-cream transition-all ${
                          pushState === 'on' ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                    <span className="text-body font-semibold text-cream">
                      {pushState === 'on'
                        ? 'Push is on for this device'
                        : pushState === 'busy'
                          ? 'Working...'
                          : 'Push is off'}
                    </span>
                    {pushState === 'on' && (
                      <button
                        onClick={disablePush}
                        className="inline-flex min-h-[40px] items-center rounded-full border border-cream/20 px-4 text-caption font-semibold text-cream-dim transition hover:border-live hover:text-live"
                      >
                        Turn off
                      </button>
                    )}
                  </>
                )}
              </div>
              {pushMessage && (
                <p className="mt-3 text-caption font-semibold text-live">{pushMessage}</p>
              )}
            </section>

            {/* Session */}
            <section className={sectionClass}>
              <h2 className={sectionTitle}>Session</h2>
              <p className="mt-2 text-body text-cream-dim">
                Sign out of IfaLode on this device.
              </p>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-live/50 px-5 text-body font-semibold text-live transition hover:bg-live/10 disabled:opacity-50"
              >
                <Icon name="logout" size={17} />
                {signingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
