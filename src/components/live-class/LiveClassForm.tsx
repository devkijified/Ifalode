'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { LiveClass } from '@/types/live-class'

interface Props {
  initialData?: LiveClass
}

export function LiveClassForm({ initialData }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    course_id: initialData?.course_id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    scheduled_at: initialData?.scheduled_at
      ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
      : '',
    duration_minutes: initialData?.duration_minutes || 180,
    max_participants: initialData?.max_participants || 50,
    price: initialData?.price || 0,
    recording_enabled: initialData?.recording_enabled ?? true,
    allow_mic: initialData?.allow_mic ?? false,
    allow_camera: initialData?.allow_camera ?? false,
    allow_chat: initialData?.allow_chat ?? true,
    allow_questions: initialData?.allow_questions ?? true,
    is_published: initialData?.is_published ?? true,
  })

  useEffect(() => {
    const loadCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_published', true)
        .order('title')
      setCourses(data || [])
    }
    loadCourses()
  }, [supabase])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: Number(value) }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...form,
        course_id: form.course_id || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
      }

      const url = initialData
        ? `/api/live-classes/${initialData.id}`
        : '/api/live-classes'

      const method = initialData ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      router.push('/admin/lms/live-classes')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h3 className="font-bold text-lg">Basic Information</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="IWORI GOSUN — Advanced Study"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Briefly describe what this class covers..."
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Course (optional)</label>
          <select
            name="course_id"
            value={form.course_id}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
          >
            <option value="">— None (standalone class) —</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h3 className="font-bold text-lg">Schedule & Capacity</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Scheduled At *</label>
          <input
            type="datetime-local"
            name="scheduled_at"
            required
            value={form.scheduled_at}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (min)</label>
            <input
              type="number"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              min={15}
              max={360}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Max Participants</label>
            <input
              type="number"
              name="max_participants"
              value={form.max_participants}
              onChange={handleChange}
              min={2}
              max={500}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Price (₦)</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              min={0}
              step="0.01"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h3 className="font-bold text-lg">Classroom Permissions</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            label="Enable Recording"
            description="Record the class for replay"
            name="recording_enabled"
            checked={form.recording_enabled}
            onChange={handleChange}
          />
          <Toggle
            label="Allow Chat"
            description="Students can send messages"
            name="allow_chat"
            checked={form.allow_chat}
            onChange={handleChange}
          />
          <Toggle
            label="Allow Student Microphones"
            description="Students can unmute themselves"
            name="allow_mic"
            checked={form.allow_mic}
            onChange={handleChange}
          />
          <Toggle
            label="Allow Student Cameras"
            description="Students can turn on their camera"
            name="allow_camera"
            checked={form.allow_camera}
            onChange={handleChange}
          />
          <Toggle
            label="Allow Questions / Raise Hand"
            description="Students can signal for attention"
            name="allow_questions"
            checked={form.allow_questions}
            onChange={handleChange}
          />
          <Toggle
            label="Publish Immediately"
            description="Show in catalog right away"
            name="is_published"
            checked={form.is_published}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-brand-primary text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Live Class'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/lms/live-classes')}
          className="px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Toggle({
  label,
  description,
  name,
  checked,
  onChange,
}: {
  label: string
  description: string
  name: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-pointer hover:border-slate-700 transition">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 w-4 h-4 rounded border-slate-700 text-brand-primary focus:ring-brand-primary"
      />
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </label>
  )
}
