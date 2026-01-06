import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * POST /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/join
 * Join waiting room for a meeting
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
    // Get meeting details
    const meeting = await prisma.bookClubMeeting.findUnique({
      where: { id: meetingId },
      include: {
        bookClub: {
          include: {
            members: {
              where: { userId: user.userId },
            },
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

    if (meeting.bookClubId !== id) {
      return NextResponse.json(
        { error: 'Meeting does not belong to this book club' },
        { status: 400 }
      )
    }

    // Check if user is a member of the book club
    if (meeting.bookClub.members.length === 0) {
      return NextResponse.json(
        { error: 'You must be a member to join this meeting' },
        { status: 403 }
      )
    }

    const membership = meeting.bookClub.members[0]

    // If waiting room is disabled or user is admin/moderator, admit directly
    if (!meeting.waitingRoomEnabled || ['admin', 'moderator'].includes(membership.role)) {
      return NextResponse.json({
        status: 'admitted',
        message: 'You can join the meeting directly',
      })
    }

    // Add to waiting room
    const waitingParticipant = await prisma.meetingWaitingParticipant.upsert({
      where: {
        meetingId_userId: {
          meetingId,
          userId: user.userId,
        },
      },
      update: {
        status: 'waiting',
        joinedAt: new Date(),
      },
      create: {
        meetingId,
        userId: user.userId,
        status: 'waiting',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      status: 'waiting',
      message: 'You are in the waiting room. The host will admit you shortly.',
      participant: waitingParticipant,
    })
  } catch (error) {
    console.error('Join waiting room error:', error)
    return NextResponse.json(
      { error: 'Failed to join waiting room' },
      { status: 500 }
    )
  }
}
