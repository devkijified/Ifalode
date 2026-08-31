'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function BrandEditor() {
  const [brand, setBrand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchBrand = async () => {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .single()

      if (!error && data) {
        setBrand(data)
      }
      setLoading(false)
    }

    fetchBrand()
  }, [])

  const handleChange = (field: string, value: string) => {
    setBrand((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('brand_settings')
        .upsert({ id: 1, ...brand })

      if (error) throw error

      setMessage('Saved successfully')
      setTimeout(() => setMessage(null), 2000)
    } catch (err: any) {
      setMessage('Error saving: ' + (err?.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-slate-400 bg-slate-900 p-4">Loading brand settings...</div>
  }

  return (
    <div className="space-y-5 bg-slate-900 text-slate-100">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-100">Edit Brand</h3>
        {message && (
          <span className="text-xs text-slate-400">{message}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Brand Name
          </label>
          <input
            type="text"
            value={brand?.brand_name || ''}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="Ifalode"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={brand?.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="Ifalode"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Primary Color
          </label>
          <input
            type="text"
            value={brand?.primary_color || ''}
            onChange={(e) => handleChange('primary_color', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="#your-color"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Secondary Color
          </label>
          <input
            type="text"
            value={brand?.secondary_color || ''}
            onChange={(e) => handleChange('secondary_color', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="#your-color"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Accent Color
          </label>
          <input
            type="text"
            value={brand?.accent_color || ''}
            onChange={(e) => handleChange('accent_color', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="#your-color"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Font Family
          </label>
          <input
            type="text"
            value={brand?.font_family || ''}
            onChange={(e) => handleChange('font_family', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="Inter, system-ui, sans-serif"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Meta Title (SEO)
          </label>
          <input
            type="text"
            value={brand?.meta_title || ''}
            onChange={(e) => handleChange('meta_title', e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="Ifalode – Knowledge, Learning, Growth"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Meta Description (SEO)
          </label>
          <textarea
            value={brand?.meta_description || ''}
            onChange={(e) => handleChange('meta_description', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="A personal ecosystem for learning, ideas, digital products and growth."
          />
        </div>

      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Brand Settings'}
        </button>

        <button
          type="button"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Cancel
        </button>
      </div>

    </div>
  )
}
