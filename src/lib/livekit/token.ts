import { AccessToken } from 'livekit-server-sdk'

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
    ttlSeconds = 60 * 60 * 3,
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
  })

  return await token.toJwt()
}

export function getRoomName(liveClassId: string): string {
  return `ifalode_live_${liveClassId}`
}

export function getParticipantIdentity(userId: string, liveClassId: string): string {
  return `user_${userId}_${liveClassId.slice(0, 8)}`
}
