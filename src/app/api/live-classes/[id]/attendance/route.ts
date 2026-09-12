import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify instructor or admin
    const { data: liveClass } = await supabase
      .from('live_classes')
      .select('instructor_id')
      .eq('id', params.id)
      .single()

    if (!liveClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const lc = liveClass as any

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = (profile as any)?.role === 'admin'
    const isInstructor = lc.instructor_id === user.id

    if (!isAdmin && !isInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get sessions with user info
    const { data: sessions, error } = await supabase
      .from('live_class_sessions')
      .select(`
        id,
        user_id,
        joined_at,
        left_at,
        duration_seconds,
        profiles:user_id (email, full_name)
      `)
      .eq('live_class_id', params.id)
      .order('joined_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aggregate per user
    const byUser: Record<string, {
      user_id: string
      email: string
      full_name: string
      total_seconds: number
      sessions: number
      first_join: string
      last_leave: string | null
      is_active: boolean
    }> = {}

    for (const s of (sessions || []) as any[]) {
      const uid = s.user_id
      if (!byUser[uid]) {
        byUser[uid] = {
          user_id: uid,
          email: s.profiles?.email || '',
          full_name: s.profiles?.full_name || 'Unknown',
          total_seconds: 0,
          sessions: 0,
          first_join: s.joined_at,
          last_leave: s.left_at,
          is_active: false,
        }
      }
      byUser[uid].sessions += 1
      byUser[uid].total_seconds += s.duration_seconds || 0
      if (!s.left_at) {
        byUser[uid].is_active = true
      }
      if (s.joined_at < byUser[uid].first_join) {
        byUser[uid].first_join = s.joined_at
      }
      if (s.left_at && (!byUser[uid].last_leave || s.left_at > byUser[uid].last_leave!)) {
        byUser[uid].last_leave = s.left_at
      }
    }

    const attendance = Object.values(byUser).map((a) => ({
      ...a,
      status:
        a.is_active ? 'Present'
        : a.total_seconds >= 3600 ? 'Present'
        : a.total_seconds >= 600 ? 'Partial'
        : 'Brief',
    }))

    return NextResponse.json({ attendance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
