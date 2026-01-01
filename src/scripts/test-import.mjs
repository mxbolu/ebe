#!/usr/bin/env node
/**
 * Simple test import script
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import axios from 'axios'

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

console.log('🚀 Starting test import of 100 books from Open Library...\n')

async function fetchBooks() {
  try {
    const response = await axios.get('https://openlibrary.org/search.json', {
      params: {
        q: 'fiction',
        limit: 100,
        fields: 'key,title,author_name,first_publish_year,isbn,publisher,subject,cover_i,number_of_pages_median',
      },
      headers: {
        'User-Agent': 'ebe-reading-journal/1.0',
      },
    })

    return response.data.docs || []
  } catch (error) {
    console.error('Failed to fetch books:', error.message)
    return []
  }
}

async function importBooks() {
  const books = await fetchBooks()
  console.log(`📚 Fetched ${books.length} books from Open Library\n`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const doc of books) {
    try {
      // Check if book already exists by ISBN
      const isbn = doc.isbn?.[0]
      if (isbn) {
        const existing = await prisma.book.findUnique({
          where: { isbn },
        })

        if (existing) {
          skipped++
          continue
        }
      }

      // Import book
      await prisma.book.create({
        data: {
          title: doc.title || 'Unknown Title',
          authors: doc.author_name || ['Unknown Author'],
          isbn: doc.isbn?.[0],
          publishedYear: doc.first_publish_year,
          genres: (doc.subject || []).slice(0, 5),
          pageCount: doc.number_of_pages_median,
          publisher: doc.publisher?.[0],
          language: 'en',
          source: 'API_IMPORT',
          openLibraryId: doc.key,
          coverImageUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null,
          lastSyncedAt: new Date(),
        },
      })

      imported++
      process.stdout.write(`\r✅ Imported: ${imported} | ⏭️  Skipped: ${skipped} | ❌ Errors: ${errors}`)
    } catch (error) {
      errors++
      if (error.code !== 'P2002') { // Not a unique constraint error
        console.error(`\nError importing "${doc.title}":`, error.message)
      }
    }
  }

  console.log(`\n\n🎉 Import complete!`)
  console.log(`✅ Successfully imported: ${imported} books`)
  console.log(`⏭️  Skipped (duplicates): ${skipped} books`)
  console.log(`❌ Errors: ${errors} books\n`)
}

importBooks()
  .catch((error) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
