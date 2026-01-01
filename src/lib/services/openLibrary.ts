import axios from 'axios'
import { z } from 'zod'

const OPEN_LIBRARY_API = 'https://openlibrary.org'
const OPEN_LIBRARY_COVERS = 'https://covers.openlibrary.org/b'

// Zod schemas for validation
const AuthorSchema = z.object({
  key: z.string(),
  name: z.string().optional(),
})

const OpenLibraryWorkSchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(AuthorSchema).optional(),
  description: z.union([z.string(), z.object({ value: z.string() })]).optional(),
  subjects: z.array(z.string()).optional(),
  covers: z.array(z.number()).optional(),
  first_publish_year: z.number().optional(),
})

const OpenLibraryEditionSchema = z.object({
  key: z.string(),
  title: z.string(),
  authors: z.array(z.object({ key: z.string() })).optional(),
  publishers: z.array(z.string()).optional(),
  publish_date: z.string().optional(),
  isbn_10: z.array(z.string()).optional(),
  isbn_13: z.array(z.string()).optional(),
  number_of_pages: z.number().optional(),
  covers: z.array(z.number()).optional(),
  languages: z.array(z.object({ key: z.string() })).optional(),
})

export interface OpenLibraryBook {
  openLibraryId: string
  title: string
  authors: string[]
  isbn?: string
  description?: string
  publishedYear?: number
  genres: string[]
  pageCount?: number
  publisher?: string
  language?: string
  coverUrl?: string
}

export class OpenLibraryService {
  // Popular subjects for comprehensive coverage
  static readonly POPULAR_SUBJECTS = [
    'fiction',
    'fantasy',
    'science_fiction',
    'romance',
    'mystery',
    'thriller',
    'horror',
    'historical_fiction',
    'biography',
    'history',
    'science',
    'psychology',
    'philosophy',
    'business',
    'self_help',
    'cooking',
    'art',
    'poetry',
    'drama',
    'humor',
    'travel',
    'religion',
    'children',
    'young_adult',
    'graphic_novels',
    'comics',
    'education',
    'politics',
    'economics',
    'technology',
  ]

  private axiosInstance = axios.create({
    baseURL: OPEN_LIBRARY_API,
    timeout: 30000,
    headers: {
      'User-Agent': 'ebe-reading-journal/1.0',
    },
  })

  /**
   * Search for books by title, author, or ISBN
   */
  async searchBooks(query: string, limit = 20): Promise<OpenLibraryBook[]> {
    try {
      const response = await this.axiosInstance.get('/search.json', {
        params: {
          q: query,
          limit,
          fields: 'key,title,author_name,first_publish_year,isbn,publisher,subject,cover_i,number_of_pages_median',
        },
      })

      const books: OpenLibraryBook[] = []

      for (const doc of response.data.docs || []) {
        books.push({
          openLibraryId: doc.key,
          title: doc.title || 'Unknown Title',
          authors: doc.author_name || [],
          isbn: doc.isbn?.[0],
          publishedYear: doc.first_publish_year,
          genres: (doc.subject || []).slice(0, 5), // Limit to 5 genres
          pageCount: doc.number_of_pages_median,
          publisher: doc.publisher?.[0],
          coverUrl: doc.cover_i ? this.getCoverUrl(doc.cover_i, 'M') : undefined,
        })
      }

      return books
    } catch (error) {
      console.error('Open Library search error:', error)
      return []
    }
  }

  /**
   * Get detailed book information by Open Library work ID
   */
  async getWorkDetails(workId: string): Promise<OpenLibraryBook | null> {
    try {
      // Fetch work details
      const workResponse = await this.axiosInstance.get(`/works/${workId}.json`)
      const work = OpenLibraryWorkSchema.parse(workResponse.data)

      // Fetch author names
      const authorNames: string[] = []
      if (work.authors) {
        for (const author of work.authors) {
          try {
            const authorResponse = await this.axiosInstance.get(`${author.key}.json`)
            authorNames.push(authorResponse.data.name || 'Unknown Author')
          } catch {
            authorNames.push('Unknown Author')
          }
        }
      }

      // Extract description
      let description: string | undefined
      if (work.description) {
        description = typeof work.description === 'string'
          ? work.description
          : work.description.value
      }

      // Get cover URL
      const coverUrl = work.covers?.[0]
        ? this.getCoverUrl(work.covers[0], 'L')
        : undefined

      return {
        openLibraryId: work.key,
        title: work.title,
        authors: authorNames.length > 0 ? authorNames : ['Unknown Author'],
        description,
        publishedYear: work.first_publish_year,
        genres: work.subjects?.slice(0, 5) || [],
        coverUrl,
      }
    } catch (error) {
      console.error(`Failed to fetch work ${workId}:`, error)
      return null
    }
  }

  /**
   * Get book edition details (includes ISBN, publisher, page count)
   */
  async getEditionDetails(editionId: string): Promise<Partial<OpenLibraryBook> | null> {
    try {
      const response = await this.axiosInstance.get(`/books/${editionId}.json`)
      const edition = OpenLibraryEditionSchema.parse(response.data)

      return {
        isbn: edition.isbn_13?.[0] || edition.isbn_10?.[0],
        publisher: edition.publishers?.[0],
        pageCount: edition.number_of_pages,
        language: edition.languages?.[0]?.key?.split('/')?.[2] || 'en',
        coverUrl: edition.covers?.[0]
          ? this.getCoverUrl(edition.covers[0], 'L')
          : undefined,
      }
    } catch (error) {
      console.error(`Failed to fetch edition ${editionId}:`, error)
      return null
    }
  }

  /**
   * Fetch books in bulk using the Open Library bulk data
   * This method would download and process the data dumps
   */
  async *fetchBulkWorks(startOffset = 0, batchSize = 1000): AsyncGenerator<OpenLibraryBook[]> {
    // Iterate through popular subjects for comprehensive coverage
    for (const subject of OpenLibraryService.POPULAR_SUBJECTS) {
      let offset = startOffset
      let hasMore = true

      while (hasMore) {
        try {
          const response = await this.axiosInstance.get('/search.json', {
            params: {
              subject,
              limit: Math.min(batchSize, 100), // Open Library limits to 100 per request
              offset,
              fields: 'key,title,author_name,first_publish_year,isbn,publisher,subject,cover_i,number_of_pages_median',
            },
          })

          const docs = response.data.docs || []
          if (docs.length === 0) {
            hasMore = false
            break
          }

          const books: OpenLibraryBook[] = docs.map((doc: any) => ({
            openLibraryId: doc.key,
            title: doc.title || 'Unknown Title',
            authors: doc.author_name || ['Unknown Author'],
            isbn: doc.isbn?.[0],
            publishedYear: doc.first_publish_year,
            genres: (doc.subject || []).slice(0, 5),
            pageCount: doc.number_of_pages_median,
            publisher: doc.publisher?.[0],
            coverUrl: doc.cover_i ? this.getCoverUrl(doc.cover_i, 'M') : undefined,
          }))

          yield books

          offset += docs.length

          // If we got less than requested, we've reached the end for this subject
          if (docs.length < Math.min(batchSize, 100)) {
            hasMore = false
          }

          // Rate limiting: Wait 1 second between batches
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Bulk fetch error for subject "${subject}":`, error)
          hasMore = false
        }
      }

      // Reset offset for next subject
      startOffset = 0
    }
  }

  /**
   * Get cover image URL
   */
  private getCoverUrl(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
    return `${OPEN_LIBRARY_COVERS}/id/${coverId}-${size}.jpg`
  }

  /**
   * Get cover URL by ISBN
   */
  getCoverByISBN(isbn: string, size: 'S' | 'M' | 'L' = 'M'): string {
    return `${OPEN_LIBRARY_COVERS}/isbn/${isbn}-${size}.jpg`
  }
}

export const openLibraryService = new OpenLibraryService()
