import { AccessToken } from 'livekit-server-sdk'
import type { LiveClass } from '@/types/live-class'

export interface TokenOptions {
  roomName: string
  participantIdentity: string
  participantName: string
  isTeacher: boolean
  allowMic: boolean
  allowCamera: boolean
  allowData: boolean
  ttlSeconds?: number
}

/**
 * Generate a short-lived LiveKit access token.
 * SERVER-SIDE ONLY — never expose to client.
 */
export async function generateLiveKitToken(options: TokenOptions): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured')
  }

  const {
    roomName,
    participantIdentity,
    participantName,
    isTeacher,
    allowMic,
    allowCamera,
    allowData,
    ttlSeconds = 60 * 60 * 3, // 3 hours default
  } = options

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: ttlSeconds,
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: isTeacher || allowMic || allowCamera,
    canSubscribe: true,
    canPublishData: allowData,
    canUpdateOwnMetadata: true,
    roomAdmin: isTeacher,
    roomCreate: false,
    roomList: false,
    roomRecord: isTeacher,
    hidden: false,
    recorder: false,
  })

  return await token.toJwt()
}

/**
 * Generate LiveKit room name from live class ID.
 * Predictable on server, opaque to client.
 */
export function getRoomName(liveClassId: string): string {
  return `ifalode_live_${liveClassId}`
}

/**
 * Generate participant identity.
 */
export function getParticipantIdentity(userId: string, liveClassId: string): string {
  return `user_${userId}_${liveClassId.slice(0, 8)}`
}
