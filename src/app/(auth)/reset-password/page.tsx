'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session (user came from reset email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // No valid session - user might have clicked expired/invalid link
        setValidToken(false)
      } else {
        setValidToken(true)
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      // Sign out after successful password reset
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?reset=success')
      }, 2000)
    }
    setLoading(false)
  }

  // Show error if no valid session
  if (validToken === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h2>
            <p className="text-slate-400 mb-4">
              This password reset link is invalid or has expired.
            </p>
            <Link 
              href="/forgot-password" 
              className="inline-block px-6 py-2.5 bg-brand-primary text-white rounded-xl hover:opacity-90 transition"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Verifying...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create New Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-6 text-center">
            <p className="text-green-400 font-medium text-lg">✅ Password Reset Successfully!</p>
            <p className="text-sm text-slate-400 mt-1">Redirecting to sign in...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="sr-only">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-900 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm"
                  placeholder="New Password (min 6 characters)"
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-slate-700 bg-slate-900 placeholder-slate-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent sm:text-sm"
                  placeholder="Confirm Password"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition"
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link 
                href="/login" 
                className="text-slate-400 hover:text-brand-primary transition"
              >
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
