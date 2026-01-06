import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'
import { z } from 'zod'

// Validation schemas
const createBookClubSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  coverImage: z.string().url().optional().nullable(),
  maxMembers: z.number().int().positive().optional().nullable(),
})

// GET /api/book-clubs - Get all book clubs or filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'public', 'my-clubs', 'joined'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Optionally require authentication for certain filters
    let userId: string | undefined
    const authResult = authenticateRequest(request)
    if (!(authResult instanceof NextResponse)) {
      userId = authResult.user.userId
    }

    let whereClause: any = {}

    if (filter === 'public') {
      whereClause.isPublic = true
    } else if (filter === 'my-clubs' && userId) {
      whereClause.createdById = userId
    } else if (filter === 'joined' && userId) {
      whereClause.members = {
        some: {
          userId: userId,
        },
      }
    } else if (!filter) {
      // Default: show all public clubs
      whereClause.isPublic = true
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [clubs, total] = await Promise.all([
      prisma.bookClub.findMany({
        where: whereClause,
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
          currentRead: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.bookClub.count({ where: whereClause }),
    ])

    return NextResponse.json({
      clubs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + clubs.length < total,
      },
    })
  } catch (error) {
    console.error('Get book clubs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book clubs' },
      { status: 500 }
    )
  }
}

// POST /api/book-clubs - Create a new book club
export async function POST(request: NextRequest) {
  // Authenticate the request
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  const { user } = authResult

  try {
    const body = await request.json()
    const validationResult = createBookClubSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Create the book club
    const bookClub = await prisma.bookClub.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic,
        coverImage: data.coverImage,
        maxMembers: data.maxMembers,
        createdById: user.userId,
        // Automatically add creator as admin member
        members: {
          create: {
            userId: user.userId,
            role: 'admin',
          },
        },
      },
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

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.userId,
        type: 'created_book_club',
        data: JSON.stringify({
          bookClubId: bookClub.id,
          bookClubName: bookClub.name,
        }),
      },
    })

    return NextResponse.json({ bookClub }, { status: 201 })
  } catch (error) {
    console.error('Create book club error:', error)
    return NextResponse.json(
      { error: 'Failed to create book club' },
      { status: 500 }
    )
  }
}
