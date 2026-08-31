'use client'

import { useState } from 'react'
import { useBrand } from '@/hooks/useBrand'
import { BrandSettings } from '@/types'

export const BrandEditor = () => {
  const { brand, updateBrand } = useBrand()
  const [formData, setFormData] = useState<Partial<BrandSettings>>({})
  const [isEditing, setIsEditing] = useState(false)

  if (!brand) return <div className="text-teal-200 p-6 bg-teal-950 rounded-xl">Loading...</div>

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await updateBrand(formData)
    if (result.success) {
      setIsEditing(false)
      alert('Brand settings updated successfully!')
    }
  }

  return (
    <div className="bg-teal-950 rounded-xl shadow-sm p-6 text-white border border-teal-800/60">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Brand Settings</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-95 transition"
        >
          {isEditing ? 'Cancel' : 'Edit Brand'}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">Brand Name</label>
            <input
              type="text"
              name="brand_name"
              defaultValue={brand.brand_name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">Display Name</label>
            <input
              type="text"
              name="display_name"
              defaultValue={brand.display_name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-100">Primary Color</label>
              <input
                type="color"
                name="primary_color"
                defaultValue={brand.primary_color}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-100">Secondary Color</label>
              <input
                type="color"
                name="secondary_color"
                defaultValue={brand.secondary_color}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-100">Accent Color</label>
              <input
                type="color"
                name="accent_color"
                defaultValue={brand.accent_color}
                onChange={handleChange}
                className="w-full h-12 rounded-lg cursor-pointer bg-teal-900 border border-teal-700 p-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">Font Family</label>
            <input
              type="text"
              name="font_family"
              defaultValue={brand.font_family}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">Meta Title (SEO)</label>
            <input
              type="text"
              name="meta_title"
              defaultValue={brand.meta_title || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-teal-100">Meta Description (SEO)</label>
            <input
              type="text"
              name="meta_description"
              defaultValue={brand.meta_description || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-teal-900 border border-teal-700 rounded-lg focus:ring-2 focus:ring-brand-primary text-white placeholder-teal-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-primary text-white rounded-lg hover:opacity-95 font-semibold transition"
          >
            Save Brand Settings
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-teal-300">Brand Name</p>
              <p className="font-semibold text-white">{brand.brand_name}</p>
            </div>
            <div>
              <p className="text-sm text-teal-300">Display Name</p>
              <p className="font-semibold text-white">{brand.display_name}</p>
            </div>
            <div>
              <p className="text-sm text-teal-300">Primary Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border border-teal-700" 
                  style={{ backgroundColor: brand.primary_color }}
                />
                <span className="text-white">{brand.primary_color}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-teal-300">Font Family</p>
              <p className="font-semibold text-white">{brand.font_family}</p>
            </div>
          </div>
          {brand.meta_title && (
            <div>
              <p className="text-sm text-teal-300">Meta Title</p>
              <p className="font-semibold text-white">{brand.meta_title}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
