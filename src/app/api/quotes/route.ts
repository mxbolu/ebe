import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/quotes?bookId=...
 * Get quotes for a specific book or all quotes for the user
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')
  const favoritesOnly = searchParams.get('favorites') === 'true'

  try {
    const where: any = { userId: user.userId }
    if (bookId) {
      where.bookId = bookId
    }
    if (favoritesOnly) {
      where.isFavorite = true
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ quotes })
  } catch (error) {
    console.error('Get quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quotes
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { bookId, text, page, isFavorite } = body

    if (!bookId || !text) {
      return NextResponse.json(
        { error: 'Book ID and text are required' },
        { status: 400 }
      )
    }

    const quote = await prisma.quote.create({
      data: {
        userId: user.userId,
        bookId,
        text,
        page: page || null,
        isFavorite: isFavorite || false,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
          },
        },
      },
    })

    return NextResponse.json({ quote }, { status: 201 })
  } catch (error) {
    console.error('Create quote error:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
