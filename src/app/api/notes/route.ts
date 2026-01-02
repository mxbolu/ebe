import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

/**
 * GET /api/notes?bookId=...
 * Get notes for a specific book or all notes for the user
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  try {
    const where: any = { userId: user.userId }
    if (bookId) {
      where.bookId = bookId
    }

    const notes = await prisma.note.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const { bookId, content, page, chapter } = body

    if (!bookId || !content) {
      return NextResponse.json(
        { error: 'Book ID and content are required' },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        userId: user.userId,
        bookId,
        content,
        page: page || null,
        chapter: chapter || null,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
          },
        },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
