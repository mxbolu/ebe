import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * POST /api/collections/[id]/books
 * Add a book to a collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: collectionId } = await params

  try {
    const body = await request.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Check ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (collection.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Add book to collection
    const collectionBook = await prisma.collectionBook.create({
      data: {
        collectionId,
        bookId,
      },
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
    })

    return NextResponse.json({ collectionBook }, { status: 201 })
  } catch (error: any) {
    // Handle unique constraint violation (book already in collection)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Book already in collection' },
        { status: 400 }
      )
    }

    console.error('Add book to collection error:', error)
    return NextResponse.json(
      { error: 'Failed to add book to collection' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/collections/[id]/books?bookId=...
 * Remove a book from a collection
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: collectionId } = await params
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  if (!bookId) {
    return NextResponse.json(
      { error: 'Book ID is required' },
      { status: 400 }
    )
  }

  try {
    // Check ownership
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      )
    }

    if (collection.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.collectionBook.deleteMany({
      where: {
        collectionId,
        bookId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove book from collection error:', error)
    return NextResponse.json(
      { error: 'Failed to remove book from collection' },
      { status: 500 }
    )
  }
}
