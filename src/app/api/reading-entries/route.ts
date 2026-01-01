import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const createEntrySchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH']),
  rating: z.number().min(1).max(5).optional(),
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
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = { userId: user.userId }

    if (status) {
      where.status = status
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
          },
        },
        progress: true,
      },
      orderBy: { updatedAt: 'desc' },
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
          details: validationResult.error.errors,
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

    // Create reading progress if status is CURRENTLY_READING
    if (data.status === 'CURRENTLY_READING' && book.pageCount) {
      await prisma.readingProgress.create({
        data: {
          readingEntryId: entry.id,
          currentPage: 0,
          totalPages: book.pageCount,
          progressPercentage: 0,
        },
      })
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
