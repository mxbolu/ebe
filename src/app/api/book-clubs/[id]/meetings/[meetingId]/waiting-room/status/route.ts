import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/book-clubs/[id]/meetings/[meetingId]/waiting-room/status
 * Check admission status for current user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { meetingId } = await params

  try {
    // Get participant status
    const participant = await prisma.meetingWaitingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId: user.userId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Not in waiting room',
      })
    }

    return NextResponse.json({
      status: participant.status,
      joinedAt: participant.joinedAt,
    })
  } catch (error) {
    console.error('Check waiting room status error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
