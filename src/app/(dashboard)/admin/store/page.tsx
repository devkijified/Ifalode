'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type Product = {
  id: string
  title: string
  description: string | null
  price: number
  cover_image: string | null
  file_url: string | null
  category: string | null
  is_ebook: boolean
  stock: number
  created_at: string
  updated_at: string
}

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

export default function AdminStorePage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(initialForm)
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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = (await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })) as {
      data: Product[] | null
      error: { message: string } | null
    }

    if (fetchError) {
      console.error('Products fetch error:', fetchError.message)
      setError(fetchError.message)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchProducts()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchProducts])

  const updateForm = <K extends keyof ProductForm>(
    field: K,
    value: ProductForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openCreateForm = () => {
    setEditingProduct(null)
    setForm(initialForm)
    setMessage(null)
    setError(null)
  }

  const openEditForm = (product: Product) => {
    setEditingProduct(product)

    setForm({
      title: product.title,
      description: product.description || '',
      price: String(product.price ?? 0),
      cover_image: product.cover_image || '',
      file_url: product.file_url || '',
      category: product.category || '',
      is_ebook: product.is_ebook,
      stock: String(product.stock ?? 0),
    })

    setMessage(null)
    setError(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const cancelEdit = () => {
    setEditingProduct(null)
    setForm(initialForm)
    setMessage(null)
    setError(null)
  }

  const saveProduct = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Product title is required.')
      return
    }

    setSaving(true)
    setMessage(null)
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
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingProduct) {
        const { data, error: updateError } = await (
          supabase.from('products') as any
        )
          .update(payload)
          .eq('id', editingProduct.id)
          .select('*')
          .single()

        if (updateError) throw updateError

        setProducts((current) =>
          current.map((product) =>
            product.id === editingProduct.id
              ? (data as Product)
              : product,
          ),
        )

        setMessage('Product updated successfully.')
      } else {
        const { data, error: insertError } = await (
          supabase.from('products') as any
        )
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setProducts((current) => [data as Product, ...current])
        setMessage('Product created successfully.')
      }

      setEditingProduct(null)
      setForm(initialForm)
    } catch (saveError: any) {
      console.error('Product save error:', saveError)
      setError(saveError?.message || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.title}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingId(product.id)
    setMessage(null)
    setError(null)

    const { error: deleteError } = await (
      supabase.from('products') as any
    )
      .delete()
      .eq('id', product.id)

    if (deleteError) {
      console.error('Product delete error:', deleteError)
      setError(deleteError.message)
    } else {
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      )

      setMessage('Product deleted successfully.')

      if (editingProduct?.id === product.id) {
        cancelEdit()
      }
    }

    setDeletingId(null)
  }

  const updateStock = async (product: Product, value: number) => {
    const stock = Math.max(0, value)

    const { data, error: updateError } = await (
      supabase.from('products') as any
    )
      .update({
        stock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)
      .select('*')
      .single()

    if (updateError) {
      setError(updateError.message)
      return
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? (data as Product) : item,
      ),
    )

    setMessage('Stock updated.')
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              Store Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/store"
              className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-slate-800 text-sm text-slate-300 hover:bg-slate-900 hover:text-white transition"
            >
              View Store
            </Link>

            <button
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <span>+</span>
              New Product
            </button>
          </div>
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
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Product editor
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {editingProduct ? 'Edit product' : 'Create a product'}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Add ebooks, digital resources, and other products.
              </p>
            </div>

            {editingProduct && (
              <button
                onClick={cancelEdit}
                type="button"
                className="text-sm text-slate-500 hover:text-white transition"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form
            onSubmit={saveProduct}
            className="grid md:grid-cols-2 gap-5"
          >
            <FormField
              label="Product title"
              required
              className="md:col-span-2"
            >
              <input
                value={form.title}
                onChange={(event) =>
                  updateForm('title', event.target.value)
                }
                className={inputClassName}
                placeholder="Understanding Your Ori"
                required
              />
            </FormField>

            <FormField label="Category">
              <input
                value={form.category}
                onChange={(event) =>
                  updateForm('category', event.target.value)
                }
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
                onChange={(event) =>
                  updateForm('price', event.target.value)
                }
                className={inputClassName}
                placeholder="0"
                required
              />
            </FormField>

            <FormField
              label="Cover image URL"
              className="md:col-span-2"
            >
              <input
                value={form.cover_image}
                onChange={(event) =>
                  updateForm('cover_image', event.target.value)
                }
                className={inputClassName}
                placeholder="https://..."
              />
            </FormField>

            <FormField
              label="Download file URL"
              className="md:col-span-2"
            >
              <input
                value={form.file_url}
                onChange={(event) =>
                  updateForm('file_url', event.target.value)
                }
                className={inputClassName}
                placeholder="https://..."
              />
            </FormField>

            <FormField label="Stock">
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  updateForm('stock', event.target.value)
                }
                className={inputClassName}
                placeholder="1"
              />
            </FormField>

            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_ebook}
                  onChange={(event) =>
                    updateForm('is_ebook', event.target.checked)
                  }
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
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
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
                {saving
                  ? 'Saving...'
                  : editingProduct
                    ? 'Update Product'
                    : 'Create Product'}
              </button>

              {editingProduct && (
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
                Your store
              </p>

              <h2 className="mt-2 text-2xl font-bold">Products</h2>
            </div>

            <span className="text-sm text-slate-500">
              {products.length} product
              {products.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-4xl mb-4">🛍️</p>

              <h3 className="text-lg font-bold">No products yet</h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first product above.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  deleting={deletingId === product.id}
                  onEdit={() => openEditForm(product)}
                  onDelete={() => deleteProduct(product)}
                  onStockChange={(value) =>
                    updateStock(product, value)
                  }
                />
              ))}
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

        {required && (
          <span className="ml-1 text-brand-primary">*</span>
        )}
      </span>

      {children}
    </label>
  )
}

function ProductCard({
  product,
  deleting,
  onEdit,
  onDelete,
  onStockChange,
}: {
  product: Product
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
  onStockChange: (value: number) => void
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-primary/20 via-slate-900 to-slate-950">
        {product.cover_image ? (
          <img
            src={product.cover_image}
            alt={product.title}
            className="h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            📖
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />

        <div className="absolute bottom-4 left-5 flex items-center gap-2">
          <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary">
            {product.category || 'Product'}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
            {product.is_ebook ? 'Digital' : 'Physical'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {product.title}
            </h3>

            <p className="mt-1 text-sm font-semibold text-brand-primary">
              {product.price > 0 ? `$${product.price}` : 'Free'}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${
              product.stock > 0
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-red-500/30 bg-red-500/10 text-red-400'
            }`}
          >
            {product.stock > 0 ? 'Available' : 'Out of stock'}
          </span>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {product.description || 'No description provided.'}
        </p>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-800 pt-4">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Stock

            <input
              type="number"
              min="0"
              value={product.stock}
              onChange={(event) =>
                onStockChange(Number(event.target.value))
              }
              className="w-20 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-brand-primary/50"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/store"
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            View Store
          </Link>

          {product.file_url && (
            <a
              href={product.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              Open File
            </a>
          )}

          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Edit
          </button>

          <button
            onClick={onDelete}
            disabled={deleting}
            className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
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
