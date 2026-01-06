import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { stopCloudRecording } from '@/lib/agora-recording'

const stopRecordingSchema = z.object({
  resourceId: z.string(),
  sid: z.string(),
  channelName: z.string(),
  uid: z.number().optional().default(999999),
})

/**
 * POST /api/book-clubs/[id]/meetings/[meetingId]/recording/stop
 * Stop cloud recording for a meeting
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
    const body = await request.json()
    const validationResult = stopRecordingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

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
        { error: 'Only admins and moderators can stop recordings' },
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

    const data = validationResult.data

    // Stop recording
    const recordingStatus = await stopCloudRecording(
      data.channelName,
      data.resourceId,
      data.sid,
      data.uid
    )

    // Extract recording file URLs if available
    let recordingUrl = null
    if (recordingStatus.serverResponse.fileList && recordingStatus.serverResponse.fileList.length > 0) {
      // Get the first MP4 file (or HLS if MP4 not available)
      const mp4File = recordingStatus.serverResponse.fileList.find(f => f.fileName.endsWith('.mp4'))
      const file = mp4File || recordingStatus.serverResponse.fileList[0]

      // In production with custom storage, you'd construct the full URL here
      // For Agora's default storage, files are accessible via their CDN
      recordingUrl = file.fileName
    }

    // Update meeting with recording URL and status
    await prisma.bookClubMeeting.update({
      where: { id: meetingId },
      data: {
        recordingUrl,
        status: 'completed',
      },
    })

    return NextResponse.json({
      message: 'Recording stopped successfully',
      recordingUrl,
      fileList: recordingStatus.serverResponse.fileList || [],
    })
  } catch (error) {
    console.error('Stop recording error:', error)
    return NextResponse.json(
      {
        error: 'Failed to stop recording',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
