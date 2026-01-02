import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/activity
 * Get activity feed - either for the user or for users they follow
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'following' // 'following' or 'user'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let activities

    if (type === 'user') {
      // Get user's own activity
      activities = await prisma.activity.findMany({
        where: { userId: user.userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    } else {
      // Get activity from users I follow
      const following = await prisma.follow.findMany({
        where: { followerId: user.userId },
        select: { followingId: true },
      })

      const followingIds = following.map(f => f.followingId)

      activities = await prisma.activity.findMany({
        where: {
          userId: { in: [...followingIds, user.userId] }, // Include own activity
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    }

    // Parse JSON data for each activity
    const parsedActivities = activities.map(activity => ({
      ...activity,
      data: JSON.parse(activity.data),
    }))

    return NextResponse.json({
      activities: parsedActivities,
      count: activities.length,
      hasMore: activities.length === limit,
    })
  } catch (error) {
    console.error('Get activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
