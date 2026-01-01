import prisma from '@/lib/prisma'

interface BookToCache {
  title: string
  authors: string[]
  isbn?: string
  coverImageUrl?: string
  description?: string
  publishedYear?: number
  genres?: string[]
  pageCount?: number
  publisher?: string
  language?: string
  averageRating?: number
  totalRatings?: number
  openLibraryId?: string
  googleBooksId?: string
  goodreadsId?: string
  source: 'openlibrary' | 'googlebooks' | 'goodreads'
}

/**
 * Background function to cache external API results in the database
 * Only caches books with ISBN or good metadata to maintain quality
 */
export function cacheSearchResults(books: BookToCache[]): void {
  // Run synchronously to ensure it starts before response is sent
  // But individual operations won't block the response
  (async () => {
    for (const book of books) {
      try {
        // Quality filter: Only cache if it has ISBN OR (cover + description)
        const hasGoodMetadata =
          book.isbn ||
          (book.coverImageUrl && book.description && book.description.length > 50)

        if (!hasGoodMetadata) {
          continue // Skip low-quality books
        }

        // Check if already exists by ISBN or external ID
        if (book.isbn) {
          const existing = await prisma.book.findUnique({
            where: { isbn: book.isbn },
          })
          if (existing) continue
        }

        // Map source to external ID field
        const externalIdField =
          book.source === 'openlibrary' ? 'openLibraryId' :
          book.source === 'googlebooks' ? 'googleBooksId' :
          book.source === 'goodreads' ? 'goodreadsId' : null

        // Check by external ID if available
        if (externalIdField && book[externalIdField]) {
          const existing = await prisma.book.findFirst({
            where: { [externalIdField]: book[externalIdField] },
          })
          if (existing) continue
        }

        // Create new book in database
        await prisma.book.create({
          data: {
            title: book.title,
            authors: book.authors,
            isbn: book.isbn || null,
            coverImageUrl: book.coverImageUrl || null,
            description: book.description || null,
            publishedYear: book.publishedYear || null,
            genres: book.genres || [],
            pageCount: book.pageCount || null,
            publisher: book.publisher || null,
            language: book.language || 'en',
            source: 'CACHED_FROM_SEARCH',
            averageRating: book.averageRating || null,
            totalRatings: book.totalRatings || 0,
            openLibraryId: book.openLibraryId || null,
            googleBooksId: book.googleBooksId || null,
            goodreadsId: book.goodreadsId || null,
            lastSyncedAt: new Date(),
          },
        })

        console.log(`📚 Cached book: ${book.title}`)
      } catch (error: any) {
        // Only log non-duplicate errors
        if (!error.code?.includes('P2002')) {
          console.error(`Failed to cache ${book.title}:`, error.message)
        }
      }
    }
  })()
}
