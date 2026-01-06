/**
 * Script to check production database migration status
 * Run with: node check-production-migration.mjs
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// PrismaClient uses DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL

if (!DATABASE_URL) {
  console.error('❌ No DATABASE_URL found in environment variables')
  console.error('Please set DATABASE_URL to your production database connection string')
  process.exit(1)
}

console.log(`🔗 Using database: ${DATABASE_URL.split('@')[1]?.split('?')[0] || 'unknown'}\n`)

// Create PostgreSQL pool and adapter (required for edge-compatible Prisma Client)
const pool = new pg.Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)

// Initialize Prisma Client with PG adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
  errorFormat: 'minimal',
})

async function checkMigration() {
  console.log('🔍 Checking production database migration status...\n')

  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Connected to production database\n')

    // Check if waitingRoomEnabled column exists
    console.log('📋 Checking BookClubMeeting table...')
    const meetings = await prisma.bookClubMeeting.findMany({
      take: 1,
      select: {
        id: true,
        waitingRoomEnabled: true,
      },
    })
    console.log(`✅ waitingRoomEnabled column exists (found ${meetings.length} meetings)`)
    if (meetings.length > 0) {
      console.log(`   Sample: waitingRoomEnabled = ${meetings[0].waitingRoomEnabled}`)
    }

    // Check if MeetingWaitingParticipant table exists
    console.log('\n📋 Checking MeetingWaitingParticipant table...')
    const participants = await prisma.meetingWaitingParticipant.findMany({
      take: 1,
    })
    console.log(`✅ MeetingWaitingParticipant table exists (found ${participants.length} participants)`)

    // Get table counts
    console.log('\n📊 Database Statistics:')
    const meetingCount = await prisma.bookClubMeeting.count()
    const participantCount = await prisma.meetingWaitingParticipant.count()
    const userCount = await prisma.user.count()
    const clubCount = await prisma.bookClub.count()

    console.log(`   • Total Users: ${userCount}`)
    console.log(`   • Total Book Clubs: ${clubCount}`)
    console.log(`   • Total Meetings: ${meetingCount}`)
    console.log(`   • Total Waiting Participants: ${participantCount}`)

    // Check recent meetings
    console.log('\n📅 Recent Meetings:')
    const recentMeetings = await prisma.bookClubMeeting.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        title: true,
        scheduledAt: true,
        waitingRoomEnabled: true,
        status: true,
        createdAt: true,
      },
    })

    if (recentMeetings.length === 0) {
      console.log('   No meetings found')
    } else {
      recentMeetings.forEach((meeting, index) => {
        console.log(`   ${index + 1}. ${meeting.title}`)
        console.log(`      • Status: ${meeting.status}`)
        console.log(`      • Scheduled: ${meeting.scheduledAt.toLocaleString()}`)
        console.log(`      • Waiting Room: ${meeting.waitingRoomEnabled ? 'Enabled' : 'Disabled'}`)
        console.log(`      • Created: ${meeting.createdAt.toLocaleString()}`)
      })
    }

    console.log('\n✅ Migration verified successfully!')
    console.log('\n🎉 All waiting room features are ready to use!')

  } catch (error) {
    console.error('\n❌ Error checking migration:')
    console.error(error.message)

    if (error.code === 'P2021') {
      console.error('\n⚠️  The table does not exist. Migration may not have run yet.')
      console.error('    Wait for Vercel deployment to complete, then try again.')
    } else if (error.code === 'P2010') {
      console.error('\n⚠️  Column does not exist. Migration may not have run yet.')
      console.error('    Wait for Vercel deployment to complete, then try again.')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigration()
