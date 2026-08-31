'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandEditor } from '@/components/admin/BrandEditor'

type Status = 'loading' | 'denied' | 'allowed'

export default function AdminDashboard() {
  const [status, setStatus] = useState<Status>('loading')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) router.push('/login')
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          console.error('Error fetching profile:', error?.message || 'No profile')
          if (!cancelled) router.push('/')
          return
        }

        const role = (profile as { role?: string }).role

        if (role !== 'admin') {
          if (!cancelled) setStatus('denied')
          return
        }

        if (!cancelled) setStatus('allowed')
      } catch (err) {
        console.error('Unexpected error in admin check:', err)
        if (!cancelled) router.push('/')
      }
    }

    checkAdmin()

    return () => {
      cancelled = true
    }
  }, [router, supabase])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Access denied</div>
      </div>
    )
  }

  // status === 'allowed'
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="container mx-auto px-4">

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Manage your Ifalode platform from here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">

          {/* Brand Editor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold mb-4">Brand Settings</h2>
            <BrandEditor />
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Store */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-bold mb-3">Store Management</h3>
              <div className="space-y-2">
                <a
                  href="/admin/store"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Manage Products
                </a>
                <a
                  href="/admin/store/new"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Add New Product
                </a>
              </div>
            </div>

            {/* LMS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-bold mb-3">LMS Management</h3>
              <div className="space-y-2">
                <a
                  href="/admin/lms"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Manage Courses
                </a>
                <a
                  href="/admin/lms/new"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Create New Course
                </a>
              </div>
            </div>

            {/* CMS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-bold mb-3">Content Management</h3>
              <div className="space-y-2">
                <a
                  href="/admin/cms"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Edit Content
                </a>
                <a
                  href="/admin/cms/pages"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Manage Pages
                </a>
              </div>
            </div>

            {/* Users */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-lg font-bold mb-3">Users & Enrollments</h3>
              <div className="space-y-2">
                <a
                  href="/admin/users"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  Manage Users
                </a>
                <a
                  href="/admin/enrollments"
                  className="block text-sm text-slate-400 hover:text-brand-primary transition"
                >
                  View Enrollments
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
