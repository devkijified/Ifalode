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
  }, [supabase])

  const handleChange = (field: string, value: string) => {
    setBrand((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
    return (
      <div className="bg-teal-950 text-teal-200 p-6 rounded-xl border border-teal-800">
        Loading brand settings...
      </div>
    )
  }

  return (
    <div className="bg-teal-950 rounded-xl shadow-sm p-6 text-white border border-teal-800/60">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Brand Settings</h2>
        <button
          type="button"
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 font-medium transition"
        >
          Cancel
        </button>
      </div>

      {message && (
        <div className="mb-4 text-sm text-teal-200 bg-teal-900/50 p-3 rounded-lg border border-teal-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-teal-100">
            Brand Name
          </label>
          <input
            className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            type="text"
            value={brand?.brand_name || ''}
            onChange={(e) => handleChange('brand_name', e.target.value)}
            name="brand_name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-teal-100">
            Display Name
          </label>
          <input
            className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            type="text"
            value={brand?.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            name="display_name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">
              Primary Color
            </label>
            <input
              className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              type="color"
              value={brand?.primary_color || '#8B5E3C'}
              onChange={(e) => handleChange('primary_color', e.target.value)}
              name="primary_color"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">
              Secondary Color
            </label>
            <input
              className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              type="color"
              value={brand?.secondary_color || '#D4A574'}
              onChange={(e) => handleChange('secondary_color', e.target.value)}
              name="secondary_color"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">
              Accent Color
            </label>
            <input
              className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              type="color"
              value={brand?.accent_color || '#C41E3A'}
              onChange={(e) => handleChange('accent_color', e.target.value)}
              name="accent_color"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-teal-100">
            Font Family
          </label>
          <input
            className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            type="text"
            value={brand?.font_family || ''}
            onChange={(e) => handleChange('font_family', e.target.value)}
            name="font_family"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-teal-100">
            Meta Title (SEO)
          </label>
          <input
            className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            type="text"
            value={brand?.meta_title || ''}
            onChange={(e) => handleChange('meta_title', e.target.value)}
            name="meta_title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-teal-100">
            Meta Description (SEO)
          </label>
          <input
            className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            type="text"
            value={brand?.meta_description || ''}
            onChange={(e) => handleChange('meta_description', e.target.value)}
            name="meta_description"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 font-semibold transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Brand Settings'}
        </button>
      </form>
    </div>
  )
}
