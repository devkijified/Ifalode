'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

export default function SignupPage() {
  const { brand } = useBrand()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Wait a moment for the trigger to work
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if profile was created
        const { data: profile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (checkError || !profile) {
          // Try to create profile manually if trigger didn't work
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: 'user',
            } as any)

          if (insertError) {
            console.error('Profile creation error:', insertError)
            setError('Account created but profile setup had issues. Please try logging in.')
          } else {
            setSuccess(true)
            setTimeout(() => router.push('/login?verified=true'), 1500)
          }
        } else {
          setSuccess(true)
          setTimeout(() => router.push('/login?verified=true'), 1500)
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-950 text-slate-100 selection:bg-brand-primary selection:text-white">
      {/* Left Visual Side */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-slate-900 border-r border-slate-800/80">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-primary/15 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-brand-secondary/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {brand?.display_name || 'Ifalode'}
          </Link>
        </div>

        <div className="relative z-10 max-w-lg my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold mb-6 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            Join the Community
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Begin your journey into <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">sacred wisdom</span>.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Create your account to access exclusive ebooks, enroll in masterclasses, and connect with a global community of seekers.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} {brand?.display_name || 'Ifalode'}. All rights reserved.
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {brand?.display_name || 'Ifalode'}
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-secondary transition">
                Sign in
              </Link>
            </p>
          </div>

          {success ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6 text-center">
              <p className="text-green-400 font-medium text-lg">✅ Account Created Successfully!</p>
              <p className="text-sm text-slate-400 mt-2">Redirecting to sign in...</p>
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSignup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition text-sm"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition text-sm"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition text-sm"
                    placeholder="Min 6 characters"
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand-primary text-white font-semibold rounded-xl shadow-lg shadow-brand-primary/20 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition active:scale-[0.98]"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
