export type LiveClassStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'LIVE'
  | 'ENDED'
  | 'PROCESSING_RECORDING'
  | 'COMPLETED'
  | 'CANCELLED'

export type RegistrationStatus =
  | 'registered'
  | 'cancelled'
  | 'attended'
  | 'no_show'

export interface LiveClass {
  id: string
  course_id: string
  module_id: string | null
  lesson_id: string | null
  instructor_id: string
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  max_participants: number
  price: number
  status: LiveClassStatus
  room_id: string
  recording_enabled: boolean
  allow_mic: boolean
  allow_camera: boolean
  allow_chat: boolean
  allow_questions: boolean
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface LiveClassRegistration {
  id: string
  live_class_id: string
  user_id: string
  registered_at: string
  status: RegistrationStatus
}

export interface LiveClassSession {
  id: string
  live_class_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  duration_seconds: number | null
  created_at: string
}

export interface LiveClassRecording {
  id: string
  live_class_id: string
  recording_id: string | null
  egress_id: string | null
  storage_url: string | null
  duration_seconds: number | null
  file_size_bytes: number | null
  status: 'processing' | 'ready' | 'failed'
  created_at: string
  processed_at: string | null
}

export interface LiveClassMessage {
  id: string
  live_class_id: string
  user_id: string
  message: string
  message_type: 'chat' | 'system' | 'question'
  created_at: string
}

// Token response from join endpoint
export interface JoinTokenResponse {
  token: string
  roomName: string
  livekitUrl: string
  role: 'teacher' | 'student'
  permissions: {
    canPublish: boolean
    canSubscribe: boolean
    canPublishData: boolean
    canPublishCamera: boolean
    canPublishMicrophone: boolean
  }
}
