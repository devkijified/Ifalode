'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'courses' | 'users'>('brand')
  const [brand, setBrand] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Fetch Brand Settings
      const { data: brandData } = await supabase
        .from('brand_settings')
        .select('*')
        .single()

      if (brandData) setBrand(brandData)

      // Fetch Courses List
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (coursesData) setCourses(coursesData)

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleChange = (field: string, value: string) => {
    setBrand((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSaveBrand = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('brand_settings')
        .upsert({ id: 1, ...brand })

      if (error) throw error

      setMessage('Brand settings saved successfully!')
      setTimeout(() => setMessage(null), 2500)
    } catch (err: any) {
      setMessage('Error saving: ' + (err?.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-slate-400 p-6">Loading admin control center...</div>
  }

  return (
    <div className="space-y-6">
      {/* Admin Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Admin Control Center</h1>
          <p className="text-slate-400 text-sm mt-1">Manage global platform configurations, courses, and settings.</p>
        </div>

        <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'brand' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Brand & SEO
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'courses' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-brand-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Users & Roles
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs text-brand-primary font-medium">
          {message}
        </div>
      )}

      {/* Tab 1: Brand & SEO Settings */}
      {activeTab === 'brand' && (
        <div className="space-y-5 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white">Brand Settings</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Brand Name</label>
              <input
                type="text"
                value={brand?.brand_name || ''}
                onChange={(e) => handleChange('brand_name', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={brand?.display_name || ''}
                onChange={(e) => handleChange('display_name', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Primary Color</label>
              <input
                type="text"
                value={brand?.primary_color || ''}
                onChange={(e) => handleChange('primary_color', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Secondary Color</label>
              <input
                type="text"
                value={brand?.secondary_color || ''}
                onChange={(e) => handleChange('secondary_color', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Meta Title (SEO)</label>
              <input
                type="text"
                value={brand?.meta_title || ''}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Meta Description (SEO)</label>
              <textarea
                value={brand?.meta_description || ''}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          </div>

          <button
            onClick={handleSaveBrand}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Brand Settings'}
          </button>
        </div>
      )}

      {/* Tab 2: Courses Management Section */}
      {activeTab === 'courses' && (
        <div className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">Published Courses</h3>
            <span className="text-xs text-slate-400">Manage curriculum & modules</span>
          </div>

          <div className="space-y-3">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                  <div>
                    <h4 className="font-bold text-white text-sm">{course.title}</h4>
                    <p className="text-xs text-slate-400">Slug: /{course.slug}</p>
                  </div>
                  <a
                    href={`/courses/${course.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition font-medium"
                  >
                    View Course →
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-6 text-center">No courses found in database.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Users Management Section */}
      {activeTab === 'users' && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">User Access & Roles</h3>
          <p className="text-sm text-slate-400 mb-6">User role management interface connected to Supabase Auth.</p>
          <div className="p-8 text-center bg-black/40 border border-white/5 rounded-xl">
            <p className="text-sm text-slate-400">User table management syncs automatically with authentication records.</p>
          </div>
        </div>
      )}
    </div>
  )
}
