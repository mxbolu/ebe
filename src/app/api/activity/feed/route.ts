import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/activity/feed
 * Get activity feed from users you follow
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    // Get list of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.userId },
      select: { followingId: true },
    })

    const followingIds = following.map((f) => f.followingId)

    // If not following anyone, return empty feed
    if (followingIds.length === 0) {
      return NextResponse.json({
        activities: [],
        hasMore: false,
        page,
      })
    }

    // Fetch activities from followed users
    const activities = await prisma.activity.findMany({
      where: {
        userId: { in: followingIds },
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
      skip: offset,
      take: limit + 1,
    })

    const hasMore = activities.length > limit
    const paginatedActivities = activities.slice(0, limit)

    // Parse JSON data for each activity
    const formattedActivities = paginatedActivities.map((activity) => ({
      ...activity,
      data: JSON.parse(activity.data),
    }))

    return NextResponse.json({
      activities: formattedActivities,
      hasMore,
      page,
    })
  } catch (error) {
    console.error('Get activity feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    )
  }
}
