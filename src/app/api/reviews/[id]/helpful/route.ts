import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * POST /api/reviews/[id]/helpful
 * Mark a review as helpful
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: readingEntryId } = await params

  try {
    // Check if reading entry exists and has a review
    const entry = await prisma.readingEntry.findUnique({
      where: { id: readingEntryId },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    if (!entry.review && !entry.rating) {
      return NextResponse.json(
        { error: 'No review or rating to mark as helpful' },
        { status: 400 }
      )
    }

    // Can't mark own review as helpful
    if (entry.userId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot mark your own review as helpful' },
        { status: 400 }
      )
    }

    // Check if already marked
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        userId_readingEntryId: {
          userId: user.userId,
          readingEntryId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already marked as helpful' },
        { status: 409 }
      )
    }

    // Mark as helpful
    await prisma.reviewHelpful.create({
      data: {
        userId: user.userId,
        readingEntryId,
      },
    })

    // Get count of helpful marks
    const helpfulCount = await prisma.reviewHelpful.count({
      where: { readingEntryId },
    })

    console.log(`[Review] User ${user.userId} marked review ${readingEntryId} as helpful (total: ${helpfulCount})`)
    return NextResponse.json({ helpfulCount }, { status: 201 })
  } catch (error) {
    console.error('Mark review helpful error:', error)
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[id]/helpful
 * Remove helpful mark from a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: readingEntryId } = await params

  try {
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        userId_readingEntryId: {
          userId: user.userId,
          readingEntryId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not marked as helpful' },
        { status: 404 }
      )
    }

    await prisma.reviewHelpful.delete({
      where: {
        userId_readingEntryId: {
          userId: user.userId,
          readingEntryId,
        },
      },
    })

    // Get count of helpful marks
    const helpfulCount = await prisma.reviewHelpful.count({
      where: { readingEntryId },
    })

    console.log(`[Review] User ${user.userId} removed helpful mark from review ${readingEntryId} (total: ${helpfulCount})`)
    return NextResponse.json({ helpfulCount }, { status: 200 })
  } catch (error) {
    console.error('Remove helpful mark error:', error)
    return NextResponse.json(
      { error: 'Failed to remove helpful mark' },
      { status: 500 }
    )
  }
}
