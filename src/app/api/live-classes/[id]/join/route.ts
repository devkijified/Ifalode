import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createLiveClassService } from '@/lib/services/LiveClassService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const p = profile as any

    const service = createLiveClassService(supabase)
    const result = await service.joinClass(
      params.id,
      user.id,
      user.email || p?.email || '',
      p?.full_name || user.email || 'User'
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 })
    }

    return NextResponse.json(result.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
