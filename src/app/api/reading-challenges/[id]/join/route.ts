import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * POST /api/reading-challenges/[id]/join
 * Join a reading challenge
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: challengeId } = await params

  try {
    // Check if challenge exists and is active
    const challenge = await prisma.readingChallenge.findUnique({
      where: { id: challengeId },
    })

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      )
    }

    if (!challenge.isActive || challenge.endDate < new Date()) {
      return NextResponse.json(
        { error: 'Challenge is not active or has ended' },
        { status: 400 }
      )
    }

    // Check if already joined
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

    // Join challenge
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId: user.userId,
        challengeId,
        progress: 0,
      },
    })

    console.log(`[Challenge] User ${user.userId} joined challenge ${challengeId}`)
    return NextResponse.json({ userChallenge }, { status: 201 })
  } catch (error) {
    console.error('Join challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to join challenge' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reading-challenges/[id]/join
 * Leave a reading challenge
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: challengeId } = await params

  try {
    const existing = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId: {
          userId: user.userId,
          challengeId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not participating in this challenge' },
        { status: 404 }
      )
    }

    await prisma.userChallenge.delete({
      where: {
        userId_challengeId: {
          userId: user.userId,
          challengeId,
        },
      },
    })

    console.log(`[Challenge] User ${user.userId} left challenge ${challengeId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to leave challenge' },
      { status: 500 }
    )
  }
}
