import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        addedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json({ book }, { status: 200 })
  } catch (error) {
    console.error('Get book error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}
