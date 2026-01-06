import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/reading-goals
 * Get user's reading goals
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const searchParams = request.nextUrl.searchParams
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  try {
    const goal = await prisma.readingGoal.findUnique({
      where: {
        userId_year: {
          userId: user.userId,
          year,
        },
      },
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Get reading goal error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading goal' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reading-goals
 * Create or update reading goal
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { year, targetBooks } = body

    if (!year || !targetBooks || targetBooks < 1) {
      return NextResponse.json(
        { error: 'Invalid year or target books' },
        { status: 400 }
      )
    }

    // Count current finished books for this year
    // Use finishDate when available, fall back to updatedAt for compatibility
    const currentBooks = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        status: 'FINISHED',
        finishDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    })

    // Upsert reading goal
    const goal = await prisma.readingGoal.upsert({
      where: {
        userId_year: {
          userId: user.userId,
          year,
        },
      },
      update: {
        targetBooks,
        currentBooks,
      },
      create: {
        userId: user.userId,
        year,
        targetBooks,
        currentBooks,
      },
    })

    console.log(`[Reading Goal] User ${user.userId} set goal of ${targetBooks} books for ${year}`)
    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Create reading goal error:', error)
    return NextResponse.json(
      { error: 'Failed to create reading goal' },
      { status: 500 }
    )
  }
}
