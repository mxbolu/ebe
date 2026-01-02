import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/trending
 * Get trending books (most added/read recently)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'week' // 'week', 'month', 'year'
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get books that were added to reading lists recently
    const trendingBookIds = await prisma.readingEntry.groupBy({
      by: ['bookId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    })

    // Fetch full book details
    const bookIds = trendingBookIds.map(item => item.bookId)
    const books = await prisma.book.findMany({
      where: {
        id: { in: bookIds },
      },
    })

    // Sort books by trending count
    const booksMap = new Map(books.map(b => [b.id, b]))
    const trendingBooks = trendingBookIds
      .map(item => ({
        ...booksMap.get(item.bookId)!,
        trendingCount: item._count.id,
      }))
      .filter(Boolean)

    return NextResponse.json({
      books: trendingBooks,
      period,
      count: trendingBooks.length,
    })
  } catch (error) {
    console.error('Get trending error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending books' },
      { status: 500 }
    )
  }
}
