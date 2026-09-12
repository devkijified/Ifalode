'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type ProductForm = {
  title: string
  description: string
  price: string
  cover_image: string
  file_url: string
  category: string
  is_ebook: boolean
  stock: string
}

const initialForm: ProductForm = {
  title: '',
  description: '',
  price: '0',
  cover_image: '',
  file_url: '',
  category: 'Digital Resource',
  is_ebook: true,
  stock: '1',
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

export default function NewProductPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductForm>(initialForm)
  const [error, setError] = useState<string | null>(null)

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
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
      return
    }

    setStatus('allowed')
  }, [router, supabase])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const updateForm = <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const createProduct = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Product title is required.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      cover_image: form.cover_image.trim() || null,
      file_url: form.file_url.trim() || null,
      category: form.category.trim() || null,
      is_ebook: form.is_ebook,
      stock: Math.max(0, Number(form.stock) || 0),
    }

    try {
      const { error: insertError } = await (
        supabase.from('products') as any
      ).insert(payload)

      if (insertError) throw insertError

      router.push('/admin/store')
      router.refresh()
    } catch (saveError: any) {
      console.error('Product create error:', saveError)
      setError(saveError?.message || 'Unable to create product.')
      setSaving(false)
    }
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
            You do not have permission to manage the store.
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin/store"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Store Management
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              New Product
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
              Product editor
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Create a product
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add an ebook, digital resource, or other product to the store.
            </p>
          </div>

          <form onSubmit={createProduct} className="grid md:grid-cols-2 gap-5">
            <FormField label="Product title" required className="md:col-span-2">
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                className={inputClassName}
                placeholder="Understanding Your Ori"
                required
              />
            </FormField>

            <FormField label="Category">
              <input
                value={form.category}
                onChange={(event) => updateForm('category', event.target.value)}
                className={inputClassName}
                placeholder="Ebook"
              />
            </FormField>

            <FormField label="Price">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => updateForm('price', event.target.value)}
                className={inputClassName}
                placeholder="0"
                required
              />
            </FormField>

            <FormField label="Cover image URL" className="md:col-span-2">
              <input
                value={form.cover_image}
                onChange={(event) => updateForm('cover_image', event.target.value)}
                className={inputClassName}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Download file URL" className="md:col-span-2">
              <input
                value={form.file_url}
                onChange={(event) => updateForm('file_url', event.target.value)}
                className={inputClassName}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Stock">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => updateForm('stock', event.target.value)}
                className={inputClassName}
                placeholder="1"
              />
            </FormField>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_ebook}
                  onChange={(event) => updateForm('is_ebook', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-brand-primary"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-200">
                    Digital product
                  </span>

                  <span className="block text-xs text-slate-500 mt-1">
                    Mark this product as an ebook or digital resource.
                  </span>
                </span>
              </label>
            </div>

            <FormField label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className={`${inputClassName} min-h-32 resize-y`}
                placeholder="Describe this product..."
              />
            </FormField>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {saving ? 'Creating...' : 'Create Product'}
              </button>

              <Link
                href="/admin/store"
                className="px-6 py-3 rounded-xl border border-slate-800 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                Cancel
              </Link>
            </div>
          </form>
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
