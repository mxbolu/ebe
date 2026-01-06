import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/books/genres
 * Get all unique genres from books in the database
 */
export async function GET() {
  try {
    // Get all books with their genres
    const books = await prisma.book.findMany({
      select: {
        genres: true,
      },
      where: {
        genres: {
          isEmpty: false,
        },
      },
    })

    // Extract and flatten all genres
    const allGenres = books.flatMap((book) => book.genres)

    // Get unique genres and sort them
    const uniqueGenres = Array.from(new Set(allGenres)).sort()

    // Calculate genre counts for better UX
    const genreCounts = allGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Create genre list with counts
    const genresWithCounts = uniqueGenres.map((genre) => ({
      name: genre,
      count: genreCounts[genre],
    }))

    // Sort by count (most popular first)
    genresWithCounts.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      genres: genresWithCounts,
      total: uniqueGenres.length,
    })
  } catch (error) {
    console.error('Get genres error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genres' },
      { status: 500 }
    )
  }
}
