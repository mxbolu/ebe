import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = (page - 1) * limit

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      userId: user.id,
      isPrivate: false,
    }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Fetch reading entries
    const entries = await prisma.readingEntry.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverImageUrl: true,
            publishedYear: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.readingEntry.count({ where })
    const hasMore = total > offset + limit

    return NextResponse.json({
      entries,
      hasMore,
      page,
      total,
    })
  } catch (error) {
    console.error('Get user reading entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading entries' },
      { status: 500 }
    )
  }
}
