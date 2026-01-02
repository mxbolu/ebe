import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth/middleware'

const submitBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  isbn: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
  pageCount: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  genres: z.array(z.string()).optional().nullable(),
  language: z.string().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await authenticateRequest(request)
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = submitBookSchema.safeParse(body)
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

    // Check if book already exists by ISBN or title+authors
    if (data.isbn) {
      const existingBook = await prisma.book.findFirst({
        where: { isbn: data.isbn },
      })

      if (existingBook) {
        return NextResponse.json(
          { error: 'A book with this ISBN already exists in our database' },
          { status: 409 }
        )
      }
    }

    // Check if there's already a pending submission for this book
    const existingSubmission = await prisma.bookSubmission.findFirst({
      where: {
        title: data.title,
        status: 'PENDING',
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: 'A submission for this book is already pending review',
          submissionId: existingSubmission.id,
        },
        { status: 409 }
      )
    }

    // Create book submission
    const submission = await prisma.bookSubmission.create({
      data: {
        title: data.title,
        authors: data.authors,
        isbn: data.isbn,
        publisher: data.publisher,
        publishedDate: data.publishedDate,
        pageCount: data.pageCount,
        description: data.description,
        genres: data.genres || [],
        language: data.language || 'English',
        coverImage: data.coverImageUrl,
        userId: authResult.payload.userId,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        message: 'Book submitted successfully for review',
        submission: {
          id: submission.id,
          title: submission.title,
          status: submission.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Book submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit book' },
      { status: 500 }
    )
  }
}
