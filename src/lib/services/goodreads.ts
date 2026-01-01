import axios from 'axios'
import * as cheerio from 'cheerio'
import { z } from 'zod'

const GOODREADS_BASE_URL = 'https://www.goodreads.com'

// Zod schemas for validation
export interface GoodreadsBook {
  goodreadsId: string
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
  averageRating?: number
  ratingsCount?: number
}

export class GoodreadsService {
  // Popular lists for scraping
  static readonly POPULAR_LISTS = [
    'best_books',
    'popular_books',
    'award_winners',
    'best_fiction',
    'best_nonfiction',
    'best_mystery',
    'best_romance',
    'best_science_fiction',
    'best_fantasy',
    'best_historical_fiction',
    'best_thriller',
    'best_horror',
    'best_young_adult',
    'best_childrens_books',
    'best_biography',
    'best_history',
    'best_science',
    'best_business',
    'best_self_help',
    'best_poetry',
  ]

  private axiosInstance = axios.create({
    baseURL: GOODREADS_BASE_URL,
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  })

  /**
   * Search for books on Goodreads
   */
  async searchBooks(query: string, page = 1): Promise<GoodreadsBook[]> {
    try {
      const response = await this.axiosInstance.get('/search', {
        params: {
          q: query,
          page,
        },
      })

      const $ = cheerio.load(response.data)
      const books: GoodreadsBook[] = []

      $('.tableList tr').each((_, element) => {
        try {
          const $el = $(element)
          const $bookTitle = $el.find('.bookTitle')
          const $authorName = $el.find('.authorName')
          const $cover = $el.find('img.bookCover')
          const $rating = $el.find('.minirating')

          const bookUrl = $bookTitle.attr('href')
          if (!bookUrl) return

          const goodreadsId = this.extractBookId(bookUrl)
          if (!goodreadsId) return

          const title = $bookTitle.text().trim()
          const author = $authorName.text().trim()
          const coverUrl = $cover.attr('src')

          // Parse rating info (e.g., "4.24 avg rating — 1,234,567 ratings")
          const ratingText = $rating.text().trim()
          const ratingMatch = ratingText.match(/([\d.]+)\s+avg rating.*?([\d,]+)\s+rating/)

          books.push({
            goodreadsId,
            title,
            authors: author ? [author] : ['Unknown Author'],
            coverUrl: coverUrl?.replace(/_[SML]X\d+_/, '_') || undefined,
            genres: [],
            averageRating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
            ratingsCount: ratingMatch ? parseInt(ratingMatch[2].replace(/,/g, '')) : undefined,
          })
        } catch (error) {
          // Skip malformed entries
        }
      })

      return books
    } catch (error) {
      console.error('Goodreads search error:', error)
      return []
    }
  }

  /**
   * Get detailed information about a specific book
   */
  async getBookDetails(goodreadsId: string): Promise<GoodreadsBook | null> {
    try {
      const response = await this.axiosInstance.get(`/book/show/${goodreadsId}`)
      const $ = cheerio.load(response.data)

      // Extract title
      const title = $('h1[data-testid="bookTitle"]').text().trim() ||
                    $('.BookPageTitleSection__title h1').text().trim()

      // Extract authors
      const authors: string[] = []
      $('span[data-testid="name"]').each((_, el) => {
        const author = $(el).text().trim()
        if (author) authors.push(author)
      })

      // Extract cover image
      const coverUrl = $('img.ResponsiveImage').first().attr('src') ||
                      $('.BookCover__image img').attr('src')

      // Extract description
      const description = $('div[data-testid="description"]').text().trim() ||
                         $('.DetailsLayoutRightParagraph__widthConstrained').text().trim()

      // Extract rating
      const ratingText = $('div.RatingStatistics__rating').first().text().trim()
      const averageRating = parseFloat(ratingText) || undefined

      // Extract ratings count
      const ratingsText = $('span[data-testid="ratingsCount"]').text().trim()
      const ratingsMatch = ratingsText.match(/([\d,]+)/)
      const ratingsCount = ratingsMatch ? parseInt(ratingsMatch[1].replace(/,/g, '')) : undefined

      // Extract genres/shelves
      const genres: string[] = []
      $('span[data-testid="genresList"] a, .BookPageMetadataSection__genres a').each((_, el) => {
        const genre = $(el).text().trim()
        if (genre && !genre.includes('...more')) {
          genres.push(genre)
        }
      })

      // Extract publication info
      const detailsText = $('p[data-testid="publicationInfo"]').text() ||
                         $('.FeaturedDetails').text()

      const yearMatch = detailsText.match(/\b(19|20)\d{2}\b/)
      const publishedYear = yearMatch ? parseInt(yearMatch[0]) : undefined

      const pageMatch = detailsText.match(/(\d+)\s+pages/)
      const pageCount = pageMatch ? parseInt(pageMatch[1]) : undefined

      const publisherMatch = detailsText.match(/(?:Published|by)\s+([^,\n]+?)(?:\s+\(|,|\n|$)/)
      const publisher = publisherMatch ? publisherMatch[1].trim() : undefined

      // Extract ISBN
      const isbnMatch = detailsText.match(/ISBN[:\s]*([\d-]+)/)
      const isbn = isbnMatch ? isbnMatch[1].replace(/-/g, '') : undefined

      return {
        goodreadsId,
        title,
        authors: authors.length > 0 ? authors : ['Unknown Author'],
        isbn,
        description,
        publishedYear,
        genres: genres.slice(0, 10),
        pageCount,
        publisher,
        coverUrl,
        averageRating,
        ratingsCount,
      }
    } catch (error) {
      console.error(`Failed to fetch Goodreads book ${goodreadsId}:`, error)
      return null
    }
  }

  /**
   * Scrape books from a Goodreads list
   */
  async *scrapeList(listId: string, maxPages = 10): AsyncGenerator<GoodreadsBook[]> {
    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await this.axiosInstance.get(`/list/show/${listId}`, {
          params: { page },
        })

        const $ = cheerio.load(response.data)
        const books: GoodreadsBook[] = []

        $('.bookBox').each((_, element) => {
          try {
            const $el = $(element)
            const $title = $el.find('.bookTitle')
            const $author = $el.find('.authorName')
            const $cover = $el.find('img')
            const $rating = $el.find('.minirating')

            const bookUrl = $title.attr('href')
            if (!bookUrl) return

            const goodreadsId = this.extractBookId(bookUrl)
            if (!goodreadsId) return

            const title = $title.text().trim()
            const author = $author.text().trim()
            const coverUrl = $cover.attr('src')

            const ratingText = $rating.text().trim()
            const ratingMatch = ratingText.match(/([\d.]+)\s+avg rating.*?([\d,]+)\s+rating/)

            books.push({
              goodreadsId,
              title,
              authors: author ? [author] : ['Unknown Author'],
              coverUrl: coverUrl?.replace(/_[SML]X\d+_/, '_') || undefined,
              genres: [],
              averageRating: ratingMatch ? parseFloat(ratingMatch[1]) : undefined,
              ratingsCount: ratingMatch ? parseInt(ratingMatch[2].replace(/,/g, '')) : undefined,
            })
          } catch (error) {
            // Skip malformed entries
          }
        })

        if (books.length === 0) break

        yield books

        // Rate limiting - be respectful to Goodreads
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error scraping list ${listId} page ${page}:`, error)
        break
      }
    }
  }

  /**
   * Scrape popular books by genre
   */
  async *scrapeGenre(genre: string, page = 1, maxPages = 10): AsyncGenerator<GoodreadsBook[]> {
    for (let currentPage = page; currentPage <= maxPages; currentPage++) {
      try {
        const response = await this.axiosInstance.get('/shelf/show/' + genre, {
          params: { page: currentPage },
        })

        const $ = cheerio.load(response.data)
        const books: GoodreadsBook[] = []

        $('.leftContainer .elementList .left').each((_, element) => {
          try {
            const $el = $(element)
            const $bookLink = $el.find('a.bookTitle')
            const $authorLink = $el.find('a.authorName')
            const $img = $el.find('img')

            const bookUrl = $bookLink.attr('href')
            if (!bookUrl) return

            const goodreadsId = this.extractBookId(bookUrl)
            if (!goodreadsId) return

            const title = $bookLink.text().trim()
            const author = $authorLink.text().trim()
            const coverUrl = $img.attr('src')

            books.push({
              goodreadsId,
              title,
              authors: author ? [author] : ['Unknown Author'],
              coverUrl: coverUrl?.replace(/_[SML]X\d+_/, '_') || undefined,
              genres: [genre],
            })
          } catch (error) {
            // Skip malformed entries
          }
        })

        if (books.length === 0) break

        yield books

        // Rate limiting - 2 seconds between requests
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error scraping genre ${genre} page ${currentPage}:`, error)
        break
      }
    }
  }

  /**
   * Extract book ID from Goodreads URL
   */
  private extractBookId(url: string): string | null {
    const match = url.match(/\/book\/show\/(\d+)/)
    return match ? match[1] : null
  }

  /**
   * Get books from Goodreads Choice Awards
   */
  async *scrapeChoiceAwards(year: number): AsyncGenerator<GoodreadsBook[]> {
    try {
      const response = await this.axiosInstance.get(`/choiceawards/best-books-${year}`)
      const $ = cheerio.load(response.data)
      const books: GoodreadsBook[] = []

      $('.category .winningBook, .category .pollAnswer__book').each((_, element) => {
        try {
          const $el = $(element)
          const $link = $el.find('a')
          const $img = $el.find('img')
          const $title = $el.find('.pollAnswer__bookTitle, .winningBook__title')
          const $author = $el.find('.pollAnswer__authorName, .winningBook__author')

          const bookUrl = $link.attr('href')
          if (!bookUrl) return

          const goodreadsId = this.extractBookId(bookUrl)
          if (!goodreadsId) return

          const title = $title.text().trim()
          const author = $author.text().trim()
          const coverUrl = $img.attr('src')

          books.push({
            goodreadsId,
            title,
            authors: author ? [author] : ['Unknown Author'],
            coverUrl,
            genres: [],
          })
        } catch (error) {
          // Skip malformed entries
        }
      })

      yield books
    } catch (error) {
      console.error(`Error scraping Choice Awards ${year}:`, error)
    }
  }
}

// Export singleton instance
export const goodreadsService = new GoodreadsService()
