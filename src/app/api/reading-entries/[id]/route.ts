import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { checkAllBadges, updateReadingStreak } from '@/lib/badges'
import { logFinishedBook, logStartedBook, logReviewedBook } from '@/lib/activity'
import { updateChallengeProgress } from '@/lib/challenges'
import { updateReadingGoal } from '@/lib/reading-goals'

/**
 * Helper function to update a book's average rating and total ratings
 */
async function updateBookAverageRating(bookId: string) {
  // Get all finished, public reading entries with ratings for this book
  const entriesWithRatings = await prisma.readingEntry.findMany({
    where: {
      bookId,
      status: 'FINISHED',
      isPrivate: false,
      rating: { not: null },
    },
    select: {
      rating: true,
    },
  })

  const totalRatings = entriesWithRatings.length
  const averageRating = totalRatings > 0
    ? entriesWithRatings.reduce((sum, entry) => sum + (entry.rating || 0), 0) / totalRatings
    : null

  // Update the book's average rating and total ratings
  await prisma.book.update({
    where: { id: bookId },
    data: {
      averageRating,
      totalRatings,
    },
  })
}

/**
 * Helper function to update reading goal's current book count
 */
async function updateReadingGoal(userId: string, finishDate: Date | null) {
  if (!finishDate) return

  const year = finishDate.getFullYear()

  // Count books finished in this year
  const currentBooks = await prisma.readingEntry.count({
    where: {
      userId,
      status: 'FINISHED',
      finishDate: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  })

  // Update the goal if it exists
  await prisma.readingGoal.updateMany({
    where: {
      userId,
      year,
    },
    data: {
      currentBooks,
    },
  })
}

const updateEntrySchema = z.object({
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH']).optional(),
  rating: z.number().min(1.0).max(10.0).nullable().optional(),
  review: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  finishDate: z.string().datetime().nullable().optional(),
  isFavorite: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

/**
 * GET /api/reading-entries/[id]
 * Get a specific reading entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    const entry = await prisma.readingEntry.findUnique({
      where: { id },
      include: {
        book: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this entry or if it's public
    if (entry.userId !== user.userId && entry.isPrivate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ entry }, { status: 200 })
  } catch (error) {
    console.error('Get reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading entry' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reading-entries/[id]
 * Update a reading entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    const body = await request.json()
    const validationResult = updateEntrySchema.safeParse(body)

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
    const updateData: any = {}

    console.log('[UPDATE ENTRY] Request data:', JSON.stringify(data, null, 2))
    console.log('[UPDATE ENTRY] Existing entry status:', existingEntry.status)

    if (data.status !== undefined) updateData.status = data.status

    // Determine final status (new status or existing status)
    const finalStatus = data.status !== undefined ? data.status : existingEntry.status

    console.log('[UPDATE ENTRY] Final status:', finalStatus)

    // Only allow rating and review for FINISHED books
    if (finalStatus === 'FINISHED') {
      // Allow updating rating and review for finished books
      console.log('[UPDATE ENTRY] Book is FINISHED, processing rating and review...')
      console.log('[UPDATE ENTRY] data.rating:', data.rating)
      console.log('[UPDATE ENTRY] data.review:', data.review)

      if (data.rating !== undefined) updateData.rating = data.rating
      if (data.review !== undefined) updateData.review = data.review

      console.log('[UPDATE ENTRY] updateData after FINISHED processing:', JSON.stringify(updateData, null, 2))
    } else {
      // Clear rating and review if book is not finished
      console.log('[UPDATE ENTRY] Book is NOT FINISHED, clearing rating and review')
      updateData.rating = null
      updateData.review = null
    }

    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.finishDate !== undefined) {
      updateData.finishDate = data.finishDate ? new Date(data.finishDate) : null
    }

    console.log('[UPDATE ENTRY] Final updateData before database update:', JSON.stringify(updateData, null, 2))

    // Update reading entry
    const entry = await prisma.readingEntry.update({
      where: { id },
      data: updateData,
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

    // Recalculate book's average rating if rating was changed
    if (data.rating !== undefined || (data.status !== undefined && data.status !== 'FINISHED')) {
      await updateBookAverageRating(existingEntry.bookId)
    }

    // Update reading goal if status changed to/from FINISHED
    const statusChanged = data.status !== undefined && data.status !== existingEntry.status
    const affectsGoal = statusChanged && (data.status === 'FINISHED' || existingEntry.status === 'FINISHED')

    if (affectsGoal) {
      await updateReadingGoal(user.userId, entry.finishDate || existingEntry.finishDate)
    }

    // Check for badges and update streak if book was marked as finished
    if (data.status === 'FINISHED') {
      await Promise.all([
        updateReadingStreak(user.userId),
        checkAllBadges(user.userId),
      ])
    }

    // Log activity based on status changes
    const statusChanged = data.status !== undefined && data.status !== existingEntry.status

    if (statusChanged) {
      const bookTitle = existingEntry.book.title
      const bookAuthor = existingEntry.book.author || (existingEntry.book as any).authors?.[0] || 'Unknown Author'

      if (data.status === 'CURRENTLY_READING') {
        await logStartedBook(user.userId, existingEntry.bookId, bookTitle, bookAuthor)
      } else if (data.status === 'FINISHED') {
        await logFinishedBook(user.userId, existingEntry.bookId, bookTitle, bookAuthor)

        // Update challenge progress and reading goal
        await Promise.all([
          updateChallengeProgress(user.userId, existingEntry.bookId),
          updateReadingGoal(user.userId),
        ])
      }
    }

    // Log review activity if review or rating was added/updated
    const reviewAdded = (data.review !== undefined || data.rating !== undefined) &&
                       finalStatus === 'FINISHED' &&
                       !entry.isPrivate

    if (reviewAdded) {
      const bookTitle = existingEntry.book.title
      const bookAuthor = existingEntry.book.author || (existingEntry.book as any).authors?.[0] || 'Unknown Author'

      await logReviewedBook(
        user.userId,
        existingEntry.bookId,
        bookTitle,
        bookAuthor,
        entry.rating || undefined,
        entry.review || undefined
      )
    }

    return NextResponse.json({ entry }, { status: 200 })
  } catch (error) {
    console.error('Update reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to update reading entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reading-entries/[id]
 * Delete a reading entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    // Check if entry exists and belongs to user
    const existingEntry = await prisma.readingEntry.findUnique({
      where: { id },
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

    const bookId = existingEntry.bookId
    const wasFinished = existingEntry.status === 'FINISHED'

    // Delete reading entry (progress will be deleted via cascade)
    await prisma.readingEntry.delete({
      where: { id },
    })

    // Recalculate book's average rating
    await updateBookAverageRating(bookId)

    // Update reading goal if a finished book was deleted
    if (wasFinished && existingEntry.finishDate) {
      await updateReadingGoal(user.userId, existingEntry.finishDate)
    }

    return NextResponse.json(
      { message: 'Reading entry deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading entry' },
      { status: 500 }
    )
  }
}
