import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const rejectSchema = z.object({
  userId: z.string(),
})

/**
 * POST /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/reject
 * Reject a participant from the waiting room
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
    const validationResult = rejectSchema.safeParse(body)

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
        { error: 'Only admins and moderators can reject participants' },
        { status: 403 }
      )
    }

    const { userId } = validationResult.data

    // Update participant status
    const participant = await prisma.meetingWaitingParticipant.update({
      where: {
        meetingId_userId: {
          meetingId,
          userId,
        },
      },
      data: {
        status: 'rejected',
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
      message: 'Participant rejected',
      participant,
    })
  } catch (error) {
    console.error('Reject participant error:', error)
    return NextResponse.json(
      { error: 'Failed to reject participant' },
      { status: 500 }
    )
  }
}
