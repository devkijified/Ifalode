import {
  RoomServiceClient,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
} from 'livekit-server-sdk'

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
        emptyTimeout: 60 * 10,
        departureTimeout: 60 * 20,
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
      return { success: false, error: error.message }
    }
  }

  async listParticipants(roomName: string) {
    try {
      const participants = await this.roomService.listParticipants(roomName)
      return { success: true, participants }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async removeParticipant(roomName: string, identity: string) {
    try {
      await this.roomService.removeParticipant(roomName, identity)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async startCompositeRecording(roomName: string, outputPath: string) {
    try {
      const fileOutput = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath: outputPath,
      })
      const egressInfo = await this.egressService.startRoomCompositeEgress(roomName, {
        file: fileOutput,
      })
      return { success: true, egressInfo }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async stopRecording(egressId: string) {
    try {
      const info = await this.egressService.stopEgress(egressId)
      return { success: true, info }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

let instance: LiveKitService | null = null

export function getLiveKitService(): LiveKitService {
  if (!instance) {
    instance = new LiveKitService()
  }
  return instance
}
