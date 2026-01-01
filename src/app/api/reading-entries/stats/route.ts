import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/reading-entries/stats
 * Get reading statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    // Get counts by status
    const statusCounts = await prisma.readingEntry.groupBy({
      by: ['status'],
      where: { userId: user.userId },
      _count: {
        id: true,
      },
    })

    // Get total counts
    const totalBooks = await prisma.readingEntry.count({
      where: { userId: user.userId },
    })

    const totalFavorites = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        isFavorite: true,
      },
    })

    // Get books with ratings
    const ratedBooks = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        rating: { not: null },
      },
    })

    // Get average rating
    const averageRatingResult = await prisma.readingEntry.aggregate({
      where: {
        userId: user.userId,
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
    })

    // Get total pages read (from finished books)
    const finishedBooks = await prisma.readingEntry.findMany({
      where: {
        userId: user.userId,
        status: 'FINISHED',
      },
      include: {
        book: {
          select: {
            pageCount: true,
          },
        },
      },
    })

    const totalPagesRead = finishedBooks.reduce((total, entry) => {
      return total + (entry.book.pageCount || 0)
    }, 0)

    // Get books finished this year
    const currentYear = new Date().getFullYear()
    const booksThisYear = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        status: 'FINISHED',
        finishDate: {
          gte: new Date(`${currentYear}-01-01`),
        },
      },
    })

    // Get books finished this month
    const currentDate = new Date()
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    )
    const booksThisMonth = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        status: 'FINISHED',
        finishDate: {
          gte: firstDayOfMonth,
        },
      },
    })

    // Format status counts
    const statsByStatus = {
      wantToRead: 0,
      currentlyReading: 0,
      finished: 0,
      didNotFinish: 0,
    }

    statusCounts.forEach((item) => {
      const count = item._count.id
      switch (item.status) {
        case 'WANT_TO_READ':
          statsByStatus.wantToRead = count
          break
        case 'CURRENTLY_READING':
          statsByStatus.currentlyReading = count
          break
        case 'FINISHED':
          statsByStatus.finished = count
          break
        case 'DID_NOT_FINISH':
          statsByStatus.didNotFinish = count
          break
      }
    })

    return NextResponse.json(
      {
        stats: {
          total: totalBooks,
          byStatus: statsByStatus,
          favorites: totalFavorites,
          rated: ratedBooks,
          averageRating: averageRatingResult._avg.rating || 0,
          totalPagesRead,
          booksThisYear,
          booksThisMonth,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get reading stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading statistics' },
      { status: 500 }
    )
  }
}
