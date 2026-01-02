import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/recommendations
 * Get personalized book recommendations based on reading history
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    // Get user's finished and highly-rated books
    const userBooks = await prisma.readingEntry.findMany({
      where: {
        userId: user.userId,
        OR: [
          { status: 'FINISHED', rating: { gte: 4 } },
          { isFavorite: true },
        ],
      },
      include: {
        book: {
          select: {
            genres: true,
            authors: true,
          },
        },
      },
      take: 20,
    })

    // Extract genres and authors from liked books
    const genres = new Set<string>()
    const authors = new Set<string>()

    userBooks.forEach(entry => {
      entry.book.genres.forEach(g => genres.add(g))
      entry.book.authors.forEach(a => authors.add(a))
    })

    // Get books the user hasn't read yet
    const userBookIds = await prisma.readingEntry.findMany({
      where: { userId: user.userId },
      select: { bookId: true },
    })
    const readBookIds = userBookIds.map(e => e.bookId)

    // Find recommendations based on genres and authors
    const recommendations = await prisma.book.findMany({
      where: {
        AND: [
          { id: { notIn: readBookIds } },
          {
            OR: [
              { genres: { hasSome: Array.from(genres) } },
              { authors: { hasSome: Array.from(authors) } },
            ],
          },
        ],
      },
      orderBy: [
        { totalRatings: 'desc' },
        { averageRating: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
      basedOn: {
        genres: Array.from(genres).slice(0, 5),
        authors: Array.from(authors).slice(0, 5),
      },
    })
  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}
