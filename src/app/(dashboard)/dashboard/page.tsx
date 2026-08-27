'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBrand } from '@/hooks/useBrand'

export default function DashboardPage() {
  const { brand } = useBrand()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()
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
            <Link href="/dashboard" className="text-sm text-brand-primary font-semibold transition">Dashboard</Link>
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

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.user_metadata?.full_name || 'User'}!</h1>
        <p className="text-slate-400 mb-8">Here's your learning dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold mb-2">📚 My Ebooks</h3>
            <p className="text-3xl font-bold text-brand-primary">0</p>
            <p className="text-sm text-slate-400 mt-1">Ebooks purchased</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold mb-2">🎓 My Courses</h3>
            <p className="text-3xl font-bold text-brand-primary">0</p>
            <p className="text-sm text-slate-400 mt-1">Courses enrolled</p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold mb-2">📖 Learning Progress</h3>
            <p className="text-3xl font-bold text-brand-primary">0%</p>
            <p className="text-sm text-slate-400 mt-1">Average completion</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/store" className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-brand-primary/40 transition">
            <h3 className="text-lg font-semibold">📚 Browse Ebooks</h3>
            <p className="text-slate-400 text-sm mt-1">Discover new wisdom in our store</p>
          </Link>
          <Link href="/courses" className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-brand-primary/40 transition">
            <h3 className="text-lg font-semibold">🎓 Explore Courses</h3>
            <p className="text-slate-400 text-sm mt-1">Enroll in new masterclasses</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
