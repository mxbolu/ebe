import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { checkAllBadges, updateReadingStreak } from '@/lib/badges'
import { updateChallengeProgress } from '@/lib/challenges'
import { updateReadingGoal } from '@/lib/reading-goals'
import { logFinishedBook } from '@/lib/activity'

const rereadSchema = z.object({
  rating: z.number().min(1.0).max(10.0).nullable().optional(),
  review: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  finishDate: z.string().datetime().optional(),
})

/**
 * POST /api/reading-entries/[id]/reread
 * Mark a book as read again (increment read count)
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
    const validationResult = rereadSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.readingEntry.findUnique({
      where: { id },
      include: { book: true },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const data = validationResult.data
    const newFinishDate = data.finishDate ? new Date(data.finishDate) : new Date()

    // Update entry: increment readCount, update status to FINISHED, set lastReadDate
    const entry = await prisma.readingEntry.update({
      where: { id },
      data: {
        status: 'FINISHED',
        readCount: { increment: 1 },
        lastReadDate: newFinishDate,
        finishDate: newFinishDate, // Also update finishDate to most recent
        rating: data.rating !== undefined ? data.rating : existingEntry.rating,
        review: data.review !== undefined ? data.review : existingEntry.review,
        notes: data.notes !== undefined ? data.notes : existingEntry.notes,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverImageUrl: true,
            publishedYear: true,
            pageCount: true,
          },
        },
      },
    })

    // Log activity
    const bookAuthor = entry.book.authors?.[0] || 'Unknown Author'
    await logFinishedBook(user.userId, entry.book.id, entry.book.title, bookAuthor)

    // Update reading goals, challenge progress, badges, and streak
    await Promise.all([
      updateReadingGoal(user.userId),
      updateChallengeProgress(user.userId, entry.book.id),
      updateReadingStreak(user.userId),
      checkAllBadges(user.userId),
    ])

    return NextResponse.json(
      {
        entry,
        message: `Marked as read again! Total reads: ${entry.readCount}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Reread entry error:', error)
    return NextResponse.json(
      { error: 'Failed to mark book as read again' },
      { status: 500 }
    )
  }
}
