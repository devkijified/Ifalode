import { PublicBar } from '@/components/shell/PublicBar'

export const metadata = { title: 'Terms of Use, IfaLode' }

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What IfaLode is',
    body: [
      'IfaLode is a learning platform for the Ifá tradition: courses, live classes, books and readings offered by the teacher and the house behind this site. Teachings are given for education and spiritual growth.',
      'Nothing on this platform is medical, legal or financial advice, and a reading or course does not replace professional counsel in those areas.',
    ],
  },
  {
    title: 'Your account',
    body: [
      'You are responsible for the activity on your account and for keeping your password to yourself. One account is for one person: course and class access may not be shared, resold or given away.',
      'We may suspend an account that shares paid content, abuses other students, or disrupts a live class.',
    ],
  },
  {
    title: 'Payments and access',
    body: [
      'Prices are shown in naira and are always exact at checkout. Payments are processed by Paystack; we never see or store your card details.',
      'Access to a course or book opens when payment confirms. If a payment is taken and access does not open, contact support and we will open it manually or refund you.',
    ],
  },
  {
    title: 'Refunds',
    body: [
      'For a course, you may request a refund within 7 days of purchase if you have not completed more than a quarter of the lessons. For a book or download, refunds are available within 7 days if the file has not been downloaded.',
      'Live class fees are refunded in full when a class is cancelled by us, and readings fees are refunded when we cannot hold your session at the agreed time. To request a refund, open a support ticket from your account.',
    ],
  },
  {
    title: 'Live classes and readings',
    body: [
      'Live classes may be recorded for students enrolled in them. By joining a class you accept that the session may be recorded and made available as a replay to enrolled students.',
      'Readings are private. What you share in a reading stays between you and the teacher, except where the law requires otherwise.',
    ],
  },
  {
    title: 'Content and conduct',
    body: [
      'Course materials, books, recordings and writings on this platform belong to IfaLode and the teacher. You may use them for your own study; you may not copy, publish or sell them.',
      'In classes and community spaces, treat others with respect. Harassment, spam and impersonation will end your access.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'We may update these terms as the platform grows. Material changes will be announced inside the app, and continuing to use IfaLode after a change means you accept the updated terms.',
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <h1 className="font-display text-display tracking-tight">Terms of use</h1>
        <p className="mt-3 text-body text-cream-faint">
          The plain terms for learning, buying and gathering on IfaLode.
        </p>
        <div className="mt-10 space-y-9">
          {SECTIONS.map((s, i) => (
            <section key={s.title}>
              <h2 className="font-display text-title tracking-tight text-cream">
                {i + 1}. {s.title}
              </h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 24)} className="mt-3 text-lead text-cream-dim">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
