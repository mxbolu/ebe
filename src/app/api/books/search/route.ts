import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { openLibraryService } from '@/lib/services/openLibrary'
import { googleBooksService } from '@/lib/services/googleBooks'
import { goodreadsService } from '@/lib/services/goodreads'
import { cacheSearchResults } from '@/lib/utils/cacheSearchResults'

export const dynamic = 'force-dynamic'

interface SearchParams {
  query: string
  limit?: number
  offset?: number
  source?: 'database' | 'openlibrary' | 'googlebooks' | 'goodreads' | 'all'
  genre?: string
  author?: string
  minRating?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = (searchParams.get('source') || 'all') as SearchParams['source']
    const genre = searchParams.get('genre') || undefined
    const author = searchParams.get('author') || undefined
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined

    if (!query && !genre && !author) {
      return NextResponse.json(
        { error: 'Please provide a search query, genre, or author' },
        { status: 400 }
      )
    }

    // Always search database first
    const databaseResults = await searchDatabase({
      query,
      limit,
      offset,
      genre,
      author,
      minRating,
    })

    // If database has enough results or user only wants database results
    if (source === 'database' || databaseResults.length >= limit) {
      return NextResponse.json({
        results: databaseResults,
        total: databaseResults.length,
        source: 'database',
        hasMore: databaseResults.length === limit,
      })
    }

    // If not enough results, fetch from external APIs
    const externalResults = await searchExternalAPIs({
      query,
      limit: limit - databaseResults.length,
      source,
      genre,
      author,
    })

    // Combine and deduplicate results
    const combinedResults = [...databaseResults, ...externalResults]
    const uniqueResults = deduplicateResults(combinedResults)

    // Cache external results in background (non-blocking)
    if (externalResults.length > 0) {
      cacheSearchResults(externalResults)
    }

    return NextResponse.json({
      results: uniqueResults.slice(0, limit),
      total: uniqueResults.length,
      source: databaseResults.length > 0 ? 'hybrid' : 'external',
      databaseCount: databaseResults.length,
      externalCount: externalResults.length,
      hasMore: uniqueResults.length === limit,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}

async function searchDatabase(params: SearchParams) {
  const { query, limit = 20, offset = 0, genre, author, minRating } = params

  const whereConditions: any = {
    AND: [],
  }

  // Text search on title and authors
  if (query) {
    whereConditions.AND.push({
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { authors: { hasSome: [query] } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    })
  }

  // Genre filter
  if (genre) {
    whereConditions.AND.push({
      genres: { hasSome: [genre] },
    })
  }

  // Author filter
  if (author) {
    whereConditions.AND.push({
      authors: { hasSome: [author] },
    })
  }

  // Rating filter
  if (minRating) {
    whereConditions.AND.push({
      averageRating: { gte: minRating },
    })
  }

  const books = await prisma.book.findMany({
    where: whereConditions.AND.length > 0 ? whereConditions : undefined,
    take: limit,
    skip: offset,
    orderBy: [
      { averageRating: 'desc' },
      { totalRatings: 'desc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      authors: true,
      isbn: true,
      coverImageUrl: true,
      description: true,
      publishedYear: true,
      genres: true,
      pageCount: true,
      publisher: true,
      language: true,
      averageRating: true,
      totalRatings: true,
      source: true,
      openLibraryId: true,
      googleBooksId: true,
      goodreadsId: true,
    },
  })

  return books.map((book) => ({
    ...book,
    source: 'database' as const,
  }))
}

async function searchExternalAPIs(params: {
  query: string
  limit: number
  source: SearchParams['source']
  genre?: string
  author?: string
}) {
  const { query, limit, source, genre, author } = params
  const results: any[] = []

  try {
    // Determine which APIs to search
    const searchOpenLibrary = source === 'all' || source === 'openlibrary'
    const searchGoogleBooks = source === 'all' || source === 'googlebooks'
    const searchGoodreads = source === 'all' || source === 'goodreads'

    // Search Open Library
    if (searchOpenLibrary && results.length < limit) {
      try {
        const olBooks = await openLibraryService.searchBooks(query, Math.min(limit - results.length, 20))
        results.push(
          ...olBooks.map((book) => ({
            title: book.title,
            authors: book.authors,
            isbn: book.isbn,
            coverImageUrl: book.coverUrl,
            description: book.description,
            publishedYear: book.publishedYear,
            genres: book.genres,
            pageCount: book.pageCount,
            publisher: book.publisher,
            language: book.language,
            openLibraryId: book.openLibraryId,
            source: 'openlibrary' as const,
          }))
        )
      } catch (error) {
        console.error('Open Library search error:', error)
      }
    }

    // Search Google Books
    if (searchGoogleBooks && results.length < limit) {
      try {
        const gbBooks = await googleBooksService.searchBooks(query, Math.min(limit - results.length, 20))
        results.push(
          ...gbBooks.map((book) => ({
            title: book.title,
            authors: book.authors,
            isbn: book.isbn,
            coverImageUrl: book.coverUrl,
            description: book.description,
            publishedYear: book.publishedYear,
            genres: book.categories,
            pageCount: book.pageCount,
            publisher: book.publisher,
            language: book.language,
            googleBooksId: book.googleBooksId,
            source: 'googlebooks' as const,
          }))
        )
      } catch (error) {
        console.error('Google Books search error:', error)
      }
    }

    // Search Goodreads
    if (searchGoodreads && results.length < limit) {
      try {
        const grBooks = await goodreadsService.searchBooks(query, 1)
        results.push(
          ...grBooks.map((book) => ({
            title: book.title,
            authors: book.authors,
            isbn: book.isbn,
            coverImageUrl: book.coverUrl,
            description: book.description,
            publishedYear: book.publishedYear,
            genres: book.genres,
            pageCount: book.pageCount,
            publisher: book.publisher,
            language: book.language,
            averageRating: book.averageRating,
            totalRatings: book.ratingsCount,
            goodreadsId: book.goodreadsId,
            source: 'goodreads' as const,
          }))
        )
      } catch (error) {
        console.error('Goodreads search error:', error)
      }
    }
  } catch (error) {
    console.error('External API search error:', error)
  }

  return results
}

function deduplicateResults(results: any[]) {
  const seen = new Set<string>()
  const deduplicated: any[] = []

  for (const book of results) {
    // Create a unique key based on ISBN or title+author
    const key = book.isbn || `${book.title}-${book.authors[0]}`.toLowerCase()

    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(book)
    }
  }

  return deduplicated
}
