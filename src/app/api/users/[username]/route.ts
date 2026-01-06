import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const authResult = authenticateRequest(request)
    const currentUserId = authResult instanceof NextResponse ? null : authResult.user.userId

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        showContributions: true,
        _count: {
          select: {
            readingEntries: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get reading statistics
    const readingStats = await prisma.readingEntry.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        isPrivate: false,
      },
      _count: true,
    })

    const stats = {
      wantToRead: readingStats.find((s) => s.status === 'WANT_TO_READ')?._count || 0,
      currentlyReading: readingStats.find((s) => s.status === 'CURRENTLY_READING')?._count || 0,
      finished: readingStats.find((s) => s.status === 'FINISHED')?._count || 0,
      didNotFinish: readingStats.find((s) => s.status === 'DID_NOT_FINISH')?._count || 0,
    }

    // Get review count
    const reviewCount = await prisma.readingEntry.count({
      where: {
        userId: user.id,
        isPrivate: false,
        OR: [
          { review: { not: null } },
          { rating: { not: null } },
        ],
      },
    })

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId) {
      const followRecord = await prisma.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: user.id,
        },
      })
      isFollowing = !!followRecord
    }

    return NextResponse.json({
      user: {
        ...user,
        stats,
        reviewCount,
        isFollowing,
      },
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
