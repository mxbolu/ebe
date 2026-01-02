import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')
    const sortBy = searchParams.get('sortBy') || 'recent' // recent, helpful, highest, lowest
    const offset = (page - 1) * limit

    // Fetch reading entries with reviews for this book (only from finished books)
    const reviews = await prisma.readingEntry.findMany({
      where: {
        bookId: id,
        status: 'FINISHED', // Only show reviews from finished books
        isPrivate: false, // Only show public reviews
        OR: [
          { review: { not: null } },
          { rating: { not: null } },
        ],
      },
      select: {
        id: true,
        rating: true,
        review: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        helpfulMarks: {
          select: {
            id: true,
          },
        },
      },
      orderBy:
        sortBy === 'helpful'
          ? { helpfulMarks: { _count: 'desc' } }
          : sortBy === 'highest'
          ? { rating: 'desc' }
          : sortBy === 'lowest'
          ? { rating: 'asc' }
          : { createdAt: 'desc' },
      take: limit + 1,
      skip: offset,
    })

    const hasMore = reviews.length > limit
    const paginatedReviews = reviews.slice(0, limit).map((review) => ({
      ...review,
      helpfulCount: review.helpfulMarks.length,
      helpfulMarks: undefined, // Remove from response
    }))

    return NextResponse.json({
      reviews: paginatedReviews,
      hasMore,
      page,
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
