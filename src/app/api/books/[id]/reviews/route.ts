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
    let reviews = await prisma.readingEntry.findMany({
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
        sortBy === 'highest'
          ? { rating: 'desc' }
          : sortBy === 'lowest'
          ? { rating: 'asc' }
          : { createdAt: 'desc' },
    })

    // Add helpful count and sort by helpful if needed (in-memory sorting)
    const reviewsWithCount = reviews.map((review) => ({
      ...review,
      helpfulCount: review.helpfulMarks.length,
    }))

    // Sort by helpful if requested (client-side)
    if (sortBy === 'helpful') {
      reviewsWithCount.sort((a, b) => b.helpfulCount - a.helpfulCount)
    }

    // Apply pagination after sorting
    const hasMore = reviewsWithCount.length > offset + limit
    const paginatedReviews = reviewsWithCount
      .slice(offset, offset + limit)
      .map((review) => ({
        ...review,
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
