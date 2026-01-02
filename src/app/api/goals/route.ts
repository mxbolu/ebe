import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/goals
 * Get reading goals for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
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

    if (!goal) {
      return NextResponse.json({
        goal: null,
        message: 'No goal set for this year',
      })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Get goals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/goals
 * Create or update a reading goal
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { year, targetBooks } = body

    if (!year || !targetBooks) {
      return NextResponse.json(
        { error: 'Year and target books are required' },
        { status: 400 }
      )
    }

    if (targetBooks < 1) {
      return NextResponse.json(
        { error: 'Target must be at least 1 book' },
        { status: 400 }
      )
    }

    // Get current count of finished books for the year
    const currentBooks = await prisma.readingEntry.count({
      where: {
        userId: user.userId,
        status: 'FINISHED',
        finishDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    })

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

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Create goal error:', error)
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/goals
 * Delete a reading goal
 */
export async function DELETE(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  try {
    await prisma.readingGoal.delete({
      where: {
        userId_year: {
          userId: user.userId,
          year,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete goal error:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    )
  }
}
