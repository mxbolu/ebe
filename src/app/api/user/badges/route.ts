import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/user/badges
 * Get user's earned badges
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const userBadges = await prisma.userBadge.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    })

    return NextResponse.json({ badges: userBadges }, { status: 200 })
  } catch (error) {
    console.error('Get user badges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}
