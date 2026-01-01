#!/usr/bin/env tsx
/**
 * Bulk Import Script for Books
 *
 * This script imports millions of books from Open Library and Google Books
 *
 * Usage:
 *   npm run import:books -- --source=openlibrary --limit=1000000
 *   npm run import:books -- --source=googlebooks --limit=100000
 *   npm run import:books -- --resume=<job-id>
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { openLibraryService } from '../lib/services/openLibrary'
import { googleBooksService, GoogleBooksService } from '../lib/services/googleBooks'
import pLimit from 'p-limit'

// Create Prisma Client with adapter for Prisma Postgres
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
  source: 'openlibrary' | 'googlebooks'
  limit?: number
  batchSize?: number
  concurrency?: number
  resumeJobId?: string
}

class BulkBookImporter {
  private options: ImportOptions
  private jobId?: string
  private processedCount = 0
  private successCount = 0
  private errorCount = 0
  private startOffset = 0

  constructor(options: ImportOptions) {
    this.options = {
      batchSize: 1000,
      concurrency: 5,
      ...options,
    }
  }

  async start() {
    console.log('🚀 Starting bulk book import...')
    console.log(`Source: ${this.options.source}`)
    console.log(`Limit: ${this.options.limit || 'unlimited'}`)
    console.log(`Batch size: ${this.options.batchSize}`)
    console.log(`Concurrency: ${this.options.concurrency}\n`)

    try {
      // Create or resume import job
      if (this.options.resumeJobId) {
        await this.resumeJob()
      } else {
        await this.createJob()
      }

      // Start importing based on source
      if (this.options.source === 'openlibrary') {
        await this.importFromOpenLibrary()
      } else if (this.options.source === 'googlebooks') {
        await this.importFromGoogleBooks()
      }

      await this.completeJob()
      console.log('\n✅ Import completed successfully!')
    } catch (error) {
      console.error('\n❌ Import failed:', error)
      await this.failJob(error)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }

  private async createJob() {
    const job = await prisma.importJob.create({
      data: {
        source: this.options.source,
        status: 'running',
        totalRecords: this.options.limit || 0,
        startedAt: new Date(),
      },
    })

    this.jobId = job.id
    console.log(`📝 Created import job: ${this.jobId}\n`)
  }

  private async resumeJob() {
    const job = await prisma.importJob.findUnique({
      where: { id: this.options.resumeJobId },
    })

    if (!job) {
      throw new Error(`Job ${this.options.resumeJobId} not found`)
    }

    this.jobId = job.id
    this.processedCount = job.processedRecords
    this.successCount = job.successCount
    this.errorCount = job.errorCount
    this.startOffset = parseInt(job.lastProcessedId || '0')

    await prisma.importJob.update({
      where: { id: this.jobId },
      data: { status: 'running' },
    })

    console.log(`📝 Resuming import job: ${this.jobId}`)
    console.log(`Processed: ${this.processedCount}, Success: ${this.successCount}, Errors: ${this.errorCount}\n`)
  }

  private async importFromOpenLibrary() {
    console.log('📚 Fetching books from Open Library...\n')

    const limit = pLimit(this.options.concurrency!)

    for await (const batch of openLibraryService.fetchBulkWorks(
      this.startOffset,
      this.options.batchSize!
    )) {
      if (this.options.limit && this.processedCount >= this.options.limit) {
        console.log(`\n🎯 Reached limit of ${this.options.limit} books`)
        break
      }

      // Process batch with concurrency limit
      const promises = batch.map((book) =>
        limit(async () => {
          try {
            await this.importBook(book, 'API_IMPORT')
            this.successCount++
          } catch (error) {
            this.errorCount++
            console.error(`Failed to import "${book.title}":`, error)
          } finally {
            this.processedCount++
          }
        })
      )

      await Promise.all(promises)

      // Update progress
      await this.updateProgress()
      this.printProgress()

      // Save checkpoint
      this.startOffset += batch.length
      await this.saveCheckpoint()
    }
  }

  private async importFromGoogleBooks() {
    console.log('📚 Fetching books from Google Books...\n')

    const limit = pLimit(this.options.concurrency!)
    const subjects = GoogleBooksService.POPULAR_SUBJECTS

    for (const subject of subjects) {
      console.log(`\nImporting subject: ${subject}`)

      for await (const batch of googleBooksService.fetchBulkBySubject(
        subject,
        Math.floor((this.options.limit || 100000) / subjects.length)
      )) {
        if (this.options.limit && this.processedCount >= this.options.limit) {
          break
        }

        const promises = batch.map((book) =>
          limit(async () => {
            try {
              await this.importBook(book, 'API_IMPORT')
              this.successCount++
            } catch (error) {
              this.errorCount++
            } finally {
              this.processedCount++
            }
          })
        )

        await Promise.all(promises)

        await this.updateProgress()
        this.printProgress()
        await this.saveCheckpoint()
      }

      if (this.options.limit && this.processedCount >= this.options.limit) {
        break
      }
    }
  }

  private async importBook(
    book: any,
    source: 'API_IMPORT' | 'ADMIN_ADDED'
  ) {
    // Check if book already exists (by ISBN or external ID)
    const existing = await prisma.book.findFirst({
      where: {
        OR: [
          book.isbn ? { isbn: book.isbn } : {},
          book.openLibraryId ? { openLibraryId: book.openLibraryId } : {},
          book.googleBooksId ? { googleBooksId: book.googleBooksId } : {},
        ],
      },
    })

    if (existing) {
      // Update if external IDs are missing
      if ((book.openLibraryId && !existing.openLibraryId) ||
          (book.googleBooksId && !existing.googleBooksId)) {
        await prisma.book.update({
          where: { id: existing.id },
          data: {
            openLibraryId: book.openLibraryId || existing.openLibraryId,
            googleBooksId: book.googleBooksId || existing.googleBooksId,
            lastSyncedAt: new Date(),
          },
        })
      }
      return
    }

    // Create new book
    await prisma.book.create({
      data: {
        title: book.title,
        authors: book.authors || [],
        isbn: book.isbn,
        coverImageUrl: book.coverUrl,
        description: book.description,
        publishedYear: book.publishedYear,
        genres: book.genres || [],
        pageCount: book.pageCount,
        publisher: book.publisher,
        language: book.language || 'en',
        source,
        openLibraryId: book.openLibraryId,
        googleBooksId: book.googleBooksId,
        lastSyncedAt: new Date(),
      },
    })
  }

  private async updateProgress() {
    if (!this.jobId) return

    await prisma.importJob.update({
      where: { id: this.jobId },
      data: {
        processedRecords: this.processedCount,
        successCount: this.successCount,
        errorCount: this.errorCount,
      },
    })
  }

  private async saveCheckpoint() {
    if (!this.jobId) return

    await prisma.importJob.update({
      where: { id: this.jobId },
      data: {
        lastProcessedId: this.startOffset.toString(),
      },
    })
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
  }

  private async failJob(error: any) {
    if (!this.jobId) return

    await prisma.importJob.update({
      where: { id: this.jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error.message,
      },
    })
  }

  private printProgress() {
    const successRate = this.processedCount > 0
      ? ((this.successCount / this.processedCount) * 100).toFixed(2)
      : '0.00'

    process.stdout.write(
      `\r📊 Progress: ${this.processedCount} processed | ` +
      `${this.successCount} success | ` +
      `${this.errorCount} errors | ` +
      `${successRate}% success rate`
    )
  }
}

// Parse command line arguments
function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const options: any = {}

  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=')

    if (key === 'source') {
      options.source = value
    } else if (key === 'limit') {
      options.limit = parseInt(value)
    } else if (key === 'batch-size') {
      options.batchSize = parseInt(value)
    } else if (key === 'concurrency') {
      options.concurrency = parseInt(value)
    } else if (key === 'resume') {
      options.resumeJobId = value
    }
  }

  if (!options.source && !options.resumeJobId) {
    console.error('Error: --source or --resume is required')
    console.log('\nUsage:')
    console.log('  npm run import:books -- --source=openlibrary --limit=1000000')
    console.log('  npm run import:books -- --source=googlebooks --limit=100000')
    console.log('  npm run import:books -- --resume=<job-id>')
    process.exit(1)
  }

  return options
}

// Run import
const options = parseArgs()
const importer = new BulkBookImporter(options)
importer.start()
