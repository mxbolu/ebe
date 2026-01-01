import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

console.log('Testing Prisma Client initialization...')

try {
  // Parse Prisma Postgres URL
  const connectionString = process.env.DATABASE_URL || ''
  console.log('Connection string format:', connectionString.split('?')[0])

  let pgConnectionString = connectionString

  if (connectionString.startsWith('prisma+postgres://')) {
    const url = new URL(connectionString)
    const apiKey = url.searchParams.get('api_key')

    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
      pgConnectionString = decoded.databaseUrl
      console.log('Extracted PostgreSQL URL from Prisma Postgres URL')
    }
  }

  console.log('Creating connection pool...')
  const pool = new Pool({ connectionString: pgConnectionString })

  console.log('Creating adapter...')
  const adapter = new PrismaPg(pool)

  console.log('Creating Prisma Client with adapter...')
  const prisma = new PrismaClient({ adapter })

  console.log('✅ Prisma Client created successfully')

  // Test query
  console.log('Testing database query...')
  const count = await prisma.book.count()
  console.log(`📚 Books in database: ${count}`)

  await prisma.$disconnect()
  console.log('✅ Test complete')
} catch (error) {
  console.error('❌ Error:', error)
  console.error('Stack:', error.stack)
  process.exit(1)
}
