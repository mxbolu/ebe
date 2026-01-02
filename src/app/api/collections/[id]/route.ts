import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/collections/[id]
 * Get a specific collection with all its books
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                coverImageUrl: true,
                publishedYear: true,
                averageRating: true,
                pageCount: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    if (collection.userId !== user.userId && !collection.isPublic) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Get collection error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/collections/[id]
 * Update a collection
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    const body = await request.json()
    const { name, description, isPublic } = body

    // Check ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (existing.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })

    return NextResponse.json({ collection })
  } catch (error) {
    console.error('Update collection error:', error)
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/collections/[id]
 * Delete a collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await params

  try {
    // Check ownership
    const existing = await prisma.collection.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (existing.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.collection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete collection error:', error)
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    )
  }
}
