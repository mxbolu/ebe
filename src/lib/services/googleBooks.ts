import axios from 'axios'
import { z } from 'zod'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1'

// Zod schemas
const VolumeInfoSchema = z.object({
  title: z.string(),
  authors: z.array(z.string()).optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(),
  description: z.string().optional(),
  industryIdentifiers: z.array(z.object({
    type: z.string(),
    identifier: z.string(),
  })).optional(),
  pageCount: z.number().optional(),
  categories: z.array(z.string()).optional(),
  imageLinks: z.object({
    thumbnail: z.string().optional(),
    smallThumbnail: z.string().optional(),
  }).optional(),
  language: z.string().optional(),
})

const GoogleBooksVolumeSchema = z.object({
  id: z.string(),
  volumeInfo: VolumeInfoSchema,
})

export interface GoogleBook {
  googleBooksId: string
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

export class GoogleBooksService {
  private axiosInstance = axios.create({
    baseURL: GOOGLE_BOOKS_API,
    timeout: 30000,
  })

  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_BOOKS_API_KEY
  }

  /**
   * Search for books
   */
  async searchBooks(query: string, maxResults = 20): Promise<GoogleBook[]> {
    try {
      const params: any = {
        q: query,
        maxResults: Math.min(maxResults, 40), // Google Books max is 40
        printType: 'books',
      }

      if (this.apiKey) {
        params.key = this.apiKey
      }

      const response = await this.axiosInstance.get('/volumes', { params })

      const items = response.data.items || []
      return items.map((item: any) => this.transformVolume(item))
    } catch (error) {
      console.error('Google Books search error:', error)
      return []
    }
  }

  /**
   * Get book by volume ID
   */
  async getBookById(volumeId: string): Promise<GoogleBook | null> {
    try {
      const params: any = {}
      if (this.apiKey) {
        params.key = this.apiKey
      }

      const response = await this.axiosInstance.get(`/volumes/${volumeId}`, { params })
      const volume = GoogleBooksVolumeSchema.parse(response.data)
      return this.transformVolume(volume)
    } catch (error) {
      console.error(`Failed to fetch volume ${volumeId}:`, error)
      return null
    }
  }

  /**
   * Search by ISBN
   */
  async searchByISBN(isbn: string): Promise<GoogleBook | null> {
    const results = await this.searchBooks(`isbn:${isbn}`, 1)
    return results[0] || null
  }

  /**
   * Transform Google Books volume to our format
   */
  private transformVolume(volume: z.infer<typeof GoogleBooksVolumeSchema>): GoogleBook {
    const info = volume.volumeInfo

    // Extract ISBN (prefer ISBN-13 over ISBN-10)
    let isbn: string | undefined
    if (info.industryIdentifiers) {
      const isbn13 = info.industryIdentifiers.find(id => id.type === 'ISBN_13')
      const isbn10 = info.industryIdentifiers.find(id => id.type === 'ISBN_10')
      isbn = isbn13?.identifier || isbn10?.identifier
    }

    // Extract year from published date
    let publishedYear: number | undefined
    if (info.publishedDate) {
      const match = info.publishedDate.match(/^\d{4}/)
      if (match) {
        publishedYear = parseInt(match[0])
      }
    }

    // Get best quality cover image
    let coverUrl: string | undefined
    if (info.imageLinks) {
      coverUrl = info.imageLinks.thumbnail || info.imageLinks.smallThumbnail
      // Upgrade to higher quality
      if (coverUrl) {
        coverUrl = coverUrl.replace('&zoom=1', '&zoom=2')
        coverUrl = coverUrl.replace('http://', 'https://')
      }
    }

    return {
      googleBooksId: volume.id,
      title: info.title,
      authors: info.authors || ['Unknown Author'],
      isbn,
      description: info.description,
      publishedYear,
      genres: info.categories || [],
      pageCount: info.pageCount,
      publisher: info.publisher,
      language: info.language || 'en',
      coverUrl,
    }
  }

  /**
   * Fetch books in bulk (subject-based for better coverage)
   */
  async *fetchBulkBySubject(
    subject: string,
    maxResults = 1000
  ): AsyncGenerator<GoogleBook[]> {
    const batchSize = 40 // Google Books max per request
    let startIndex = 0

    while (startIndex < maxResults) {
      try {
        const params: any = {
          q: `subject:${subject}`,
          maxResults: batchSize,
          startIndex,
          printType: 'books',
          orderBy: 'relevance',
        }

        if (this.apiKey) {
          params.key = this.apiKey
        }

        const response = await this.axiosInstance.get('/volumes', { params })
        const items = response.data.items || []

        if (items.length === 0) break

        const books = items.map((item: any) => this.transformVolume(item))
        yield books

        startIndex += batchSize

        // Rate limiting: 1 request per second (free tier limit)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Bulk fetch error:', error)
        break
      }
    }
  }

  /**
   * Popular subjects for bulk import
   */
  static readonly POPULAR_SUBJECTS = [
    'fiction',
    'non-fiction',
    'science',
    'history',
    'biography',
    'fantasy',
    'mystery',
    'romance',
    'thriller',
    'science fiction',
    'horror',
    'self-help',
    'business',
    'philosophy',
    'poetry',
    'drama',
    'classics',
    'young adult',
    'children',
    'cooking',
  ]
}

export const googleBooksService = new GoogleBooksService()
