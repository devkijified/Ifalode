import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createRecordingService } from '@/lib/services/RecordingService'

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

    const service = createRecordingService(supabase)
    const result = await service.getRecording(params.id)

    if (!result.success || !result.data) {
      return NextResponse.json({ recording: null })
    }

    // Generate signed URL for storage
    const recording = result.data as any
    if (recording.storage_url) {
      const path = recording.storage_url.split('/live-recordings/')[1]
      if (path) {
        const urlResult = await service.getSignedRecordingUrl(path)
        if (urlResult.success && urlResult.url) {
          recording.signed_url = urlResult.url
        }
      }
    }

    return NextResponse.json({ recording })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
