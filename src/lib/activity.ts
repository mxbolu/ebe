import prisma from './prisma'

export type ActivityType =
  | 'finished_book'
  | 'started_book'
  | 'rated_book'
  | 'reviewed_book'
  | 'followed_user'

interface ActivityData {
  [key: string]: any
}

/**
 * Create an activity log entry
 */
export async function createActivity(
  userId: string,
  type: ActivityType,
  data: ActivityData
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        data: JSON.stringify(data),
      },
    })
    console.log(`[Activity] Created ${type} activity for user ${userId}`)
  } catch (error) {
    console.error(`[Activity] Failed to create ${type} activity:`, error)
    // Don't throw error - activity logging should not break main functionality
  }
}

/**
 * Log when a user finishes a book
 */
export async function logFinishedBook(
  userId: string,
  bookId: string,
  bookTitle: string,
  bookAuthor: string
) {
  await createActivity(userId, 'finished_book', {
    bookId,
    bookTitle,
    bookAuthor,
  })
}

/**
 * Log when a user starts reading a book
 */
export async function logStartedBook(
  userId: string,
  bookId: string,
  bookTitle: string,
  bookAuthor: string
) {
  await createActivity(userId, 'started_book', {
    bookId,
    bookTitle,
    bookAuthor,
  })
}

/**
 * Log when a user reviews a book
 */
export async function logReviewedBook(
  userId: string,
  bookId: string,
  bookTitle: string,
  bookAuthor: string,
  rating?: number,
  review?: string
) {
  await createActivity(userId, 'reviewed_book', {
    bookId,
    bookTitle,
    bookAuthor,
    rating,
    review: review ? review.substring(0, 200) : undefined, // Limit review text to 200 chars
  })
}

/**
 * Log when a user follows another user
 */
export async function logFollowedUser(
  userId: string,
  followedUserId: string,
  followedUsername: string,
  followedName?: string | null
) {
  await createActivity(userId, 'followed_user', {
    followedUserId,
    followedUsername,
    followedName,
  })
}
