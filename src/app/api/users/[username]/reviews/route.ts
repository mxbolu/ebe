import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch reviews
    const reviews = await prisma.readingEntry.findMany({
      where: {
        userId: user.id,
        isPrivate: false,
        status: 'FINISHED',
        OR: [
          { review: { not: null } },
          { rating: { not: null } },
        ],
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverImage: true,
          },
        },
        helpfulMarks: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.readingEntry.count({
      where: {
        userId: user.id,
        isPrivate: false,
        status: 'FINISHED',
        OR: [
          { review: { not: null } },
          { rating: { not: null } },
        ],
      },
    })

    const hasMore = total > offset + limit

    // Format reviews with helpful count
    const formattedReviews = reviews.map((review) => ({
      ...review,
      helpfulCount: review.helpfulMarks.length,
      helpfulMarks: undefined,
    }))

    return NextResponse.json({
      reviews: formattedReviews,
      hasMore,
      page,
      total,
    })
  } catch (error) {
    console.error('Get user reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
