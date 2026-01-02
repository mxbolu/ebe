import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/user/streak
 * Get user's reading streak
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const streak = await prisma.readingStreak.findUnique({
      where: {
        userId: user.userId,
      },
    })

    return NextResponse.json({ streak }, { status: 200 })
  } catch (error) {
    console.error('Get streak error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    )
  }
}
