import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
})

/**
 * GET /api/book-clubs/[id]/meetings/[meetingId]
 * Get a specific meeting
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const { id, meetingId } = await params

  try {
    const meeting = await prisma.bookClubMeeting.findUnique({
      where: {
        id: meetingId,
        bookClubId: id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        bookClub: {
          select: {
            id: true,
            name: true,
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

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Get meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/book-clubs/[id]/meetings/[meetingId]
 * Update a meeting
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id, meetingId } = await params

  try {
    const body = await request.json()
    const validationResult = updateMeetingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    // Check if meeting exists
    const existingMeeting = await prisma.bookClubMeeting.findUnique({
      where: {
        id: meetingId,
        bookClubId: id,
      },
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user is admin/moderator or meeting creator
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    const canUpdate =
      existingMeeting.createdById === user.userId ||
      (membership && ['admin', 'moderator'].includes(membership.role))

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this meeting' },
        { status: 403 }
      )
    }

    const data = validationResult.data

    // Update the meeting
    const meeting = await prisma.bookClubMeeting.update({
      where: { id: meetingId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.duration && { duration: data.duration }),
        ...(data.status && { status: data.status }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      meeting,
      message: 'Meeting updated successfully',
    })
  } catch (error) {
    console.error('Update meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/book-clubs/[id]/meetings/[meetingId]
 * Delete a meeting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; meetingId: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id, meetingId } = await params

  try {
    // Check if meeting exists
    const existingMeeting = await prisma.bookClubMeeting.findUnique({
      where: {
        id: meetingId,
        bookClubId: id,
      },
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if user is admin/moderator or meeting creator
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    const canDelete =
      existingMeeting.createdById === user.userId ||
      (membership && ['admin', 'moderator'].includes(membership.role))

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this meeting' },
        { status: 403 }
      )
    }

    // Delete the meeting
    await prisma.bookClubMeeting.delete({
      where: { id: meetingId },
    })

    return NextResponse.json({
      message: 'Meeting deleted successfully',
    })
  } catch (error) {
    console.error('Delete meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}
