import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/follows
 * Get list of users the authenticated user follows, or their followers
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'following' // 'following' or 'followers'

  try {
    if (type === 'following') {
      // Get users I'm following
      const follows = await prisma.follow.findMany({
        where: { followerId: user.userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        users: follows.map(f => f.following),
        count: follows.length,
      })
    } else {
      // Get my followers
      const follows = await prisma.follow.findMany({
        where: { followingId: user.userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({
        users: follows.map(f => f.follower),
        count: follows.length,
      })
    }
  } catch (error) {
    console.error('Get follows error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/follows
 * Follow a user
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Can't follow yourself
    if (userId === user.userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      )
    }

    // Create follow
    const follow = await prisma.follow.create({
      data: {
        followerId: user.userId,
        followingId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Create activity
    await prisma.activity.create({
      data: {
        userId: user.userId,
        type: 'followed_user',
        data: JSON.stringify({
          userId,
          username: follow.following.username,
        }),
      },
    })

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error) {
    console.error('Follow user error:', error)
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/follows
 * Unfollow a user
 */
export async function DELETE(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    await prisma.follow.deleteMany({
      where: {
        followerId: user.userId,
        followingId: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
