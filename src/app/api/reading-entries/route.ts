import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { logFinishedBook, logStartedBook, logReviewedBook } from '@/lib/activity'

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

const createEntrySchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH']),
  rating: z.number().min(1.0).max(10.0).optional(),
  review: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().datetime().optional(),
  finishDate: z.string().datetime().optional(),
  isFavorite: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

/**
 * GET /api/reading-entries
 * Get all reading entries for the authenticated user
 *
 * Query parameters:
 * - status: Filter by status (WANT_TO_READ, CURRENTLY_READING, FINISHED, DID_NOT_FINISH)
 * - isFavorite: Filter favorites (true/false)
 * - hasRating: Filter entries with ratings (true/false)
 * - sortBy: Sort field (updatedAt, createdAt, rating, title)
 * - sortOrder: Sort order (asc, desc) - default: desc
 * - limit: Number of results (default: 20)
 * - offset: Skip results (default: 0)
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const isFavorite = searchParams.get('isFavorite')
  const hasRating = searchParams.get('hasRating')
  const sortBy = searchParams.get('sortBy') || 'updatedAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = { userId: user.userId }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Filter by favorite
    if (isFavorite !== null && isFavorite !== undefined) {
      where.isFavorite = isFavorite === 'true'
    }

    // Filter by has rating
    if (hasRating === 'true') {
      where.rating = { not: null }
    } else if (hasRating === 'false') {
      where.rating = null
    }

    // Determine sort order
    let orderBy: any = { updatedAt: sortOrder }

    if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder }
    } else if (sortBy === 'rating') {
      orderBy = { rating: sortOrder }
    } else if (sortBy === 'title') {
      orderBy = { book: { title: sortOrder } }
    }

    const entries = await prisma.readingEntry.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverImageUrl: true,
            publishedYear: true,
            pageCount: true,
            genres: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    })

    const total = await prisma.readingEntry.count({ where })

    return NextResponse.json(
      {
        entries,
        total,
        hasMore: total > offset + limit,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get reading entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reading-entries
 * Create a new reading entry
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const validationResult = createEntrySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: data.bookId },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check if entry already exists
    const existingEntry = await prisma.readingEntry.findUnique({
      where: {
        userId_bookId: {
          userId: user.userId,
          bookId: data.bookId,
        },
      },
    })

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Reading entry already exists for this book' },
        { status: 409 }
      )
    }

    // Validate that rating/review are only allowed for finished books
    if (data.status !== 'FINISHED' && (data.rating || data.review)) {
      return NextResponse.json(
        { error: 'Rating and review can only be added to finished books' },
        { status: 400 }
      )
    }

    // Create reading entry
    const entry = await prisma.readingEntry.create({
      data: {
        userId: user.userId,
        bookId: data.bookId,
        status: data.status,
        rating: data.rating,
        review: data.review,
        notes: data.notes,
        startDate: data.startDate ? new Date(data.startDate) : null,
        finishDate: data.finishDate ? new Date(data.finishDate) : null,
        isFavorite: data.isFavorite ?? false,
        isPrivate: data.isPrivate ?? false,
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

    // Recalculate book's average rating if a rating was added
    if (data.rating !== undefined && data.status === 'FINISHED') {
      await updateBookAverageRating(data.bookId)
    }

    // Log activity based on initial status
    const bookTitle = book.title
    const bookAuthor = book.author || (book as any).authors?.[0] || 'Unknown Author'

    if (data.status === 'CURRENTLY_READING') {
      await logStartedBook(user.userId, data.bookId, bookTitle, bookAuthor)
    } else if (data.status === 'FINISHED') {
      await logFinishedBook(user.userId, data.bookId, bookTitle, bookAuthor)

      // Also log review activity if review/rating was added and entry is not private
      if ((data.rating || data.review) && !entry.isPrivate) {
        await logReviewedBook(
          user.userId,
          data.bookId,
          bookTitle,
          bookAuthor,
          data.rating,
          data.review
        )
      }
    }

    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    console.error('Create reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to create reading entry' },
      { status: 500 }
    )
  }
}
