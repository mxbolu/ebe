import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/books/autocomplete
 * Get autocomplete suggestions for search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: 'Query must be at least 2 characters',
      })
    }

    const searchTerm = query.trim()
    const limit = 8 // Return top 8 suggestions

    // Search for matching titles and authors
    const [titleMatches, authorMatches] = await Promise.all([
      // Find books with matching titles
      prisma.book.findMany({
        where: {
          title: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          title: true,
          authors: true,
          coverImageUrl: true,
          publishedYear: true,
          averageRating: true,
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalRatings: 'desc' },
        ],
        take: limit,
      }),

      // Find books with matching authors
      prisma.$queryRaw<Array<{
        id: string
        title: string
        authors: string[]
        coverImageUrl: string | null
        publishedYear: number | null
        averageRating: number | null
      }>>`
        SELECT id, title, authors, "coverImageUrl", "publishedYear", "averageRating"
        FROM "Book"
        WHERE EXISTS (
          SELECT 1
          FROM unnest(authors) AS author
          WHERE author ILIKE ${`%${searchTerm}%`}
        )
        ORDER BY "averageRating" DESC NULLS LAST, "totalRatings" DESC
        LIMIT ${limit}
      `,
    ])

    // Combine and deduplicate results
    const combinedMap = new Map<string, any>()

    // Add title matches first (higher priority)
    titleMatches.forEach((book) => {
      combinedMap.set(book.id, {
        ...book,
        matchType: 'title',
        matchText: book.title,
      })
    })

    // Add author matches that aren't already in the map
    authorMatches.forEach((book) => {
      if (!combinedMap.has(book.id)) {
        // Find which author matched
        const matchingAuthor = book.authors.find((author) =>
          author.toLowerCase().includes(searchTerm.toLowerCase())
        )
        combinedMap.set(book.id, {
          ...book,
          matchType: 'author',
          matchText: matchingAuthor || book.authors[0],
        })
      }
    })

    // Convert to array and limit to top results
    const suggestions = Array.from(combinedMap.values()).slice(0, limit)

    return NextResponse.json({
      suggestions,
      query: searchTerm,
      count: suggestions.length,
    })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json(
      { error: 'Failed to get autocomplete suggestions' },
      { status: 500 }
    )
  }
}
