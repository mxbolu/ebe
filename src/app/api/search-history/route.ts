import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const saveSearchSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    genre: z.string().optional(),
    minYear: z.string().optional(),
    maxYear: z.string().optional(),
    minRating: z.string().optional(),
    sortBy: z.string().optional(),
  }).optional(),
  resultCount: z.number().int().min(0).optional(),
})

/**
 * GET /api/search-history
 * Get user's recent search history
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const searches = await prisma.searchHistory.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 50), // Max 50 searches
      select: {
        id: true,
        query: true,
        filters: true,
        resultCount: true,
        createdAt: true,
      },
    })

    // Parse filters JSON for each search
    const searchesWithParsedFilters = searches.map((search) => ({
      ...search,
      filters: search.filters ? JSON.parse(search.filters) : null,
    }))

    return NextResponse.json({
      searches: searchesWithParsedFilters,
      total: searches.length,
    })
  } catch (error) {
    console.error('Get search history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/search-history
 * Save a search to history
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    const body = await request.json()
    const validationResult = saveSearchSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if this exact search already exists recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const filtersJson = data.filters ? JSON.stringify(data.filters) : null

    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        userId: user.userId,
        query: data.query,
        filters: filtersJson,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    // If search already exists recently, don't save duplicate
    if (existingSearch) {
      return NextResponse.json(
        {
          search: existingSearch,
          message: 'Search already in recent history',
        },
        { status: 200 }
      )
    }

    // Save the search
    const search = await prisma.searchHistory.create({
      data: {
        userId: user.userId,
        query: data.query,
        filters: filtersJson,
        resultCount: data.resultCount || 0,
      },
    })

    // Keep only last 50 searches per user (delete older ones)
    const userSearches = await prisma.searchHistory.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    })

    if (userSearches.length > 50) {
      const searchesToDelete = userSearches.slice(50).map((s) => s.id)
      await prisma.searchHistory.deleteMany({
        where: {
          id: {
            in: searchesToDelete,
          },
        },
      })
    }

    return NextResponse.json(
      {
        search: {
          ...search,
          filters: search.filters ? JSON.parse(search.filters) : null,
        },
        message: 'Search saved to history',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Save search history error:', error)
    return NextResponse.json(
      { error: 'Failed to save search to history' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/search-history
 * Clear all search history for the user
 */
export async function DELETE(request: NextRequest) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult

  try {
    await prisma.searchHistory.deleteMany({
      where: {
        userId: user.userId,
      },
    })

    return NextResponse.json({
      message: 'Search history cleared',
    })
  } catch (error) {
    console.error('Clear search history error:', error)
    return NextResponse.json(
      { error: 'Failed to clear search history' },
      { status: 500 }
    )
  }
}
