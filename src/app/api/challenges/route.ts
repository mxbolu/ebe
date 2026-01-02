import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/challenges
 * Get all active challenges
 */
export async function GET(request: NextRequest) {
  try {
    const challenges = await prisma.readingChallenge.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    return NextResponse.json({ challenges }, { status: 200 })
  } catch (error) {
    console.error('Get challenges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    )
  }
}
