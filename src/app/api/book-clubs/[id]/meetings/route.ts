import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { generateChannelName, getAgoraAppId } from '@/lib/agora'
import { notifyMeetingScheduled } from '@/lib/notifications'

const createMeetingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
})

/**
 * GET /api/book-clubs/[id]/meetings
 * Get all meetings for a book club
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Check if book club exists
    const bookClub = await prisma.bookClub.findUnique({
      where: { id },
      select: { id: true, isPublic: true },
    })

    if (!bookClub) {
      return NextResponse.json(
        { error: 'Book club not found' },
        { status: 404 }
      )
    }

    // Get meetings
    const meetings = await prisma.bookClubMeeting.findMany({
      where: {
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
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    return NextResponse.json({
      meetings,
      total: meetings.length,
    })
  } catch (error) {
    console.error('Get meetings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/book-clubs/[id]/meetings
 * Create a new meeting for a book club
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    const body = await request.json()
    const validationResult = createMeetingSchema.safeParse(body)

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
        { error: 'Only admins and moderators can create meetings' },
        { status: 403 }
      )
    }

    const data = validationResult.data

    // Create the meeting
    const meeting = await prisma.bookClubMeeting.create({
      data: {
        bookClubId: id,
        title: data.title,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        agoraChannelName: '', // Will be set after creation
        agoraAppId: getAgoraAppId(),
        createdById: user.userId,
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

    // Generate and update channel name
    const channelName = generateChannelName(id, meeting.id)
    await prisma.bookClubMeeting.update({
      where: { id: meeting.id },
      data: { agoraChannelName: channelName },
    })

    // Send notifications to all book club members (async, non-blocking)
    prisma.bookClub
      .findUnique({
        where: { id },
        include: {
          members: {
            select: { userId: true },
          },
        },
      })
      .then((bookClub) => {
        if (bookClub) {
          const memberIds = bookClub.members.map((m) => m.userId)
          notifyMeetingScheduled(
            memberIds,
            bookClub.name,
            data.title,
            new Date(data.scheduledAt),
            id,
            meeting.id
          ).catch((err) => console.error('Failed to send meeting notifications:', err))
        }
      })
      .catch((err) => console.error('Failed to fetch book club for notifications:', err))

    return NextResponse.json(
      {
        meeting: {
          ...meeting,
          agoraChannelName: channelName,
        },
        message: 'Meeting created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create meeting error:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
