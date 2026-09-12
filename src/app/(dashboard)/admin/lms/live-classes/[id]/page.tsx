import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { LiveClassForm } from '@/components/live-class/LiveClassForm'
import type { LiveClass } from '@/types/live-class'

interface Props {
  params: { id: string }
}

export default async function EditLiveClassPage({ params }: Props) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('live_classes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    notFound()
  }

  const liveClass = data as LiveClass

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/admin/lms/live-classes"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition mb-6"
        >
          ← Back to Live Classes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Edit Live Class
          </h1>
          <p className="text-slate-500 mt-2">{liveClass.title}</p>
        </div>

        <LiveClassForm initialData={liveClass} />
      </div>
    </div>
  )
}
