'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type Role = 'user' | 'admin'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
  updated_at: string
}

type RoleFilter = 'all' | Role

export default function AdminUsersPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return false
    }

    setCurrentUserId(user.id)

    const { data: profileData, error: profileError } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()) as {
      data: { role: string | null } | null
      error: { message: string } | null
    }

    if (profileError) {
      console.error('Admin profile error:', profileError.message)
      setStatus('denied')
      return false
    }

    if (profileData?.role !== 'admin') {
      setStatus('denied')
      return false
    }

    setStatus('allowed')
    return true
  }, [router, supabase])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = (await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })) as {
      data: Profile[] | null
      error: { message: string } | null
    }

    if (fetchError) {
      console.error('Users fetch error:', fetchError.message)
      setError(fetchError.message)
      setUsers([])
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchUsers()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchUsers])

  const toggleRole = async (profile: Profile) => {
    if (profile.id === currentUserId) {
      setError('You cannot change your own role.')
      return
    }

    const nextRole: Role = profile.role === 'admin' ? 'user' : 'admin'

    const confirmed = window.confirm(
      nextRole === 'admin'
        ? `Grant admin access to ${profile.email}?`
        : `Remove admin access from ${profile.email}?`,
    )

    if (!confirmed) return

    setUpdatingId(profile.id)
    setMessage(null)
    setError(null)

    const { data, error: updateError } = await (
      supabase.from('profiles') as any
    )
      .update({
        role: nextRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Role update error:', updateError)
      setError(updateError.message)
    } else {
      setUsers((current) =>
        current.map((item) =>
          item.id === profile.id ? (data as Profile) : item,
        ),
      )

      setMessage(
        `${profile.email} is now ${nextRole === 'admin' ? 'an admin' : 'a regular user'}.`,
      )
    }

    setUpdatingId(null)
  }

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      const matchesSearch =
        !query ||
        user.email.toLowerCase().includes(query) ||
        (user.full_name || '').toLowerCase().includes(query)

      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const adminCount = useMemo(
    () => users.filter((user) => user.role === 'admin').length,
    [users],
  )

  if (status === 'checking') {
    return <LoadingScreen text="Checking administrator access..." />
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl mb-5">🔒</p>

          <h1 className="text-2xl font-bold">Access denied</h1>

          <p className="mt-2 text-slate-500">
            You do not have permission to manage users.
          </p>

          <Link
            href="/admin"
            className="inline-flex mt-6 px-5 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Back to admin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              User Management
            </h1>
          </div>

          <span className="hidden sm:inline-flex text-sm text-slate-500">
            {users.length} user{users.length === 1 ? '' : 's'} · {adminCount} admin
            {adminCount === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="w-full sm:max-w-sm rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20"
            />

            <div className="flex items-center gap-2">
              {(['all', 'admin', 'user'] as RoleFilter[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setRoleFilter(option)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition ${
                    roleFilter === option
                      ? 'bg-brand-primary text-white'
                      : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-10 text-center text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-10 text-center">
              <p className="text-4xl mb-4">👤</p>
              <h3 className="text-lg font-bold">No users found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {user.full_name || '—'}
                        {user.id === currentUserId && (
                          <span className="ml-2 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                            You
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-400">{user.email}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            user.role === 'admin'
                              ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary'
                              : 'border-slate-700 bg-slate-950 text-slate-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleRole(user)}
                          disabled={
                            updatingId === user.id || user.id === currentUserId
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-40 ${
                            user.role === 'admin'
                              ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                              : 'border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10'
                          }`}
                        >
                          {updatingId === user.id
                            ? 'Updating...'
                            : user.role === 'admin'
                              ? 'Remove admin'
                              : 'Make admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  )
}
