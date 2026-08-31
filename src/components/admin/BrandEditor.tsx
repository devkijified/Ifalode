'use client'

import { useState, useEffect } from 'react'
import { useBrand } from '@/hooks/useBrand'
import { BrandSettings } from '@/types'

export const BrandEditor = () => {
  const { brand, updateBrand, loading } = useBrand()
  const [formData, setFormData] = useState<Partial<BrandSettings>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Reset form when brand changes
  useEffect(() => {
    if (brand && isEditing) {
      setFormData({
        brand_name: brand.brand_name,
        display_name: brand.display_name,
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        accent_color: brand.accent_color,
        font_family: brand.font_family,
        meta_title: brand.meta_title || '',
        meta_description: brand.meta_description || '',
      })
    }
  }, [brand])

  if (loading) {
    return <div className="text-slate-400 p-6 bg-slate-900 rounded-xl">Loading brand settings...</div>
  }

  if (!brand) {
    return <div className="text-slate-400 p-6 bg-slate-900 rounded-xl">No brand settings found.</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await updateBrand(formData)

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Brand settings updated successfully!' })
      // Force close edit mode after successful update
      setIsEditing(false)
      // Reset form data to empty
      setFormData({})
      // Refetch brand data will happen via the hook
    } else {
      setMessage({ 
        type: 'error', 
        text: result.error?.message || '❌ Failed to update brand settings' 
      })
    }

    setSaving(false)
  }

  const startEditing = () => {
    // Populate form with current brand data
    setFormData({
      brand_name: brand.brand_name,
      display_name: brand.display_name,
      primary_color: brand.primary_color,
      secondary_color: brand.secondary_color,
      accent_color: brand.accent_color,
      font_family: brand.font_family,
      meta_title: brand.meta_title || '',
      meta_description: brand.meta_description || '',
    })
    setIsEditing(true)
    setMessage(null)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setFormData({})
    setMessage(null)
  }

  return (
    <div className="bg-slate-900 rounded-xl shadow-sm p-6 text-white border border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Brand Settings</h2>
        {!isEditing ? (
          <button
            onClick={startEditing}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
          >
            Edit Brand
          </button>
        ) : (
          <button
            onClick={cancelEditing}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/40 text-green-300'
            : 'bg-red-500/20 border border-red-500/40 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Show current values when not editing */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Brand Name</p>
              <p className="font-semibold text-white">{brand.brand_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Display Name</p>
              <p className="font-semibold text-white">{brand.display_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Primary Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border border-slate-700" 
                  style={{ backgroundColor: brand.primary_color }}
                />
                <span className="text-white">{brand.primary_color}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Secondary Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border border-slate-700" 
                  style={{ backgroundColor: brand.secondary_color }}
                />
                <span className="text-white">{brand.secondary_color}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Accent Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border border-slate-700" 
                  style={{ backgroundColor: brand.accent_color }}
                />
                <span className="text-white">{brand.accent_color}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Font Family</p>
              <p className="font-semibold text-white">{brand.font_family}</p>
            </div>
          </div>
          {brand.meta_title && (
            <div>
              <p className="text-sm text-slate-400">Meta Title</p>
              <p className="font-semibold text-white">{brand.meta_title}</p>
            </div>
          )}
          {brand.meta_description && (
            <div>
              <p className="text-sm text-slate-400">Meta Description</p>
              <p className="font-semibold text-white">{brand.meta_description}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Brand Name</label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-slate-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Display Name</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Primary Color</label>
              <input
                type="color"
                name="primary_color"
                value={formData.primary_color || '#8B5E3C'}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Secondary Color</label>
              <input
                type="color"
                name="secondary_color"
                value={formData.secondary_color || '#D4A574'}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Accent Color</label>
              <input
                type="color"
                name="accent_color"
                value={formData.accent_color || '#C41E3A'}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Font Family</label>
            <input
              type="text"
              name="font_family"
              value={formData.font_family || 'Inter'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Meta Title (SEO)</label>
            <input
              type="text"
              name="meta_title"
              value={formData.meta_title || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Meta Description (SEO)</label>
            <input
              type="text"
              name="meta_description"
              value={formData.meta_description || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-brand-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-semibold hover:bg-slate-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
