import Link from 'next/link'
import { LiveClassForm } from '@/components/live-class/LiveClassForm'

export default function NewLiveClassPage() {
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
            Create Live Class
          </h1>
          <p className="text-slate-500 mt-2">Schedule a new virtual classroom session</p>
        </div>

        <LiveClassForm />
      </div>
    </div>
  )
}
