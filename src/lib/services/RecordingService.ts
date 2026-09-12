import { createServerClient } from '@/lib/supabase/server'
import { getLiveKitService } from './LiveKitService'

/**
 * Handles recording lifecycle: start, stop, download, upload to Supabase Storage.
 */
export class RecordingService {
  private supabase: any

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  // ============================================================
  // START RECORDING
  // ============================================================
  async startRecording(
    liveClassId: string,
    userId: string
  ): Promise<{ success: boolean; egressId?: string; error?: string }> {
    // Verify ownership
    const { data: liveClass } = await this.supabase
      .from('live_classes')
      .select('instructor_id, room_id, status, recording_enabled')
      .eq('id', liveClassId)
      .single()

    if (!liveClass) {
      return { success: false, error: 'Class not found' }
    }

    const lc = liveClass as any

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = (profile as any)?.role === 'admin'

    if (!isAdmin && lc.instructor_id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (lc.status !== 'LIVE') {
      return { success: false, error: 'Class must be live to record' }
    }

    if (!lc.recording_enabled) {
      return { success: false, error: 'Recording is disabled for this class' }
    }

    // Start LiveKit composite egress
    const outputPath = `recordings/${liveClassId}/${Date.now()}.mp4`
    const liveKit = getLiveKitService()
    const result = await liveKit.startCompositeRecording(lc.room_id, outputPath)

    if (!result.success || !result.egressInfo) {
      return { success: false, error: result.error || 'Failed to start recording' }
    }

    const egressId = result.egressInfo.egressId

    // Save recording record
    const { error: insertError } = await (this.supabase as any)
      .from('live_class_recordings')
      .insert({
        live_class_id: liveClassId,
        egress_id: egressId,
        status: 'processing',
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, egressId }
  }

  // ============================================================
  // STOP RECORDING
  // ============================================================
  async stopRecording(
    liveClassId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify ownership
    const { data: liveClass } = await this.supabase
      .from('live_classes')
      .select('instructor_id')
      .eq('id', liveClassId)
      .single()

    if (!liveClass) {
      return { success: false, error: 'Class not found' }
    }

    const lc = liveClass as any

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = (profile as any)?.role === 'admin'

    if (!isAdmin && lc.instructor_id !== userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Find active recording
    const { data: recording } = await this.supabase
      .from('live_class_recordings')
      .select('id, egress_id')
      .eq('live_class_id', liveClassId)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!recording) {
      return { success: false, error: 'No active recording' }
    }

    const rec = recording as any

    const liveKit = getLiveKitService()
    const result = await liveKit.stopRecording(rec.egress_id)

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to stop recording' }
    }

    return { success: true }
  }

  // ============================================================
  // GET RECORDING FOR CLASS
  // ============================================================
  async getRecording(
    liveClassId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const { data, error } = await this.supabase
      .from('live_class_recordings')
      .select('*')
      .eq('live_class_id', liveClassId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  }

  // ============================================================
  // GET SIGNED URL FOR RECORDING
  // ============================================================
  async getSignedRecordingUrl(
    storagePath: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    const { data, error } = await this.supabase
      .storage
      .from('live-recordings')
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  }

  // ============================================================
  // MARK RECORDING AS READY (called by webhook)
  // ============================================================
  async markRecordingReady(
    egressId: string,
    storageUrl: string,
    durationSeconds: number,
    fileSizeBytes: number
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await (this.supabase as any)
      .from('live_class_recordings')
      .update({
        status: 'ready',
        storage_url: storageUrl,
        duration_seconds: durationSeconds,
        file_size_bytes: fileSizeBytes,
        processed_at: new Date().toISOString(),
      })
      .eq('egress_id', egressId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }
}

export function createRecordingService(supabase: any): RecordingService {
  return new RecordingService(supabase)
}

export async function getRecordingService(): Promise<RecordingService> {
  const supabase = await createServerClient()
  return new RecordingService(supabase)
}
