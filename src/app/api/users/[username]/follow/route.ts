import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * POST /api/users/[username]/follow
 * Follow a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { username } = await params

  try {
    // Find user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!userToFollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Can't follow yourself
    if (userToFollow.id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if already following
    const existing = await prisma.follow.findFirst({
      where: {
        followerId: user.userId,
        followingId: userToFollow.id,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      )
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: user.userId,
        followingId: userToFollow.id,
      },
    })

    console.log(`[Follow] User ${user.userId} followed ${userToFollow.id}`)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Follow user error:', error)
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[username]/follow
 * Unfollow a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { username } = await params

  try {
    // Find user to unfollow
    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!userToUnfollow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find and delete follow relationship
    const existing = await prisma.follow.findFirst({
      where: {
        followerId: user.userId,
        followingId: userToUnfollow.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 404 }
      )
    }

    await prisma.follow.delete({
      where: { id: existing.id },
    })

    console.log(`[Follow] User ${user.userId} unfollowed ${userToUnfollow.id}`)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
