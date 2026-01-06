/**
 * Challenge progress tracking utilities
 */

import prisma from '@/lib/prisma'
import { notifyChallengeCompleted } from '@/lib/notifications'

export async function updateChallengeProgress(
  userId: string,
  bookId: string
): Promise<void> {
  try {
    // Get the book details to check challenge eligibility
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        pageCount: true,
        genres: true,
        authors: true,
      },
    })

    if (!book) return

    // Get all active challenges the user has joined
    const userChallenges = await prisma.userChallenge.findMany({
      where: {
        userId,
        isCompleted: false,
        challenge: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      },
      include: {
        challenge: true,
      },
    })

    // Update progress for each applicable challenge
    for (const userChallenge of userChallenges) {
      const { challenge } = userChallenge
      let shouldUpdate = false
      let incrementValue = 0

      switch (challenge.type) {
        case 'monthly':
          // Count any book finished
          shouldUpdate = true
          incrementValue = 1
          break

        case 'pages':
          // Count pages read
          if (book.pageCount) {
            shouldUpdate = true
            incrementValue = book.pageCount
          }
          break

        case 'genre':
          // Check if book matches challenge genre (stored in description or name)
          const challengeGenre = extractGenreFromChallenge(challenge.name, challenge.description)
          if (challengeGenre && book.genres.some(g =>
            g.toLowerCase().includes(challengeGenre.toLowerCase()) ||
            challengeGenre.toLowerCase().includes(g.toLowerCase())
          )) {
            shouldUpdate = true
            incrementValue = 1
          }
          break

        case 'author':
          // Check if book matches challenge author (stored in description or name)
          const challengeAuthor = extractAuthorFromChallenge(challenge.name, challenge.description)
          if (challengeAuthor && book.authors.some(a =>
            a.toLowerCase().includes(challengeAuthor.toLowerCase()) ||
            challengeAuthor.toLowerCase().includes(a.toLowerCase())
          )) {
            shouldUpdate = true
            incrementValue = 1
          }
          break

        default:
          // Generic: count books
          shouldUpdate = true
          incrementValue = 1
      }

      if (shouldUpdate && incrementValue > 0) {
        const newValue = userChallenge.currentValue + incrementValue
        const isCompleted = newValue >= challenge.targetValue

        await prisma.userChallenge.update({
          where: { id: userChallenge.id },
          data: {
            currentValue: newValue,
            isCompleted,
            completedAt: isCompleted && !userChallenge.isCompleted ? new Date() : undefined,
          },
        })

        console.log(
          `[Challenge] Updated ${challenge.type} challenge progress for user ${userId}: ` +
          `${newValue}/${challenge.targetValue}${isCompleted ? ' (COMPLETED!)' : ''}`
        )

        // Notify user if challenge was just completed
        if (isCompleted && !userChallenge.isCompleted) {
          await notifyChallengeCompleted(userId, challenge.id, challenge.name)
        }
      }
    }
  } catch (error) {
    // Non-blocking - don't throw
    console.error('Update challenge progress error:', error)
  }
}

function extractGenreFromChallenge(name: string, description: string): string | null {
  // Try to extract genre from name or description
  const text = `${name} ${description}`.toLowerCase()

  const commonGenres = [
    'fiction', 'non-fiction', 'fantasy', 'science fiction', 'sci-fi',
    'mystery', 'thriller', 'romance', 'horror', 'biography',
    'history', 'self-help', 'poetry', 'drama', 'adventure'
  ]

  for (const genre of commonGenres) {
    if (text.includes(genre)) {
      return genre
    }
  }

  return null
}

function extractAuthorFromChallenge(name: string, description: string): string | null {
  // Simple extraction - look for "by [author]" or "from [author]"
  const text = `${name} ${description}`
  const byMatch = text.match(/by ([A-Z][a-z]+ [A-Z][a-z]+)/i)
  const fromMatch = text.match(/from ([A-Z][a-z]+ [A-Z][a-z]+)/i)

  return byMatch?.[1] || fromMatch?.[1] || null
}
