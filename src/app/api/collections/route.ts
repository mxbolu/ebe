import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/collections
 * Get all collections for the authenticated user
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const collections = await prisma.collection.findMany({
      where: { userId: user.userId },
      include: {
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                coverImageUrl: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
          take: 5, // Preview only
        },
        _count: {
          select: { books: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ collections })
  } catch (error) {
    console.error('Get collections error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { name, description, isPublic } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    const collection = await prisma.collection.create({
      data: {
        userId: user.userId,
        name,
        description: description || null,
        isPublic: isPublic || false,
      },
    })

    return NextResponse.json({ collection }, { status: 201 })
  } catch (error) {
    console.error('Create collection error:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}
