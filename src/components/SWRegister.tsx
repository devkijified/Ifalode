'use client'

import { useEffect } from 'react'

/** Registers the service worker so the installed app gets offline shell
    support and can receive push. Subscribing to push itself stays an
    explicit opt-in in Settings. */
export function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
