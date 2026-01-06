import { RtcTokenBuilder, RtcRole } from 'agora-token'

// Get Agora credentials from environment variables
const AGORA_APP_ID = process.env.AGORA_APP_ID || ''
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || ''

/**
 * Generate an Agora RTC token for a user to join a channel
 * @param channelName - The name of the Agora channel
 * @param uid - User ID (0 for string UIDs, or specific number)
 * @param role - RtcRole.PUBLISHER or RtcRole.SUBSCRIBER
 * @param expirationTimeInSeconds - Token expiration time (default 3600 = 1 hour)
 * @returns Agora RTC token
 */
export function generateAgoraToken(
  channelName: string,
  uid: number = 0,
  role: number = RtcRole.PUBLISHER,
  expirationTimeInSeconds: number = 3600
): string {
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    throw new Error('Agora credentials not configured')
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

  // Build the token
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  )

  return token
}

/**
 * Generate a channel name for a book club meeting
 * @param bookClubId - Book club ID
 * @param meetingId - Meeting ID
 * @returns Unique channel name
 */
export function generateChannelName(bookClubId: string, meetingId: string): string {
  return `club_${bookClubId}_meeting_${meetingId}`
}

/**
 * Get Agora App ID (safe to expose to client)
 * @returns Agora App ID
 */
export function getAgoraAppId(): string {
  return AGORA_APP_ID
}
