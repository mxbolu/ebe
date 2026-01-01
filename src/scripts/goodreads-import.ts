#!/usr/bin/env tsx
/**
 * Goodreads Import Script
 *
 * Scrapes books from Goodreads lists and shelves
 *
 * Usage:
 *   npm run import:goodreads -- --genres="fiction,fantasy,mystery" --limit=50000
 *   npm run import:goodreads -- --lists="1.Best_Books_Ever" --limit=10000
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { goodreadsService, GoodreadsBook } from '../lib/services/goodreads'

// Create Prisma Client with adapter
const connectionString = process.env.DATABASE_URL || ''
let pgConnectionString = connectionString

if (connectionString.startsWith('prisma+postgres://')) {
  const url = new URL(connectionString)
  const apiKey = url.searchParams.get('api_key')
  if (apiKey) {
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
    pgConnectionString = decoded.databaseUrl
  }
}

const pool = new Pool({ connectionString: pgConnectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface ImportOptions {
  genres?: string[]
  lists?: string[]
  limit?: number
  detailedFetch?: boolean
}

class GoodreadsImporter {
  private options: ImportOptions
  private jobId?: string
  private processedCount = 0
  private successCount = 0
  private errorCount = 0
  private duplicateCount = 0

  // In-memory cache for duplicate detection
  private seenGoodreadsIds = new Set<string>()
  private seenISBNs = new Set<string>()

  constructor(options: ImportOptions) {
    this.options = {
      limit: 10000,
      detailedFetch: false,
      ...options,
    }
  }

  async start() {
    console.log('🚀 Starting Goodreads import...')
    console.log(`Limit: ${this.options.limit}`)
    console.log(`Detailed fetch: ${this.options.detailedFetch}\n`)

    await this.createJob()
    await this.loadExistingIdentifiers()

    if (this.options.genres && this.options.genres.length > 0) {
      await this.importFromGenres()
    } else if (this.options.lists && this.options.lists.length > 0) {
      await this.importFromLists()
    } else {
      // Default: scrape popular genres
      this.options.genres = ['fiction', 'fantasy', 'science-fiction', 'mystery', 'romance', 'thriller']
      await this.importFromGenres()
    }

    await this.completeJob()
    await prisma.$disconnect()
  }

  private async createJob() {
    const job = await prisma.importJob.create({
      data: {
        source: 'goodreads',
        status: 'running',
        totalRecords: this.options.limit || 0,
        startedAt: new Date(),
      },
    })

    this.jobId = job.id
    console.log(`📝 Created import job: ${this.jobId}\n`)
  }

  private async loadExistingIdentifiers() {
    console.log('📋 Loading existing book identifiers...')

    const batchSize = 10000
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const books = await prisma.book.findMany({
        select: {
          isbn: true,
          openLibraryId: true,
          googleBooksId: true,
        },
        take: batchSize,
        skip: offset,
      })

      if (books.length === 0) {
        hasMore = false
        break
      }

      books.forEach((book) => {
        if (book.isbn) this.seenISBNs.add(book.isbn)
      })

      offset += batchSize
    }

    console.log(`✅ Loaded ${this.seenISBNs.size} ISBNs from database\n`)
  }

  private async importFromGenres() {
    console.log('📚 Scraping books from Goodreads genres...\n')

    for (const genre of this.options.genres!) {
      if (this.options.limit && this.processedCount >= this.options.limit) {
        console.log(`\n🎯 Reached limit of ${this.options.limit} books`)
        break
      }

      console.log(`📖 Scraping genre: ${genre}`)

      const maxPages = Math.ceil((this.options.limit! - this.processedCount) / 30)

      for await (const batch of goodreadsService.scrapeGenre(genre, 1, Math.min(maxPages, 10))) {
        for (const book of batch) {
          this.processedCount++

          if (this.isDuplicate(book)) {
            this.duplicateCount++
            continue
          }

          // Optionally fetch detailed information
          let detailedBook = book
          if (this.options.detailedFetch && book.goodreadsId) {
            const details = await goodreadsService.getBookDetails(book.goodreadsId)
            if (details) {
              detailedBook = details
            }
            // Rate limit for detailed fetches
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }

          await this.importBook(detailedBook)
        }

        this.printProgress()

        if (this.options.limit && this.processedCount >= this.options.limit) {
          break
        }
      }
    }
  }

  private async importFromLists() {
    console.log('📚 Scraping books from Goodreads lists...\n')

    for (const listId of this.options.lists!) {
      if (this.options.limit && this.processedCount >= this.options.limit) {
        break
      }

      console.log(`📖 Scraping list: ${listId}`)

      const maxPages = Math.ceil((this.options.limit! - this.processedCount) / 100)

      for await (const batch of goodreadsService.scrapeList(listId, Math.min(maxPages, 10))) {
        for (const book of batch) {
          this.processedCount++

          if (this.isDuplicate(book)) {
            this.duplicateCount++
            continue
          }

          await this.importBook(book)
        }

        this.printProgress()

        if (this.options.limit && this.processedCount >= this.options.limit) {
          break
        }
      }
    }
  }

  private isDuplicate(book: GoodreadsBook): boolean {
    if (book.goodreadsId && this.seenGoodreadsIds.has(book.goodreadsId)) return true
    if (book.isbn && this.seenISBNs.has(book.isbn)) return true

    // Add to cache
    if (book.goodreadsId) this.seenGoodreadsIds.add(book.goodreadsId)
    if (book.isbn) this.seenISBNs.add(book.isbn)

    return false
  }

  private async importBook(book: GoodreadsBook) {
    try {
      // Check database for existing book by ISBN or title+author
      if (book.isbn) {
        const existing = await prisma.book.findUnique({
          where: { isbn: book.isbn },
        })
        if (existing) {
          this.duplicateCount++
          return
        }
      }

      await prisma.book.create({
        data: {
          title: book.title,
          authors: book.authors,
          isbn: book.isbn || null,
          coverImageUrl: book.coverUrl || null,
          description: book.description || null,
          publishedYear: book.publishedYear || null,
          genres: book.genres || [],
          pageCount: book.pageCount || null,
          publisher: book.publisher || null,
          language: book.language || 'en',
          source: 'API_IMPORT',
          averageRating: book.averageRating || null,
          totalRatings: book.ratingsCount || 0,
          lastSyncedAt: new Date(),
        },
      })

      this.successCount++
    } catch (error) {
      this.errorCount++
    }
  }

  private printProgress() {
    const successRate = this.processedCount > 0
      ? ((this.successCount / this.processedCount) * 100).toFixed(2)
      : '0.00'

    process.stdout.write(
      `\r📊 Processed: ${this.processedCount} | Success: ${this.successCount} | Duplicates: ${this.duplicateCount} | Errors: ${this.errorCount} | ${successRate}% success`
    )
  }

  private async completeJob() {
    if (!this.jobId) return

    await prisma.importJob.update({
      where: { id: this.jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        processedRecords: this.processedCount,
        successCount: this.successCount,
        errorCount: this.errorCount,
      },
    })

    console.log('\n\n✅ Import completed!')
    console.log(`📊 Total processed: ${this.processedCount}`)
    console.log(`✅ Successful imports: ${this.successCount}`)
    console.log(`🔄 Duplicates skipped: ${this.duplicateCount}`)
    console.log(`❌ Errors: ${this.errorCount}`)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: ImportOptions = {}

args.forEach((arg) => {
  const [key, value] = arg.split('=')
  if (key === '--genres') options.genres = value.split(',')
  if (key === '--lists') options.lists = value.split(',')
  if (key === '--limit') options.limit = parseInt(value)
  if (key === '--detailed') options.detailedFetch = value === 'true'
})

const importer = new GoodreadsImporter(options)
importer.start().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
