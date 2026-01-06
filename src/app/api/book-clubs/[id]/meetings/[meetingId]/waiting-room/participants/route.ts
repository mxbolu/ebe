import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/participants
 * Get all participants in the waiting room
 */
export async function GET(
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
        { error: 'Only admins and moderators can view waiting participants' },
        { status: 403 }
      )
    }

    // Get waiting participants
    const participants = await prisma.meetingWaitingParticipant.findMany({
      where: {
        meetingId,
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
      orderBy: {
        joinedAt: 'asc',
      },
    })

    return NextResponse.json({
      participants,
      total: participants.length,
    })
  } catch (error) {
    console.error('Get waiting participants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiting participants' },
      { status: 500 }
    )
  }
}
