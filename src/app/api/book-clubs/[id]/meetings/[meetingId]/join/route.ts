import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { generateAgoraToken, getAgoraAppId } from '@/lib/agora'
import { RtcRole } from 'agora-token'

/**
 * POST /api/book-clubs/[id]/meetings/[meetingId]/join
 * Get Agora token to join a meeting
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
    // Check if meeting exists
    const meeting = await prisma.bookClubMeeting.findUnique({
      where: {
        id: meetingId,
        bookClubId: id,
      },
      include: {
        bookClub: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
      },
    })

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the book club
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this book club to join meetings' },
        { status: 403 }
      )
    }

    // Check if meeting is in the future or currently in progress
    const now = new Date()
    const scheduledAt = new Date(meeting.scheduledAt)
    const meetingEnd = new Date(scheduledAt.getTime() + meeting.duration * 60 * 1000)

    if (now > meetingEnd && meeting.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'This meeting has already ended' },
        { status: 400 }
      )
    }

    if (meeting.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This meeting has been cancelled' },
        { status: 400 }
      )
    }

    // Generate Agora token
    // Use user.userId hash as UID for Agora (convert to number)
    const uid = parseInt(user.userId.substring(0, 8), 36) % 2147483647

    const token = generateAgoraToken(
      meeting.agoraChannelName,
      uid,
      RtcRole.PUBLISHER,
      7200 // 2 hours
    )

    // Update meeting status to in_progress if it's scheduled
    if (meeting.status === 'scheduled' && now >= scheduledAt) {
      await prisma.bookClubMeeting.update({
        where: { id: meetingId },
        data: { status: 'in_progress' },
      })
    }

    return NextResponse.json({
      token,
      appId: getAgoraAppId(),
      channelName: meeting.agoraChannelName,
      uid,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        scheduledAt: meeting.scheduledAt,
        duration: meeting.duration,
        status: meeting.status,
      },
      bookClub: meeting.bookClub,
    })
  } catch (error) {
    console.error('Join meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to join meeting' },
      { status: 500 }
    )
  }
}
