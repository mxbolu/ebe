import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendMeetingReminderEmail } from '@/lib/email/service'

/**
 * GET /api/cron/meeting-reminders
 * Send email reminders for upcoming meetings
 * Should be called by a cron job every few minutes
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from a cron job (optional - add auth header check)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)
    const sixteenMinutesFromNow = new Date(now.getTime() + 16 * 60 * 1000)

    // Find meetings that start in approximately 15 minutes
    // We check a 1-minute window to avoid sending duplicate reminders
    const upcomingMeetings = await prisma.bookClubMeeting.findMany({
      where: {
        scheduledAt: {
          gte: fifteenMinutesFromNow,
          lte: sixteenMinutesFromNow,
        },
        status: 'scheduled',
      },
      include: {
        bookClub: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    console.log(`[CRON] Found ${upcomingMeetings.length} meetings starting in ~15 minutes`)

    let emailsSent = 0
    let emailsFailed = 0

    // Send reminder emails
    for (const meeting of upcomingMeetings) {
      console.log(`[CRON] Processing meeting: ${meeting.title}`)

      for (const member of meeting.bookClub.members) {
        try {
          await sendMeetingReminderEmail(
            member.user.email,
            member.user.name || member.user.username,
            meeting.title,
            meeting.bookClub.name,
            meeting.scheduledAt,
            meeting.duration,
            meeting.bookClubId,
            meeting.id,
            15 // minutes before
          )
          emailsSent++
          console.log(`[CRON] ✅ Sent reminder to ${member.user.email}`)
        } catch (error) {
          emailsFailed++
          console.error(`[CRON] ❌ Failed to send reminder to ${member.user.email}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      meetingsProcessed: upcomingMeetings.length,
      emailsSent,
      emailsFailed,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Meeting reminders error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send meeting reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
