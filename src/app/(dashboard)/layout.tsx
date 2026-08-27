'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useBrand } from '@/hooks/useBrand'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { brand } = useBrand()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            {brand?.display_name || 'Ifalode'}
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/store" className="text-sm hover:text-brand-primary transition">Store</Link>
            <Link href="/courses" className="text-sm hover:text-brand-primary transition">Courses</Link>
            <Link href="/admin" className="text-sm hover:text-brand-primary transition">Admin</Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
