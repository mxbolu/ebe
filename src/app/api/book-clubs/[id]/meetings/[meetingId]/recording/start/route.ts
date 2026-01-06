import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { generateAgoraToken } from '@/lib/agora'
import { acquireRecordingResource, startCloudRecording } from '@/lib/agora-recording'
import { RtcRole } from 'agora-token'

/**
 * POST /api/book-clubs/[id]/meetings/[meetingId]/recording/start
 * Start cloud recording for a meeting
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id, meetingId } = await params

  try {
    // Check if user is admin/moderator of the book club
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only admins and moderators can start recordings' },
        { status: 403 }
      )
    }

    // Get meeting details
    const meeting = await prisma.bookClubMeeting.findUnique({
      where: { id: meetingId },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    if (meeting.bookClubId !== id) {
      return NextResponse.json(
        { error: 'Meeting does not belong to this book club' },
        { status: 400 }
      )
    }

    // Check if recording is already in progress
    if (meeting.status === 'recording') {
      return NextResponse.json(
        { error: 'Recording is already in progress' },
        { status: 400 }
      )
    }

    const channelName = meeting.agoraChannelName
    const recordingUid = 999999 // Special UID for recording bot

    // Generate token for recording bot
    const token = generateAgoraToken(channelName, recordingUid, RtcRole.PUBLISHER, 86400) // 24 hours

    // Acquire recording resource
    const resourceId = await acquireRecordingResource(channelName, recordingUid)

    // Start recording
    const { sid } = await startCloudRecording(
      channelName,
      resourceId,
      recordingUid,
      token
    )

    // Update meeting with recording info
    await prisma.bookClubMeeting.update({
      where: { id: meetingId },
      data: {
        status: 'recording',
      },
    })

    // Store recording session info in a separate table or Redis
    // For now, we'll return it to be stored on the client side
    // In production, you'd want to store this in the database

    return NextResponse.json({
      message: 'Recording started successfully',
      recordingSession: {
        resourceId,
        sid,
        channelName,
        uid: recordingUid,
      },
    })
  } catch (error) {
    console.error('Start recording error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
