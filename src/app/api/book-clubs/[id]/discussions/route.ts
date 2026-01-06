import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const createDiscussionSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000),
  replyToId: z.string().optional().nullable(),
})

// GET /api/book-clubs/[id]/discussions - Get all discussions for a book club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Optionally get user for member check
    let userId: string | undefined
    const authResult = authenticateRequest(request)
    if (!(authResult instanceof NextResponse)) {
      userId = authResult.user.userId
    }

    // Check if book club exists and if it's private, verify membership
    const bookClub = await prisma.bookClub.findUnique({
      where: { id },
      select: {
        isPublic: true,
        members: {
          where: { userId: userId || '' },
          select: { userId: true },
        },
      },
    })

    if (!bookClub) {
      return NextResponse.json(
        { error: 'Book club not found' },
        { status: 404 }
      )
    }

    if (!bookClub.isPublic && bookClub.members.length === 0) {
      return NextResponse.json(
        { error: 'Access denied. This is a private book club.' },
        { status: 403 }
      )
    }

    // Get discussions (only top-level, replies loaded via replies relation)
    const [discussions, total] = await Promise.all([
      prisma.bookClubDiscussion.findMany({
        where: {
          bookClubId: id,
          replyToId: null, // Only top-level discussions
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
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.bookClubDiscussion.count({
        where: {
          bookClubId: id,
          replyToId: null,
        },
      }),
    ])

    return NextResponse.json({
      discussions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + discussions.length < total,
      },
    })
  } catch (error) {
    console.error('Get discussions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    )
  }
}

// POST /api/book-clubs/[id]/discussions - Create a new discussion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate the request
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const { id } = await params
    const body = await request.json()

    const validationResult = createDiscussionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Check if user is a member
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
        { error: 'Must be a member to post discussions' },
        { status: 403 }
      )
    }

    const data = validationResult.data

    // If replyToId provided, verify it exists
    if (data.replyToId) {
      const parentDiscussion = await prisma.bookClubDiscussion.findUnique({
        where: { id: data.replyToId },
        select: { bookClubId: true },
      })

      if (!parentDiscussion || parentDiscussion.bookClubId !== id) {
        return NextResponse.json(
          { error: 'Invalid parent discussion' },
          { status: 400 }
        )
      }
    }

    // Create discussion
    const discussion = await prisma.bookClubDiscussion.create({
      data: {
        bookClubId: id,
        userId: user.userId,
        message: data.message,
        replyToId: data.replyToId,
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

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Create discussion error:', error)
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    )
  }
}
