import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const updateProgressSchema = z.object({
  currentPage: z.number().min(0),
})

/**
 * PATCH /api/reading-entries/[id]/progress
 * Update reading progress
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
    const validationResult = updateProgressSchema.safeParse(body)

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
    const entry = await prisma.readingEntry.findUnique({
      where: { id },
      include: { progress: true, book: true },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Reading entry not found' },
        { status: 404 }
      )
    }

    if (entry.userId !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!entry.progress) {
      return NextResponse.json(
        { error: 'No progress tracking for this entry' },
        { status: 400 }
      )
    }

    const { currentPage } = validationResult.data
    const totalPages = entry.progress.totalPages
    const progressPercentage = (currentPage / totalPages) * 100

    // Update progress
    const progress = await prisma.readingProgress.update({
      where: { id: entry.progress.id },
      data: {
        currentPage,
        progressPercentage: Math.min(progressPercentage, 100),
      },
    })

    return NextResponse.json({ progress }, { status: 200 })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
