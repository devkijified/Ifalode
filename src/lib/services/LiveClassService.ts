import { createServerClient } from '@/lib/supabase/server'
import { generateLiveKitToken, getRoomName, getParticipantIdentity } from '@/lib/livekit/token'
import { getLiveKitService } from './LiveKitService'
import type { LiveClass, JoinTokenResponse, LiveClassStatus } from '@/types/live-class'

/**
 * Business logic for Live Classes.
 * Abstracts the realtime provider behind LiveKitService.
 */
export class LiveClassService {
  private supabase: any

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  /**
   * Check if a user is allowed to join a live class.
   */
  async canUserJoin(
    liveClassId: string,
    userId: string
  ): Promise<{ allowed: boolean; reason?: string; liveClass?: LiveClass }> {
    const { data: liveClass, error } = await this.supabase
      .from('live_classes')
      .select('*')
      .eq('id', liveClassId)
      .single()

    if (error || !liveClass) {
      return { allowed: false, reason: 'Class not found' }
    }

    // Status check
    if (!['SCHEDULED', 'LIVE'].includes(liveClass.status)) {
      return { allowed: false, reason: `Class is ${liveClass.status}`, liveClass }
    }

    // Enrollment check
    const { data: enrollment } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', liveClass.course_id)
      .maybeSingle()

    if (!enrollment) {
      return { allowed: false, reason: 'Not enrolled in this course', liveClass }
    }

    // Registration check (if required)
    if (liveClass.price > 0) {
      const { data: paidOrder } = await this.supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', liveClass.course_id)
        .eq('status', 'completed')
        .maybeSingle()

      if (!paidOrder) {
        return { allowed: false, reason: 'Payment required', liveClass }
      }
    }

    // Capacity check (only for LIVE status)
    if (liveClass.status === 'LIVE') {
      const participantCount = await this.getActiveParticipantCount(liveClass.room_id)
      if (participantCount >= liveClass.max_participants) {
        return { allowed: false, reason: 'Class is full', liveClass }
      }
    }

    return { allowed: true, liveClass }
  }

  /**
   * Get active participant count from LiveKit.
   */
  async getActiveParticipantCount(roomName: string): Promise<number> {
    const liveKit = getLiveKitService()
    const result = await liveKit.listParticipants(roomName)
    return result.success ? (result.participants?.length || 0) : 0
  }

  /**
   * Generate a join token for a user.
   */
  async joinClass(
    liveClassId: string,
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; error?: string; data?: JoinTokenResponse }> {
    // 1. Authorize
    const check = await this.canUserJoin(liveClassId, userId)
    if (!check.allowed || !check.liveClass) {
      return { success: false, error: check.reason || 'Unauthorized' }
    }

    const liveClass = check.liveClass

    // 2. Determine role
    const isTeacher = liveClass.instructor_id === userId

    // 3. Generate token
    const roomName = liveClass.room_id
    const identity = getParticipantIdentity(userId, liveClassId)

    try {
      const token = await generateLiveKitToken({
        roomName,
        participantIdentity: identity,
        participantName: userName || userEmail,
        isTeacher,
        allowMic: isTeacher || liveClass.allow_mic,
        allowCamera: isTeacher || liveClass.allow_camera,
        allowData: liveClass.allow_chat,
      })

      // 4. Track session (attendance)
      await this.supabase.from('live_class_sessions').insert({
        live_class_id: liveClassId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      })

      // 5. Update registration status if applicable
      await this.supabase
        .from('live_class_registrations')
        .update({ status: 'attended' })
        .eq('live_class_id', liveClassId)
        .eq('user_id', userId)

      return {
        success: true,
        data: {
          token,
          roomName,
          livekitUrl: process.env.LIVEKIT_URL!,
          role: isTeacher ? 'teacher' : 'student',
          permissions: {
            canPublish: isTeacher || liveClass.allow_mic || liveClass.allow_camera,
            canSubscribe: true,
            canPublishData: liveClass.allow_chat,
            canPublishCamera: isTeacher || liveClass.allow_camera,
            canPublishMicrophone: isTeacher || liveClass.allow_mic,
          },
        },
      }
    } catch (error: any) {
      console.error('joinClass error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Track a leave event (close the most recent session).
   */
  async leaveClass(liveClassId: string, userId: string): Promise<void> {
    const { data: session } = await this.supabase
      .from('live_class_sessions')
      .select('id, joined_at')
      .eq('live_class_id', liveClassId)
      .eq('user_id', userId)
      .is('left_at', null)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (session) {
      const leftAt = new Date()
      const joinedAt = new Date(session.joined_at)
      const durationSeconds = Math.round((leftAt.getTime() - joinedAt.getTime()) / 1000)

      await this.supabase
        .from('live_class_sessions')
        .update({
          left_at: leftAt.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', session.id)
    }
  }

  /**
   * Register a student for a live class.
   */
  async registerForClass(
    liveClassId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: liveClass } = await this.supabase
      .from('live_classes')
      .select('*')
      .eq('id', liveClassId)
      .single()

    if (!liveClass) {
      return { success: false, error: 'Class not found' }
    }

    if (['ENDED', 'COMPLETED', 'CANCELLED'].includes(liveClass.status)) {
      return { success: false, error: 'Class has ended' }
    }

    // Check capacity server-side
    const { count } = await this.supabase
      .from('live_class_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('live_class_id', liveClassId)
      .eq('status', 'registered')

    if ((count || 0) >= liveClass.max_participants) {
      return { success: false, error: 'Class is full' }
    }

    const { error } = await this.supabase
      .from('live_class_registrations')
      .upsert({
        live_class_id: liveClassId,
        user_id: userId,
        status: 'registered',
      }, { onConflict: 'live_class_id,user_id' })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Update live class status (server-controlled).
   */
  async updateStatus(
    liveClassId: string,
    instructorId: string,
    newStatus: LiveClassStatus
  ): Promise<{ success: boolean; error?: string }> {
    const { data: liveClass } = await this.supabase
      .from('live_classes')
      .select('instructor_id, status, room_id')
      .eq('id', liveClassId)
      .single()

    if (!liveClass) {
      return { success: false, error: 'Class not found' }
    }

    if (liveClass.instructor_id !== instructorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const updates: any = { status: newStatus, updated_at: new Date().toISOString() }

    if (newStatus === 'LIVE') {
      updates.started_at = new Date().toISOString()
      // Create LiveKit room
      const liveKit = getLiveKitService()
      await liveKit.createRoom(liveClass.room_id)
    }

    if (newStatus === 'ENDED') {
      updates.ended_at = new Date().toISOString()
    }

    const { error } = await this.supabase
      .from('live_classes')
      .update(updates)
      .eq('id', liveClassId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }
}

/**
 * Helper to instantiate the service from server-side code.
 */
export async function getLiveClassService(): Promise<LiveClassService> {
  const supabase = await createServerClient()
  return new LiveClassService(supabase)
}
