import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

// POST /api/book-clubs/[id]/members - Join a book club
export async function POST(
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

    // Check if book club exists
    const bookClub = await prisma.bookClub.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    })

    if (!bookClub) {
      return NextResponse.json(
        { error: 'Book club not found' },
        { status: 404 }
      )
    }

    // Check if club is full
    if (bookClub.maxMembers && bookClub._count.members >= bookClub.maxMembers) {
      return NextResponse.json(
        { error: 'Book club is full' },
        { status: 400 }
      )
    }

    // Check if already a member
    const existingMembership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this book club' },
        { status: 400 }
      )
    }

    // Create membership
    const membership = await prisma.bookClubMember.create({
      data: {
        bookClubId: id,
        userId: user.userId,
        role: 'member',
      },
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
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.userId,
        type: 'joined_book_club',
        data: JSON.stringify({
          bookClubId: id,
          bookClubName: bookClub.name,
        }),
      },
    })

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error) {
    console.error('Join book club error:', error)
    return NextResponse.json(
      { error: 'Failed to join book club' },
      { status: 500 }
    )
  }
}

// DELETE /api/book-clubs/[id]/members - Leave a book club
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

    // Check if member exists
    const membership = await prisma.bookClubMember.findUnique({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
      include: {
        bookClub: {
          select: {
            createdById: true,
            name: true,
          },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this book club' },
        { status: 400 }
      )
    }

    // Prevent creator from leaving their own club
    if (membership.bookClub.createdById === user.userId) {
      return NextResponse.json(
        { error: 'Club creator cannot leave. Delete the club instead.' },
        { status: 400 }
      )
    }

    // Delete membership
    await prisma.bookClubMember.delete({
      where: {
        bookClubId_userId: {
          bookClubId: id,
          userId: user.userId,
        },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.userId,
        type: 'left_book_club',
        data: JSON.stringify({
          bookClubId: id,
          bookClubName: membership.bookClub.name,
        }),
      },
    })

    return NextResponse.json({ message: 'Left book club successfully' })
  } catch (error) {
    console.error('Leave book club error:', error)
    return NextResponse.json(
      { error: 'Failed to leave book club' },
      { status: 500 }
    )
  }
}
