import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/admin/import-jobs
 * Get import job status and history (admin only)
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'running', 'completed', 'failed', 'paused'

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    const jobs = await prisma.importJob.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    // Get summary stats
    const stats = await prisma.importJob.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    const totalBooks = await prisma.book.count()

    return NextResponse.json({
      jobs,
      stats: {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status
          return acc
        }, {} as Record<string, number>),
        totalBooks,
      },
    })
  } catch (error) {
    console.error('Get import jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import jobs' },
      { status: 500 }
    )
  }
}
