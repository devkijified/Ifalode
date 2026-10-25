import Link from 'next/link'
import { LiveClassForm } from '@/components/live-class/LiveClassForm'

export default function NewLiveClassPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-cream py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/admin/lms/live-classes"
          className="inline-flex items-center gap-2 text-sm text-cream-faint hover:text-white transition mb-6"
        >
          ← Back to Live Classes
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-cream font-display">
            Create Live Class
          </h1>
          <p className="text-cream-faint mt-2">Schedule a new virtual classroom session</p>
        </div>

        <LiveClassForm />
      </div>
    </div>
  )
}
