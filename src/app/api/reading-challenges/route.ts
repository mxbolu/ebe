import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/reading-challenges
 * Get available reading challenges
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request)
    const currentUserId = authResult instanceof NextResponse ? null : authResult.user.userId

    const challenges = await prisma.readingChallenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        userChallenges: currentUserId
          ? {
              where: { userId: currentUserId },
              select: {
                id: true,
                progress: true,
                completed: true,
                completedAt: true,
              },
            }
          : false,
        _count: {
          select: {
            userChallenges: {
              where: { completed: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ challenges })
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reading-challenges
 * Create a new reading challenge (admin only)
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  // Check if user is admin
  const userRecord = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { role: true },
  })

  if (!userRecord || (userRecord.role !== 'ADMIN' && userRecord.role !== 'SUPER_ADMIN')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name, description, type, targetValue, startDate, endDate, iconUrl } = body

    if (!name || !description || !type || !targetValue || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const challenge = await prisma.readingChallenge.create({
      data: {
        name,
        description,
        type,
        targetValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        iconUrl,
      },
    })

    console.log(`[Challenge] Admin ${user.userId} created challenge: ${name}`)
    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error('Create challenge error:', error)
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    )
  }
}
