import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client for server API routes only. Bypasses RLS, so every
 * route that uses it must authenticate the caller itself and scope every
 * query to that caller (or verify the caller is an admin) before touching
 * another user's rows. Never import this from a client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role is not configured on the server')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** The signed-in user for an API route, from the cookie session. */
export async function getRouteUser(supabase: {
  auth: { getUser: () => Promise<{ data: { user: any } }> }
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

/** True when the user's profile role is admin. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  return (data as any)?.role === 'admin'
}
