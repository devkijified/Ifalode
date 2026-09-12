'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type Page = {
  id: string
  title: string
  slug: string
  content: string | null
  meta_title: string | null
  meta_description: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

type PageForm = {
  title: string
  slug: string
  content: string
  meta_title: string
  meta_description: string
  is_published: boolean
}

const initialForm: PageForm = {
  title: '',
  slug: '',
  content: '',
  meta_title: '',
  meta_description: '',
  is_published: false,
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminPagesPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [form, setForm] = useState<PageForm>(initialForm)
  const [slugTouched, setSlugTouched] = useState(false)
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

    const { data: profileData, error: profileError } = (await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()) as {
      data: { role: string | null } | null
      error: { message: string } | null
    }

    if (profileError || profileData?.role !== 'admin') {
      setStatus('denied')
      return false
    }

    setStatus('allowed')
    return true
  }, [router, supabase])

  const fetchPages = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = (await supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false })) as {
      data: Page[] | null
      error: { message: string } | null
    }

    if (fetchError) {
      console.error('Pages fetch error:', fetchError.message)
      setError(fetchError.message)
      setPages([])
    } else {
      setPages(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchPages()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchPages])

  const updateForm = <K extends keyof PageForm>(
    field: K,
    value: PageForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleTitleChange = (value: string) => {
    updateForm('title', value)

    if (!slugTouched) {
      updateForm('slug', slugify(value))
    }
  }

  const openCreateForm = () => {
    setEditingPage(null)
    setForm(initialForm)
    setSlugTouched(false)
    setMessage(null)
    setError(null)
  }

  const openEditForm = (page: Page) => {
    setEditingPage(page)
    setSlugTouched(true)

    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      is_published: page.is_published,
    })

    setMessage(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingPage(null)
    setForm(initialForm)
    setSlugTouched(false)
    setMessage(null)
    setError(null)
  }

  const savePage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Page title is required.')
      return
    }

    const slug = slugify(form.slug || form.title)

    if (!slug) {
      setError('A valid slug is required.')
      return
    }

    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      title: form.title.trim(),
      slug,
      content: form.content.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingPage) {
        const { data, error: updateError } = await (
          supabase.from('pages') as any
        )
          .update(payload)
          .eq('id', editingPage.id)
          .select('*')
          .single()

        if (updateError) throw updateError

        setPages((current) =>
          current.map((page) =>
            page.id === editingPage.id ? (data as Page) : page,
          ),
        )

        setMessage('Page updated successfully.')
      } else {
        const { data, error: insertError } = await (
          supabase.from('pages') as any
        )
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setPages((current) => [data as Page, ...current])
        setMessage('Page created successfully.')
      }

      setEditingPage(null)
      setForm(initialForm)
      setSlugTouched(false)
    } catch (saveError: any) {
      console.error('Page save error:', saveError)

      const isDuplicateSlug = saveError?.code === '23505'

      setError(
        isDuplicateSlug
          ? 'That slug is already in use — choose a different one.'
          : saveError?.message || 'Unable to save page.',
      )
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (page: Page) => {
    const { data, error: updateError } = await (
      supabase.from('pages') as any
    )
      .update({
        is_published: !page.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPages((current) =>
      current.map((item) => (item.id === page.id ? (data as Page) : item)),
    )
  }

  const deletePage = async (page: Page) => {
    const confirmed = window.confirm(
      `Delete "${page.title}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(page.id)
    setMessage(null)
    setError(null)

    const { error: deleteError } = await (supabase.from('pages') as any)
      .delete()
      .eq('id', page.id)

    if (deleteError) {
      console.error('Page delete error:', deleteError)
      setError(deleteError.message)
    } else {
      setPages((current) => current.filter((item) => item.id !== page.id))
      setMessage('Page deleted successfully.')

      if (editingPage?.id === page.id) {
        cancelEdit()
      }
    }

    setDeletingId(null)
  }

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
            You do not have permission to manage site pages.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin/cms"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Site Content & Branding
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              Pages
            </h1>
          </div>

          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <span>+</span>
            New Page
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Page editor
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingPage ? 'Edit page' : 'Create a page'}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Static pages like About, FAQ, or Terms of Service.
              </p>
            </div>

            {editingPage && (
              <button
                onClick={cancelEdit}
                type="button"
                className="text-sm text-slate-500 hover:text-white transition"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={savePage} className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-5">
              <FormField label="Page title" required>
                <input
                  value={form.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  className={inputClassName}
                  placeholder="About Us"
                  required
                />
              </FormField>

              <FormField label="Slug" required>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 shrink-0">/</span>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugTouched(true)
                      updateForm('slug', event.target.value)
                    }}
                    className={inputClassName}
                    placeholder="about-us"
                    required
                  />
                </div>
              </FormField>
            </div>

            <FormField label="Content">
              <textarea
                value={form.content}
                onChange={(event) => updateForm('content', event.target.value)}
                className={`${inputClassName} min-h-56 resize-y font-mono`}
                placeholder="Write the page content here (Markdown or HTML)..."
              />
            </FormField>

            <div className="grid md:grid-cols-2 gap-5">
              <FormField label="Meta title">
                <input
                  value={form.meta_title}
                  onChange={(event) =>
                    updateForm('meta_title', event.target.value)
                  }
                  className={inputClassName}
                  placeholder="About Us — IfaLode"
                />
              </FormField>

              <FormField label="Meta description">
                <input
                  value={form.meta_description}
                  onChange={(event) =>
                    updateForm('meta_description', event.target.value)
                  }
                  className={inputClassName}
                  placeholder="Learn more about IfaLode..."
                />
              </FormField>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(event) =>
                    updateForm('is_published', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-brand-primary"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-200">
                    Published
                  </span>

                  <span className="block text-xs text-slate-500 mt-1">
                    Visible to site visitors when checked.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {saving
                  ? 'Saving...'
                  : editingPage
                    ? 'Update Page'
                    : 'Create Page'}
              </button>

              {editingPage && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 rounded-xl border border-slate-800 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                All pages
              </p>

              <h2 className="mt-2 text-2xl font-bold">Pages</h2>
            </div>

            <span className="text-sm text-slate-500">
              {pages.length} page{pages.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              Loading pages...
            </div>
          ) : pages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-4xl mb-4">📄</p>
              <h3 className="text-lg font-bold">No pages yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Create your first page above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Slug</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Updated</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-200">
                        {page.title}
                      </td>

                      <td className="px-4 py-3 text-slate-500">/{page.slug}</td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePublished(page)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${
                            page.is_published
                              ? 'border-green-500/30 bg-green-500/10 text-green-400'
                              : 'border-slate-700 bg-slate-950 text-slate-400'
                          }`}
                        >
                          {page.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {new Date(page.updated_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(page)}
                            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deletePage(page)}
                            disabled={deletingId === page.id}
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {deletingId === page.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
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

function FormField({
  label,
  required = false,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="ml-1 text-brand-primary">*</span>}
      </span>
      {children}
    </label>
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
