/**
 * Reading goal tracking utilities
 */

import prisma from '@/lib/prisma'
import { notifyGoalAchieved } from '@/lib/notifications'

export async function updateReadingGoal(userId: string): Promise<void> {
  try {
    const currentYear = new Date().getFullYear()

    // Count finished books for the current year
    const currentBooks = await prisma.readingEntry.count({
      where: {
        userId,
        status: 'FINISHED',
        finishDate: {
          gte: new Date(currentYear, 0, 1),
          lt: new Date(currentYear + 1, 0, 1),
        },
      },
    })

    // Update the user's reading goal if it exists
    const goal = await prisma.readingGoal.findUnique({
      where: {
        userId_year: {
          userId,
          year: currentYear,
        },
      },
    })

    if (goal) {
      const wasNotAchieved = goal.currentBooks < goal.targetBooks
      const nowAchieved = currentBooks >= goal.targetBooks

      await prisma.readingGoal.update({
        where: {
          userId_year: {
            userId,
            year: currentYear,
          },
        },
        data: {
          currentBooks,
        },
      })

      console.log(
        `[Reading Goal] Updated ${currentYear} goal for user ${userId}: ` +
        `${currentBooks}/${goal.targetBooks} books`
      )

      // Notify user if goal was just achieved
      if (wasNotAchieved && nowAchieved) {
        await notifyGoalAchieved(userId, currentYear, goal.targetBooks)
      }
    }
  } catch (error) {
    // Non-blocking - don't throw
    console.error('Update reading goal error:', error)
  }
}
