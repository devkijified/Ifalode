'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Referral capture, mounted once in the root layout. A ?ref=CODE link
 * stores the code; once a session exists (right after signup, or on a
 * later visit), the code is claimed through the referrals API exactly
 * once per code. Renders nothing and never blocks the page.
 */
export function RefCapture() {
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const fromUrl = new URLSearchParams(window.location.search).get('ref')
        if (fromUrl) {
          localStorage.setItem('ifalode_ref', fromUrl.trim().toUpperCase())
        }

        const code = localStorage.getItem('ifalode_ref')
        if (!code) return
        if (localStorage.getItem('ifalode_ref_claimed') === code) return

        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session || cancelled) return

        const res = await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.ok) {
          localStorage.setItem('ifalode_ref_claimed', code)
          localStorage.removeItem('ifalode_ref')
        }
      } catch {
        // Referral capture is best effort; it must never break a page.
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
