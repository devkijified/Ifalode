import { createServerClient } from '@/lib/supabase/server'
import { generateLiveKitToken, getParticipantIdentity } from '@/lib/livekit/token'
import { getLiveKitService } from './LiveKitService'
import type {
  LiveClass,
  LiveClassCreateInput,
  JoinTokenResponse,
  LiveClassStatus,
} from '@/types/live-class'

export class LiveClassService {
  private supabase: any

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  // ============================================================
  // CREATE
  // ============================================================
  async createLiveClass(
    instructorId: string,
    input: LiveClassCreateInput,
    instructorName: string
  ): Promise<{ success: boolean; data?: LiveClass; error?: string }> {
    const tempId = crypto.randomUUID()
    const roomId = `ifalode_live_${tempId}`

    const { data, error } = await this.supabase
      .from('live_classes')
      .insert({
        course_id: input.course_id,
        module_id: input.module_id || null,
        instructor_id: instructorId,
        instructor: instructorName,
        title: input.title,
        description: input.description || null,
        scheduled_at: input.scheduled_at,
        duration_minutes: input.duration_minutes,
        duration: input.duration_minutes,
        max_participants: input.max_participants,
        price: input.price,
        status: 'SCHEDULED',
        room_id: roomId,
        recording_enabled: input.recording_enabled,
        allow_mic: input.allow_mic,
        allow_camera: input.allow_camera,
        allow_chat: input.allow_chat,
        allow_questions: input.allow_questions,
        is_published: input.is_published,
      })
      .select()
      .single()

    if (error) {
      console.error('createLiveClass error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data as LiveClass }
  }

  // ============================================================
  // LIST (role-aware)
  // ============================================================
  async listLiveClasses(
    userId: string,
    role: 'admin' | 'instructor' | 'student',
    filters?: { courseId?: string; status?: LiveClassStatus }
  ): Promise<{ success: boolean; data?: LiveClass[]; error?: string }> {
    let query = this.supabase.from('live_classes').select('*')

    if (role === 'instructor') {
      query = query.eq('instructor_id', userId)
    }

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('scheduled_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as LiveClass[] }
  }

  // ============================================================
  // GET ONE
  // ============================================================
  async getLiveClass(
    liveClassId: string
  ): Promise<{ success: boolean; data?: LiveClass; error?: string }> {
    const { data, error } = await this.supabase
      .from('live_classes')
      .select('*')
      .eq('id', liveClassId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as LiveClass }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async updateLiveClass(
    liveClassId: string,
    instructorId: string,
    updates: Partial<LiveClassCreateInput>
  ): Promise<{ success: boolean; data?: LiveClass; error?: string }> {
    const { data: existing } = await this.supabase
      .from('live_classes')
      .select('instructor_id, status')
      .eq('id', liveClassId)
      .single()

    if (!existing) {
      return { success: false, error: 'Live class not found' }
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', instructorId)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin && existing.instructor_id !== instructorId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (['LIVE', 'ENDED', 'COMPLETED'].includes(existing.status)) {
      return { success: false, error: 'Cannot edit a class that has started or ended' }
    }

    const { data, error } = await this.supabase
      .from('live_classes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', liveClassId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data as LiveClass }
  }

  // ============================================================
  // DELETE
  // ============================================================
  async deleteLiveClass(
    liveClassId: string,
    instructorId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { data: existing } = await this.supabase
      .from('live_classes')
      .select('instructor_id, status')
      .eq('id', liveClassId)
      .single()

    if (!existing) {
      return { success: false, error: 'Live class not found' }
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', instructorId)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin && existing.instructor_id !== instructorId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!['DRAFT', 'SCHEDULED', 'CANCELLED'].includes(existing.status)) {
      return { success: false, error: 'Cannot delete a class that has started' }
    }

    const { error } = await this.supabase
      .from('live_classes')
      .delete()
      .eq('id', liveClassId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  // ============================================================
  // CAN USER JOIN
  // ============================================================
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

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.role === 'admin'
    const isInstructor = liveClass.instructor_id === userId

    if (isAdmin || isInstructor) {
      return { allowed: true, liveClass }
    }

    if (!['SCHEDULED', 'LIVE'].includes(liveClass.status)) {
      return { allowed: false, reason: `Class is ${liveClass.status}`, liveClass }
    }

    const { data: enrollment } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', liveClass.course_id)
      .maybeSingle()

    if (!enrollment) {
      return { allowed: false, reason: 'Not enrolled in this course', liveClass }
    }

    if (liveClass.price && liveClass.price > 0) {
      const { data: paidOrder } = await this.supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('course_id', liveClass.course_id)
        .maybeSingle()

      if (!paidOrder) {
        return { allowed: false, reason: 'Payment required', liveClass }
      }
    }

    return { allowed: true, liveClass }
  }

  // ============================================================
  // JOIN (generate token)
  // ============================================================
  async joinClass(
    liveClassId: string,
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; error?: string; data?: JoinTokenResponse }> {
    const check = await this.canUserJoin(liveClassId, userId)
    if (!check.allowed || !check.liveClass) {
      return { success: false, error: check.reason || 'Unauthorized' }
    }

    const liveClass = check.liveClass
    const isTeacher = liveClass.instructor_id === userId
    const identity = getParticipantIdentity(userId, liveClassId)

    try {
      const token = await generateLiveKitToken({
        roomName: liveClass.room_id,
        participantIdentity: identity,
        participantName: userName || userEmail,
        isTeacher,
        allowMic: isTeacher || !!liveClass.allow_mic,
        allowCamera: isTeacher || !!liveClass.allow_camera,
        allowData: !!liveClass.allow_chat,
      })

      await this.supabase.from('live_class_sessions').insert({
        live_class_id: liveClassId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      })

      await this.supabase
        .from('live_class_registrations')
        .update({ status: 'attended' })
        .eq('live_class_id', liveClassId)
        .eq('user_id', userId)

      return {
        success: true,
        data: {
          token,
          roomName: liveClass.room_id,
          livekitUrl: process.env.LIVEKIT_URL!,
          role: isTeacher ? 'teacher' : 'student',
          permissions: {
            canPublish: isTeacher || !!liveClass.allow_mic || !!liveClass.allow_camera,
            canSubscribe: true,
            canPublishData: !!liveClass.allow_chat,
            canPublishCamera: isTeacher || !!liveClass.allow_camera,
            canPublishMicrophone: isTeacher || !!liveClass.allow_mic,
          },
        },
      }
    } catch (error: any) {
      console.error('joinClass error:', error)
      return { success: false, error: error.message }
    }
  }

  // ============================================================
  // LEAVE
  // ============================================================
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

  // ============================================================
  // UPDATE STATUS
  // ============================================================
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

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', instructorId)
      .single()

    const isAdmin = profile?.role === 'admin'

    if (!isAdmin && liveClass.instructor_id !== instructorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const updates: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'LIVE') {
      updates.started_at = new Date().toISOString()
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

export async function getLiveClassService(): Promise<LiveClassService> {
  const supabase = await createServerClient()
  return new LiveClassService(supabase)
}

export function createLiveClassService(supabase: any): LiveClassService {
  return new LiveClassService(supabase)
}
