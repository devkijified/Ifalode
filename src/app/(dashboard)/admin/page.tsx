'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrandEditor } from '@/components/admin/BrandEditor'

type Status = 'loading' | 'denied' | 'allowed'

type Profile = {
  role: string | null
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<Status>('loading')
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (!cancelled) {
            router.replace('/login')
          }
          return
        }

        const { data: profileData, error: profileError } = (await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()) as {
          data: Profile | null
          error: { message: string } | null
        }

        if (profileError || !profileData) {
          console.error(
            'Error fetching profile:',
            profileError?.message || 'No profile found',
          )

          if (!cancelled) {
            setStatus('denied')
          }

          return
        }

        if (profileData.role !== 'admin') {
          if (!cancelled) {
            setStatus('denied')
          }

          return
        }

        if (!cancelled) {
          setStatus('allowed')
        }
      } catch (error) {
        console.error('Unexpected error in admin check:', error)

        if (!cancelled) {
          setStatus('denied')
        }
      }
    }

    checkAdmin()

    return () => {
      cancelled = true
    }
  }, [router, supabase])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
          <p className="text-slate-400">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="text-center">
          <p className="mb-5 text-5xl">🔒</p>

          <h1 className="text-2xl font-bold">Access denied</h1>

          <p className="mt-2 text-slate-500">
            You do not have administrator permission.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 py-10 text-slate-100">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-brand-primary">
              Ifalode administration
            </p>

            <h1 className="mt-2 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Manage your Ifalode platform from here.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            View website
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Brand Settings */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <BrandEditor />
          </section>

          {/* Management Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Store */}
            <AdminCard
              title="Store Management"
              links={[
                {
                  href: '/admin/store',
                  label: 'Manage Products',
                },
                {
                  href: '/admin/store/new',
                  label: 'Add New Product',
                },
              ]}
            />

            {/* LMS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-3 text-lg font-bold">
                LMS Management
              </h3>

              <div className="space-y-2">
                <Link
                  href="/admin/lms"
                  className="block text-sm text-slate-400 transition hover:text-brand-primary"
                >
                  Manage Courses
                </Link>

                <Link
                  href="/admin/lms/new"
                  className="block text-sm text-slate-400 transition hover:text-brand-primary"
                >
                  Create New Course
                </Link>

                <Link
                  href="/admin/lms/live-classes"
                  className="block text-sm font-semibold text-brand-primary transition hover:text-brand-secondary"
                >
                  🎥 Live Classes
                </Link>

                <Link
                  href="/admin/lms/live-classes/new"
                  className="block text-sm text-slate-400 transition hover:text-brand-primary"
                >
                  + Schedule Live Class
                </Link>
              </div>
            </div>

            {/* CMS */}
            <AdminCard
              title="Content Management"
              links={[
                {
                  href: '/admin/cms',
                  label: 'Edit Content',
                },
                {
                  href: '/admin/cms/pages',
                  label: 'Manage Pages',
                },
              ]}
            />

            {/* Users */}
            <AdminCard
              title="Users & Enrollments"
              links={[
                {
                  href: '/admin/users',
                  label: 'Manage Users',
                },
                {
                  href: '/admin/enrollments',
                  label: 'View Enrollments',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function AdminCard({
  title,
  links,
}: {
  title: string
  links: {
    href: string
    label: string
  }[]
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>

      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-slate-400 transition hover:text-brand-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
