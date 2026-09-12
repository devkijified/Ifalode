import { RoomServiceClient, EgressClient, EncodedFileOutput, S3Upload, EncodedFileType } from 'livekit-server-sdk'

/**
 * Wrapper around LiveKit server SDK.
 * All LiveKit-specific logic lives here so the provider can be swapped later.
 */
export class LiveKitService {
  private roomService: RoomServiceClient
  private egressService: EgressClient

  constructor() {
    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!url || !apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured')
    }

    const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://')

    this.roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret)
    this.egressService = new EgressClient(httpUrl, apiKey, apiSecret)
  }

  async createRoom(roomName: string, maxParticipants: number = 50) {
    try {
      const room = await this.roomService.createRoom({
        name: roomName,
        maxParticipants,
        emptyTimeout: 60 * 10, // 10 min after empty
        departureTimeout: 60 * 20, // 20 min after last leaves
      })
      return { success: true, room }
    } catch (error: any) {
      console.error('LiveKit createRoom error:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteRoom(roomName: string) {
    try {
      await this.roomService.deleteRoom(roomName)
      return { success: true }
    } catch (error: any) {
      console.error('LiveKit deleteRoom error:', error)
      return { success: false, error: error.message }
    }
  }

  async listParticipants(roomName: string) {
    try {
      const participants = await this.roomService.listParticipants(roomName)
      return { success: true, participants }
    } catch (error: any) {
      console.error('LiveKit listParticipants error:', error)
      return { success: false, error: error.message }
    }
  }

  async removeParticipant(roomName: string, identity: string) {
    try {
      await this.roomService.removeParticipant(roomName, identity)
      return { success: true }
    } catch (error: any) {
      console.error('LiveKit removeParticipant error:', error)
      return { success: false, error: error.message }
    }
  }

  async mutePublishedTrack(
    roomName: string,
    identity: string,
    trackSid: string,
    muted: boolean
  ) {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted)
      return { success: true }
    } catch (error: any) {
      console.error('LiveKit mutePublishedTrack error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Start a composite recording of the room.
   * In Phase 6 this will be wired up to Supabase Storage.
   */
  async startCompositeRecording(roomName: string, outputPath: string) {
    try {
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: outputPath,
        // Optional S3/Supabase upload — configured in Phase 6
      })

      const egressInfo = await this.egressService.startRoomCompositeEgress(roomName, {
        file: fileOutput,
      })

      return { success: true, egressInfo }
    } catch (error: any) {
      console.error('LiveKit startCompositeRecording error:', error)
      return { success: false, error: error.message }
    }
  }

  async stopRecording(egressId: string) {
    try {
      const info = await this.egressService.stopEgress(egressId)
      return { success: true, info }
    } catch (error: any) {
      console.error('LiveKit stopRecording error:', error)
      return { success: false, error: error.message }
    }
  }

  async listEgress(roomName?: string, active?: boolean) {
    try {
      const list = await this.egressService.listEgress({ roomName, active })
      return { success: true, egress: list }
    } catch (error: any) {
      console.error('LiveKit listEgress error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Singleton export
let instance: LiveKitService | null = null
export function getLiveKitService(): LiveKitService {
  if (!instance) {
    instance = new LiveKitService()
  }
  return instance
}
