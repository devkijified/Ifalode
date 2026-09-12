'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AdminStatus = 'checking' | 'allowed' | 'denied'

type BrandSettings = {
  id: string
  brand_name: string | null
  display_name: string | null
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_family: string | null
  logo_url: string | null
  favicon_url: string | null
  meta_title: string | null
  meta_description: string | null
  updated_at: string
}

type SettingsForm = {
  brand_name: string
  display_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  logo_url: string
  favicon_url: string
  meta_title: string
  meta_description: string
}

const initialForm: SettingsForm = {
  brand_name: 'IfaLode',
  display_name: 'IfaLode',
  primary_color: '#8B5E3C',
  secondary_color: '#D4A574',
  accent_color: '#C41E3A',
  font_family: 'Inter',
  logo_url: '',
  favicon_url: '',
  meta_title: '',
  meta_description: '',
}

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20'

const colorFields: { key: keyof SettingsForm; label: string }[] = [
  { key: 'primary_color', label: 'Primary color' },
  { key: 'secondary_color', label: 'Secondary color' },
  { key: 'accent_color', label: 'Accent color' },
]

export default function AdminCmsPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const [status, setStatus] = useState<AdminStatus>('checking')
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<SettingsForm>(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

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

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = (await supabase
      .from('brand_settings')
      .select('*')
      .limit(1)
      .maybeSingle()) as {
      data: BrandSettings | null
      error: { message: string } | null
    }

    if (fetchError) {
      console.error('Brand settings fetch error:', fetchError.message)
      setError(fetchError.message)
    } else if (data) {
      setSettingsId(data.id)
      setLastUpdated(data.updated_at)
      setForm({
        brand_name: data.brand_name || '',
        display_name: data.display_name || '',
        primary_color: data.primary_color || '#8B5E3C',
        secondary_color: data.secondary_color || '#D4A574',
        accent_color: data.accent_color || '#C41E3A',
        font_family: data.font_family || 'Inter',
        logo_url: data.logo_url || '',
        favicon_url: data.favicon_url || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
      })
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const isAdmin = await checkAdmin()

      if (isAdmin && !cancelled) {
        await fetchSettings()
      } else if (!cancelled) {
        setLoading(false)
      }
    }

    initialise()

    return () => {
      cancelled = true
    }
  }, [checkAdmin, fetchSettings])

  const updateForm = <K extends keyof SettingsForm>(
    field: K,
    value: SettingsForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const saveSettings = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      brand_name: form.brand_name.trim() || null,
      display_name: form.display_name.trim() || null,
      primary_color: form.primary_color.trim() || null,
      secondary_color: form.secondary_color.trim() || null,
      accent_color: form.accent_color.trim() || null,
      font_family: form.font_family.trim() || null,
      logo_url: form.logo_url.trim() || null,
      favicon_url: form.favicon_url.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (settingsId) {
        const { data, error: updateError } = await (
          supabase.from('brand_settings') as any
        )
          .update(payload)
          .eq('id', settingsId)
          .select('*')
          .single()

        if (updateError) throw updateError

        setLastUpdated((data as BrandSettings).updated_at)
        setMessage('Site settings updated successfully.')
      } else {
        const { data, error: insertError } = await (
          supabase.from('brand_settings') as any
        )
          .insert(payload)
          .select('*')
          .single()

        if (insertError) throw insertError

        setSettingsId((data as BrandSettings).id)
        setLastUpdated((data as BrandSettings).updated_at)
        setMessage('Site settings created successfully.')
      }
    } catch (saveError: any) {
      console.error('Brand settings save error:', saveError)
      setError(saveError?.message || 'Unable to save settings.')
    } finally {
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
            You do not have permission to manage site content.
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm text-slate-500 hover:text-white transition"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight">
              Site Content & Branding
            </h1>
          </div>

          {lastUpdated && (
            <span className="hidden sm:inline-flex text-xs text-slate-500">
              Last updated {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-500">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={saveSettings} className="space-y-8">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Branding
              </p>

              <h2 className="mt-2 text-2xl font-bold">Brand identity</h2>

              <p className="mt-2 text-sm text-slate-500">
                Controls the name, logo, and colors used across the site.
              </p>

              <div className="mt-6 grid md:grid-cols-2 gap-5">
                <FormField label="Brand name">
                  <input
                    value={form.brand_name}
                    onChange={(event) =>
                      updateForm('brand_name', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="IfaLode"
                  />
                </FormField>

                <FormField label="Display name">
                  <input
                    value={form.display_name}
                    onChange={(event) =>
                      updateForm('display_name', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="IfaLode"
                  />
                </FormField>

                <FormField label="Logo URL" className="md:col-span-2">
                  <input
                    value={form.logo_url}
                    onChange={(event) =>
                      updateForm('logo_url', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </FormField>

                <FormField label="Favicon URL" className="md:col-span-2">
                  <input
                    value={form.favicon_url}
                    onChange={(event) =>
                      updateForm('favicon_url', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </FormField>

                <FormField label="Font family">
                  <input
                    value={form.font_family}
                    onChange={(event) =>
                      updateForm('font_family', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Inter"
                  />
                </FormField>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                Theme
              </p>

              <h2 className="mt-2 text-2xl font-bold">Colors</h2>

              <p className="mt-2 text-sm text-slate-500">
                Used for buttons, links, and accents site-wide.
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-5">
                {colorFields.map(({ key, label }) => (
                  <FormField key={key} label={label}>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form[key] || '#000000'}
                        onChange={(event) =>
                          updateForm(key, event.target.value)
                        }
                        className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-800 bg-slate-950"
                      />

                      <input
                        value={form[key]}
                        onChange={(event) =>
                          updateForm(key, event.target.value)
                        }
                        className={inputClassName}
                        placeholder="#000000"
                      />
                    </div>
                  </FormField>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
              <p className="text-xs uppercase tracking-[.2em] text-brand-primary font-bold">
                SEO
              </p>

              <h2 className="mt-2 text-2xl font-bold">Meta tags</h2>

              <p className="mt-2 text-sm text-slate-500">
                Shown in search results and social previews.
              </p>

              <div className="mt-6 grid gap-5">
                <FormField label="Meta title">
                  <input
                    value={form.meta_title}
                    onChange={(event) =>
                      updateForm('meta_title', event.target.value)
                    }
                    className={inputClassName}
                    placeholder="IfaLode — Learn, grow, connect"
                  />
                </FormField>

                <FormField label="Meta description">
                  <textarea
                    value={form.meta_description}
                    onChange={(event) =>
                      updateForm('meta_description', event.target.value)
                    }
                    className={`${inputClassName} min-h-28 resize-y`}
                    placeholder="Describe your site for search engines..."
                  />
                </FormField>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

function FormField({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
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
