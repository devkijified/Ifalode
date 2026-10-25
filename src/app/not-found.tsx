import Link from 'next/link'
import { OduMark } from '@/components/shell/PublicBar'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-5 py-16 text-center text-cream">
      <span className="text-gold">
        <OduMark className="h-14 w-10" />
      </span>
      <p className="mt-8 text-meta font-bold uppercase tracking-widest text-cream-faint">
        Page not found
      </p>
      <h1 className="mt-3 max-w-xl font-display text-display tracking-tight text-cream sm:text-[44px] sm:leading-[1.05]">
        This path has not been revealed
      </h1>
      <p className="mt-4 max-w-md text-body text-cream-dim">
        The page you are looking for does not exist, or it may have moved.
        Head back home, or browse the courses and teachings instead.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center rounded-full bg-gold px-6 text-body font-bold text-ink-950 transition hover:bg-gold-light"
        >
          Go home
        </Link>
        <Link
          href="/courses"
          className="inline-flex min-h-[48px] items-center rounded-full border border-cream/20 px-6 text-body font-semibold text-cream transition hover:border-gold hover:text-gold"
        >
          Browse courses
        </Link>
      </div>
    </main>
  )
}
