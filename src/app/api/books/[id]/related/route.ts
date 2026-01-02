import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '6')
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
    const authors = searchParams.get('authors')?.split(',').filter(Boolean) || []

    // Build where conditions for related books
    const whereConditions: any = {
      NOT: { id }, // Exclude the current book
      AND: [],
    }

    // Prioritize books with same genre or author
    if (genres.length > 0 || authors.length > 0) {
      whereConditions.AND.push({
        OR: [
          ...(genres.length > 0
            ? [{ genres: { hasSome: genres } }]
            : []),
          ...(authors.length > 0
            ? [{ authors: { hasSome: authors } }]
            : []),
        ],
      })
    }

    const relatedBooks = await prisma.book.findMany({
      where: whereConditions.AND.length > 0 ? whereConditions : { NOT: { id } },
      select: {
        id: true,
        title: true,
        authors: true,
        coverImageUrl: true,
        averageRating: true,
        publishedYear: true,
      },
      orderBy: [
        { averageRating: 'desc' },
        { totalRatings: 'desc' },
      ],
      take: limit,
    })

    // If we don't have enough related books, fetch some random popular books
    if (relatedBooks.length < limit) {
      const additionalBooks = await prisma.book.findMany({
        where: {
          NOT: {
            id: {
              in: [id, ...relatedBooks.map((b) => b.id)],
            },
          },
        },
        select: {
          id: true,
          title: true,
          authors: true,
          coverImageUrl: true,
          averageRating: true,
          publishedYear: true,
        },
        orderBy: [
          { averageRating: 'desc' },
          { totalRatings: 'desc' },
        ],
        take: limit - relatedBooks.length,
      })

      relatedBooks.push(...additionalBooks)
    }

    return NextResponse.json({ books: relatedBooks })
  } catch (error) {
    console.error('Get related books error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related books' },
      { status: 500 }
    )
  }
}
