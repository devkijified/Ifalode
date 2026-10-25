import { PublicBar } from '@/components/shell/PublicBar'

export const metadata = { title: 'Privacy, IfaLode' }

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'What we collect',
    body: [
      'Your account details: name, email and the password you set, which is stored securely by our authentication provider and never visible to us.',
      'Your learning: the courses you enrol in, your progress through lessons, the live classes you attend, and your orders and purchases.',
      'What you send us: support tickets, reading requests and messages in live classes.',
    ],
  },
  {
    title: 'What we never collect',
    body: [
      'We never see or store your card or bank details. Payments run through Paystack, which handles that information under its own privacy policy.',
      'We do not sell your personal information, and we do not share it with advertisers.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'To run your account: open your courses after payment, show your progress, seat you in live classes, and deliver the books you buy.',
      'To help you: answer your support tickets and reading requests, and send notifications about your classes, orders and account. You can turn push notifications off at any time in Settings.',
      'Referral information is used only to credit the student who invited you when you make your first purchase, as described on the Referrals page.',
    ],
  },
  {
    title: 'Who processes it for us',
    body: [
      'Supabase stores the platform database and accounts. Paystack processes payments. LiveKit carries live class audio and video. Each provider only receives what it needs to do its part.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can update your name at any time in Settings, change your password, and control push notifications from the same place.',
      'To ask for a copy of your information or to delete your account and its data, open a support ticket from your account and we will act on it.',
    ],
  },
  {
    title: 'Readings are private',
    body: [
      'What you share in a reading or in a reading request is treated as confidential and is only used to arrange and hold your session.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-cream">
      <PublicBar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <h1 className="font-display text-display tracking-tight">Privacy</h1>
        <p className="mt-3 text-body text-cream-faint">
          What IfaLode holds about you, why, and the choices you keep.
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
