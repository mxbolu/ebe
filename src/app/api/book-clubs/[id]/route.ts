import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

const updateBookClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  coverImage: z.string().url().optional().nullable(),
  maxMembers: z.number().int().positive().optional().nullable(),
})

// GET /api/book-clubs/[id] - Get a single book club
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Optionally get user for member-specific data
    let userId: string | undefined
    const authResult = authenticateRequest(request)
    if (!(authResult instanceof NextResponse)) {
      userId = authResult.user.userId
    }

    const bookClub = await prisma.bookClub.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                coverImageUrl: true,
                pageCount: true,
              },
            },
            addedBy: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        currentRead: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authors: true,
                coverImageUrl: true,
                pageCount: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            books: true,
            discussions: true,
          },
        },
      },
    })

    if (!bookClub) {
      return NextResponse.json(
        { error: 'Book club not found' },
        { status: 404 }
      )
    }

    // Check if private club and user is not a member
    if (!bookClub.isPublic && userId) {
      const isMember = bookClub.members.some(m => m.userId === userId)
      if (!isMember) {
        return NextResponse.json(
          { error: 'Access denied. This is a private book club.' },
          { status: 403 }
        )
      }
    } else if (!bookClub.isPublic && !userId) {
      return NextResponse.json(
        { error: 'Access denied. This is a private book club.' },
        { status: 403 }
      )
    }

    // Add user membership status
    const userMembership = userId
      ? bookClub.members.find(m => m.userId === userId)
      : null

    return NextResponse.json({
      bookClub,
      userMembership,
    })
  } catch (error) {
    console.error('Get book club error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book club' },
      { status: 500 }
    )
  }
}

// PATCH /api/book-clubs/[id] - Update a book club
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate the request
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const { id } = await params
    const body = await request.json()

    const validationResult = updateBookClubSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    // Check if user is admin of the club
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update book club settings' },
        { status: 403 }
      )
    }

    const data = validationResult.data
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers

    const bookClub = await prisma.bookClub.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            books: true,
            discussions: true,
          },
        },
      },
    })

    return NextResponse.json({ bookClub })
  } catch (error) {
    console.error('Update book club error:', error)
    return NextResponse.json(
      { error: 'Failed to update book club' },
      { status: 500 }
    )
  }
}

// DELETE /api/book-clubs/[id] - Delete a book club
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate the request
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const { id } = await params

    // Check if user is the creator
    const bookClub = await prisma.bookClub.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!bookClub) {
      return NextResponse.json(
        { error: 'Book club not found' },
        { status: 404 }
      )
    }

    if (bookClub.createdById !== user.userId) {
      return NextResponse.json(
        { error: 'Only the creator can delete the book club' },
        { status: 403 }
      )
    }

    // Delete the book club (members, books, discussions cascade automatically)
    await prisma.bookClub.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Book club deleted successfully' })
  } catch (error) {
    console.error('Delete book club error:', error)
    return NextResponse.json(
      { error: 'Failed to delete book club' },
      { status: 500 }
    )
  }
}
