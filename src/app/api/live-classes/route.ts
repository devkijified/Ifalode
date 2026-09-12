import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createLiveClassService } from '@/lib/services/LiveClassService'

// GET /api/live-classes — list (role-aware)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role === 'admin' ? 'admin' : 'instructor'

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId') || undefined
    const status = searchParams.get('status') || undefined

    const service = createLiveClassService(supabase)
    const result = await service.listLiveClasses(user.id, role as any, {
      courseId,
      status: status as any,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ liveClasses: result.data })
  } catch (err: any) {
    console.error('GET /api/live-classes error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/live-classes — create
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const service = createLiveClassService(supabase)
    const result = await service.createLiveClass(user.id, body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ liveClass: result.data }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/live-classes error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
