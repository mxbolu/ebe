/**
 * Notification utilities
 */

import prisma from '@/lib/prisma'

export type NotificationType =
  | 'follow'
  | 'comment'
  | 'review_helpful'
  | 'badge_earned'
  | 'challenge_completed'
  | 'goal_achieved'

interface NotificationData {
  userId?: string
  username?: string
  bookId?: string
  bookTitle?: string
  badgeId?: string
  badgeName?: string
  challengeId?: string
  challengeName?: string
  [key: string]: any
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
  link?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        link,
      },
    })

    console.log(`[Notification] Created ${type} notification for user ${userId}`)
  } catch (error) {
    // Non-blocking - don't throw
    console.error('Create notification error:', error)
  }
}

export async function notifyNewFollower(
  followedUserId: string,
  followerUsername: string,
  followerName: string | null
): Promise<void> {
  const displayName = followerName || followerUsername
  await createNotification(
    followedUserId,
    'follow',
    'New Follower',
    `${displayName} started following you`,
    { username: followerUsername },
    `/users/${followerUsername}`
  )
}

export async function notifyReviewComment(
  reviewAuthorId: string,
  commenterUsername: string,
  commenterName: string | null,
  bookTitle: string,
  bookId: string
): Promise<void> {
  const displayName = commenterName || commenterUsername
  await createNotification(
    reviewAuthorId,
    'comment',
    'New Comment',
    `${displayName} commented on your review of "${bookTitle}"`,
    { username: commenterUsername, bookId, bookTitle },
    `/books/${bookId}`
  )
}

export async function notifyReviewHelpful(
  reviewAuthorId: string,
  username: string,
  name: string | null,
  bookTitle: string,
  bookId: string
): Promise<void> {
  const displayName = name || username
  await createNotification(
    reviewAuthorId,
    'review_helpful',
    'Review Liked',
    `${displayName} found your review of "${bookTitle}" helpful`,
    { username, bookId, bookTitle },
    `/books/${bookId}`
  )
}

export async function notifyBadgeEarned(
  userId: string,
  badgeId: string,
  badgeName: string
): Promise<void> {
  await createNotification(
    userId,
    'badge_earned',
    'Badge Earned!',
    `Congratulations! You earned the "${badgeName}" badge`,
    { badgeId, badgeName },
    '/dashboard'
  )
}

export async function notifyChallengeCompleted(
  userId: string,
  challengeId: string,
  challengeName: string
): Promise<void> {
  await createNotification(
    userId,
    'challenge_completed',
    'Challenge Completed!',
    `Congratulations! You completed the "${challengeName}" challenge`,
    { challengeId, challengeName },
    '/challenges'
  )
}

export async function notifyGoalAchieved(
  userId: string,
  year: number,
  targetBooks: number
): Promise<void> {
  await createNotification(
    userId,
    'goal_achieved',
    'Reading Goal Achieved!',
    `Congratulations! You reached your ${year} reading goal of ${targetBooks} books`,
    { year, targetBooks },
    '/dashboard'
  )
}
