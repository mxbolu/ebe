import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/challenges/user
 * Get user's active challenges with progress
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        challenge: true,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return NextResponse.json({ userChallenges }, { status: 200 })
  } catch (error) {
    console.error('Get user challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user challenges' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/challenges/user
 * Join a challenge
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { challengeId } = body

    if (!challengeId) {
      return NextResponse.json(
        { error: 'Challenge ID is required' },
        { status: 400 }
      )
    }

    // Check if challenge exists and is active
    const challenge = await prisma.readingChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge || !challenge.isActive) {
      return NextResponse.json(
        { error: 'Challenge not found or inactive' },
        { status: 404 }
      )
    }

    // Check if user already joined
    const existing = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: user.userId,
          challengeId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already joined this challenge' },
        { status: 409 }
      )
    }

    // Join the challenge
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId: user.userId,
        challengeId,
      },
      include: {
        challenge: true,
      },
    })

    console.log(`[Challenge] User ${user.userId} joined challenge "${challenge.name}" (${challengeId})`)
    return NextResponse.json({ userChallenge }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}
