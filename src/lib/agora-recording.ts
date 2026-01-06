/**
 * Agora Cloud Recording Service
 * Handles recording start, stop, and status queries
 */

import { getAgoraCredentials, getAgoraRESTAuth } from './agora'

const AGORA_RECORDING_BASE_URL = 'https://api.agora.io/v1/apps'

interface AcquireResponse {
  resourceId: string
}

interface StartRecordingResponse {
  sid: string
  resourceId: string
}

interface RecordingStatus {
  sid: string
  resourceId: string
  serverResponse: {
    status: number // 0: init, 1-4: recording states, 5-8: post-recording states
    fileList?: Array<{
      fileName: string
      trackType: string
      uid: string
      mixedAllUser: boolean
      isPlayable: boolean
      sliceStartTime: number
    }>
  }
}

/**
 * Acquire a resource ID for cloud recording
 * @param channelName - Agora channel name
 * @param uid - Recording bot UID (use a high number like 999999)
 * @returns Resource ID
 */
export async function acquireRecordingResource(
  channelName: string,
  uid: number = 999999
): Promise<string> {
  const { appId } = getAgoraCredentials()
  const auth = getAgoraRESTAuth()

  const response = await fetch(
    `${AGORA_RECORDING_BASE_URL}/${appId}/cloud_recording/acquire`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {
          resourceExpiredHour: 24,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to acquire recording resource: ${error}`)
  }

  const data: AcquireResponse = await response.json()
  return data.resourceId
}

/**
 * Start cloud recording
 * @param channelName - Agora channel name
 * @param resourceId - Resource ID from acquire
 * @param uid - Recording bot UID
 * @param token - RTC token for the recording bot
 * @returns Recording session info
 */
export async function startCloudRecording(
  channelName: string,
  resourceId: string,
  uid: number = 999999,
  token: string
): Promise<{ sid: string; resourceId: string }> {
  const { appId } = getAgoraCredentials()
  const auth = getAgoraRESTAuth()

  // Storage configuration - using Agora's default storage
  // In production, you'd configure your own S3/Azure/GCP storage
  const storageConfig = {
    vendor: 1, // 1: Agora Cloud Storage
    region: 0, // 0: US
  }

  const response = await fetch(
    `${AGORA_RECORDING_BASE_URL}/${appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {
          token,
          recordingConfig: {
            maxIdleTime: 30,
            streamTypes: 2, // 0: audio only, 1: video only, 2: audio and video
            channelType: 0, // 0: communication, 1: live broadcast
            videoStreamType: 0, // 0: high stream, 1: low stream
            subscribeVideoUids: [], // Empty array subscribes to all users
            subscribeAudioUids: [], // Empty array subscribes to all users
          },
          recordingFileConfig: {
            avFileType: ['hls', 'mp4'], // Both HLS and MP4 formats
          },
          storageConfig,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to start recording: ${error}`)
  }

  const data: StartRecordingResponse = await response.json()
  return {
    sid: data.sid,
    resourceId: data.resourceId,
  }
}

/**
 * Stop cloud recording
 * @param channelName - Agora channel name
 * @param resourceId - Resource ID
 * @param sid - Session ID
 * @param uid - Recording bot UID
 * @returns Recording status
 */
export async function stopCloudRecording(
  channelName: string,
  resourceId: string,
  sid: string,
  uid: number = 999999
): Promise<RecordingStatus> {
  const { appId } = getAgoraCredentials()
  const auth = getAgoraRESTAuth()

  const response = await fetch(
    `${AGORA_RECORDING_BASE_URL}/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify({
        cname: channelName,
        uid: uid.toString(),
        clientRequest: {},
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to stop recording: ${error}`)
  }

  return await response.json()
}

/**
 * Query recording status
 * @param resourceId - Resource ID
 * @param sid - Session ID
 * @returns Recording status
 */
export async function queryRecordingStatus(
  resourceId: string,
  sid: string
): Promise<RecordingStatus> {
  const { appId } = getAgoraCredentials()
  const auth = getAgoraRESTAuth()

  const response = await fetch(
    `${AGORA_RECORDING_BASE_URL}/${appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to query recording status: ${error}`)
  }

  return await response.json()
}
