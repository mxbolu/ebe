import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment is required').max(5000),
  parentId: z.string().optional().nullable(),
})

// GET /api/reviews/[id]/comments - Get all comments for a review (reading entry)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // This is the readingEntryId (the review)

    // Check if review exists
    const review = await prisma.readingEntry.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        isPrivate: true,
        review: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Only allow access to public reviews from finished books
    if (review.isPrivate || review.status !== 'FINISHED' || !review.review) {
      return NextResponse.json(
        { error: 'This review is not publicly available' },
        { status: 403 }
      )
    }

    // Fetch all comments (we'll organize them into threads on the client)
    const comments = await prisma.reviewComment.findMany({
      where: {
        readingEntryId: id,
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
        createdAt: 'asc', // Oldest first for proper threading
      },
    })

    // Organize into threaded structure
    const commentMap = new Map()
    const rootComments: any[] = []

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into tree structure
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return NextResponse.json({
      comments: rootComments,
      totalCount: comments.length,
    })
  } catch (error) {
    console.error('Get review comments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/comments - Add a comment to a review
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
    const { id } = await params // readingEntryId
    const body = await request.json()

    const validationResult = createCommentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Check if review exists and is public
    const review = await prisma.readingEntry.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        isPrivate: true,
        review: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (review.isPrivate || review.status !== 'FINISHED' || !review.review) {
      return NextResponse.json(
        { error: 'Cannot comment on this review' },
        { status: 403 }
      )
    }

    const data = validationResult.data

    // If parentId provided, verify it exists and belongs to same review
    if (data.parentId) {
      const parentComment = await prisma.reviewComment.findUnique({
        where: { id: data.parentId },
        select: { readingEntryId: true },
      })

      if (!parentComment || parentComment.readingEntryId !== id) {
        return NextResponse.json(
          { error: 'Invalid parent comment' },
          { status: 400 }
        )
      }
    }

    // Create the comment
    const comment = await prisma.reviewComment.create({
      data: {
        readingEntryId: id,
        userId: user.userId,
        comment: data.comment,
        parentId: data.parentId,
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

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
