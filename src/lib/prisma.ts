import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// For Prisma Postgres, we need to use the pg adapter
// The DATABASE_URL format is: prisma+postgres://localhost:51213/?api_key=...
const connectionString = process.env.DATABASE_URL || ''

// Prisma Postgres stores the actual PostgreSQL connection in the api_key parameter
let pgConnectionString = connectionString

if (connectionString.startsWith('prisma+postgres://')) {
  try {
    const url = new URL(connectionString)
    const apiKey = url.searchParams.get('api_key')

    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString())
      // Use the databaseUrl from the decoded API key
      pgConnectionString = decoded.databaseUrl
    }
  } catch (error) {
    console.error('Failed to parse Prisma Postgres URL:', error)
  }
}

// Create connection pool and adapter
const pool = new Pool({ connectionString: pgConnectionString })
const adapter = new PrismaPg(pool)

// Create Prisma Client with adapter
const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
