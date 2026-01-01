import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const updateEntrySchema = z.object({
  status: z.enum(['WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH']).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  review: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  finishDate: z.string().datetime().nullable().optional(),
  isFavorite: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

/**
 * GET /api/reading-entries/[id]
 * Get a specific reading entry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = params

  try {
    const entry = await prisma.readingEntry.findUnique({
      where: { id },
      include: {
        book: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    // Check if user owns this entry or if it's public
    if (entry.userId !== user.userId && entry.isPrivate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({ entry }, { status: 200 })
  } catch (error) {
    console.error('Get reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading entry' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reading-entries/[id]
 * Update a reading entry
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = params

  try {
    const body = await request.json()
    const validationResult = updateEntrySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.readingEntry.findUnique({
      where: { id },
      include: { book: true },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const data = validationResult.data
    const updateData: any = {}

    if (data.status !== undefined) updateData.status = data.status
    if (data.rating !== undefined) updateData.rating = data.rating
    if (data.review !== undefined) updateData.review = data.review
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.finishDate !== undefined) {
      updateData.finishDate = data.finishDate ? new Date(data.finishDate) : null
    }

    // Update reading entry
    const entry = await prisma.readingEntry.update({
      where: { id },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            authors: true,
            coverImageUrl: true,
            publishedYear: true,
            pageCount: true,
          },
        },
      },
    })

    return NextResponse.json({ entry }, { status: 200 })
  } catch (error) {
    console.error('Update reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to update reading entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reading-entries/[id]
 * Delete a reading entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request)
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = params

  try {
    // Check if entry exists and belongs to user
    const existingEntry = await prisma.readingEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete reading entry (progress will be deleted via cascade)
    await prisma.readingEntry.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Reading entry deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete reading entry error:', error)
    return NextResponse.json(
      { error: 'Failed to delete reading entry' },
      { status: 500 }
    )
  }
}
