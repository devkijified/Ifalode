import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getRouteUser, isAdminUser } from '@/lib/supabase/admin'

/** The whole /admin area is gated here, server-side: guests go to the
    login page, signed-in students go back to their own dashboard, and
    only profiles with the admin role ever render an admin page. The
    APIs and RLS already protect the data itself; this stops the admin
    interface from being reachable at all by non-admins. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const user = await getRouteUser(supabase as any)

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  if (!(await isAdminUser(user.id))) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
