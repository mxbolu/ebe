import prisma from './prisma'

export interface BadgeCheckResult {
  earned: boolean
  badgeId?: string
  badgeName?: string
}

/**
 * Check and award reading milestone badges
 */
export async function checkReadingMilestones(userId: string): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = []

  // Count finished books
  const finishedCount = await prisma.readingEntry.count({
    where: {
      userId,
      status: 'FINISHED',
    },
  })

  // Define milestones
  const milestones = [
    { count: 5, name: 'First 5 Books', badgeName: 'Bookworm Beginner' },
    { count: 10, name: 'Double Digits', badgeName: 'Ten Book Triumph' },
    { count: 25, name: 'Quarter Century', badgeName: 'Avid Reader' },
    { count: 50, name: 'Half Century', badgeName: 'Book Enthusiast' },
    { count: 100, name: 'Centennial Reader', badgeName: 'Literary Legend' },
  ]

  // Batch fetch all reading milestone badges to reduce queries
  const eligibleMilestones = milestones.filter((m) => finishedCount >= m.count)
  if (eligibleMilestones.length === 0) return results

  const badgeNames = eligibleMilestones.map((m) => m.badgeName)
  const existingBadges = await prisma.badge.findMany({
    where: {
      name: { in: badgeNames },
      type: 'READING_MILESTONE',
    },
  })

  // Batch fetch user's existing milestone badges
  const userBadges = await prisma.userBadge.findMany({
    where: {
      userId,
      badgeId: { in: existingBadges.map((b) => b.id) },
    },
  })
  const userBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

  for (const milestone of eligibleMilestones) {
    // Find or create badge
    let badge = existingBadges.find((b) => b.name === milestone.badgeName)

    // Create badge if it doesn't exist
    if (!badge) {
      try {
        badge = await prisma.badge.create({
          data: {
            name: milestone.badgeName,
            description: `Read ${milestone.count} books`,
            type: 'READING_MILESTONE',
            criteria: JSON.stringify({ booksFinished: milestone.count }),
            points: milestone.count * 10,
          },
        })
        // Add to cache for subsequent checks
        existingBadges.push(badge)
      } catch (error: any) {
        // If unique constraint fails (race condition), refetch the badge
        if (error.code === 'P2002') {
          console.log(`[Badge] Race condition detected for "${milestone.badgeName}", refetching...`)
          badge = await prisma.badge.findFirst({
            where: {
              name: milestone.badgeName,
              type: 'READING_MILESTONE',
            },
          })
          if (badge) existingBadges.push(badge)
        } else {
          console.error(`[Badge] Failed to create reading milestone badge "${milestone.badgeName}":`, error)
          throw error
        }
      }
    }

    // Skip if badge creation/fetch failed
    if (!badge) {
      console.error(`[Badge] Failed to create or fetch reading milestone badge "${milestone.badgeName}" for user ${userId}`)
      continue
    }

    // Check if user already has this badge (using cached Set)
    if (!userBadgeIds.has(badge.id)) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      })

      console.log(`[Badge] User ${userId} earned "${badge.name}" (Reading Milestone)`)
      results.push({
        earned: true,
        badgeId: badge.id,
        badgeName: badge.name,
      })
    }
  }

  return results
}

/**
 * Check and award review master badges
 */
export async function checkReviewMaster(userId: string): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = []

  // Count reviews written
  const reviewCount = await prisma.readingEntry.count({
    where: {
      userId,
      status: 'FINISHED',
      review: { not: null },
    },
  })

  const milestones = [
    { count: 5, badgeName: 'Reviewer Rookie' },
    { count: 25, badgeName: 'Review Master' },
    { count: 50, badgeName: 'Critique Connoisseur' },
    { count: 100, badgeName: 'Review Legend' },
  ]

  // Batch fetch eligible badges
  const eligibleMilestones = milestones.filter((m) => reviewCount >= m.count)
  if (eligibleMilestones.length === 0) return results

  const badgeNames = eligibleMilestones.map((m) => m.badgeName)
  const existingBadges = await prisma.badge.findMany({
    where: {
      name: { in: badgeNames },
      type: 'REVIEW_MASTER',
    },
  })

  // Batch fetch user's existing badges
  const userBadges = await prisma.userBadge.findMany({
    where: {
      userId,
      badgeId: { in: existingBadges.map((b) => b.id) },
    },
  })
  const userBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

  for (const milestone of eligibleMilestones) {
    let badge = existingBadges.find((b) => b.name === milestone.badgeName)

    if (!badge) {
      try {
        badge = await prisma.badge.create({
          data: {
            name: milestone.badgeName,
            description: `Write ${milestone.count} reviews`,
            type: 'REVIEW_MASTER',
            criteria: JSON.stringify({ reviewsWritten: milestone.count }),
            points: milestone.count * 5,
          },
        })
        existingBadges.push(badge)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`[Badge] Race condition detected for "${milestone.badgeName}", refetching...`)
          badge = await prisma.badge.findFirst({
            where: {
              name: milestone.badgeName,
              type: 'REVIEW_MASTER',
            },
          })
          if (badge) existingBadges.push(badge)
        } else {
          console.error(`[Badge] Failed to create review master badge "${milestone.badgeName}":`, error)
          throw error
        }
      }
    }

    if (!badge) {
      console.error(`[Badge] Failed to create or fetch review master badge "${milestone.badgeName}" for user ${userId}`)
      continue
    }

    // Check using cached Set
    if (!userBadgeIds.has(badge.id)) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      })

      console.log(`[Badge] User ${userId} earned "${badge.name}" (Review Master)`)
      results.push({
        earned: true,
        badgeId: badge.id,
        badgeName: badge.name,
      })
    }
  }

  return results
}

/**
 * Check and award genre explorer badges
 */
export async function checkGenreExplorer(userId: string): Promise<BadgeCheckResult[]> {
  const results: BadgeCheckResult[] = []

  // Get all finished books with genres
  const finishedBooks = await prisma.readingEntry.findMany({
    where: {
      userId,
      status: 'FINISHED',
    },
    include: {
      book: {
        select: {
          genres: true,
        },
      },
    },
  })

  // Count books per genre
  const genreCounts = new Map<string, number>()
  finishedBooks.forEach((entry) => {
    entry.book.genres?.forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1)
    })
  })

  // Check for genres with 5+ books
  for (const [genre, count] of genreCounts.entries()) {
    if (count >= 5) {
      const badgeName = `${genre} Explorer`

      let badge = await prisma.badge.findFirst({
        where: {
          name: badgeName,
          type: 'GENRE_EXPLORER',
        },
      })

      if (!badge) {
        try {
          badge = await prisma.badge.create({
            data: {
              name: badgeName,
              description: `Read 5 ${genre} books`,
              type: 'GENRE_EXPLORER',
              criteria: JSON.stringify({ genre, booksInGenre: 5 }),
              points: 25,
            },
          })
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`[Badge] Race condition detected for "${badgeName}", refetching...`)
            badge = await prisma.badge.findFirst({
              where: {
                name: badgeName,
                type: 'GENRE_EXPLORER',
              },
            })
          } else {
            console.error(`[Badge] Failed to create genre explorer badge "${badgeName}":`, error)
            throw error
          }
        }
      }

      if (!badge) {
        console.error(`[Badge] Failed to create or fetch genre explorer badge "${badgeName}" for user ${userId}`)
        continue
      }

      const existing = await prisma.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: badge.id,
          },
        },
      })

      if (!existing) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        })

        console.log(`[Badge] User ${userId} earned "${badge.name}" (Genre Explorer)`)
        results.push({
          earned: true,
          badgeId: badge.id,
          badgeName: badge.name,
        })
      }
    }
  }

  return results
}

/**
 * Check all badges for a user
 */
export async function checkAllBadges(userId: string): Promise<BadgeCheckResult[]> {
  const results = await Promise.all([
    checkReadingMilestones(userId),
    checkReviewMaster(userId),
    checkGenreExplorer(userId),
  ])

  return results.flat()
}

/**
 * Update reading streak for a user
 */
export async function updateReadingStreak(userId: string): Promise<void> {
  // Use UTC to avoid timezone issues
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  let streak = await prisma.readingStreak.findUnique({
    where: { userId },
  })

  if (!streak) {
    console.log(`[Streak] Creating new streak for user ${userId}`)
    streak = await prisma.readingStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: today,
      },
    })
  } else {
    const lastRead = streak.lastReadDate ? new Date(streak.lastReadDate) : null
    if (lastRead) {
      // Normalize to UTC midnight for consistent day comparison
      const lastReadUTC = new Date(Date.UTC(
        lastRead.getUTCFullYear(),
        lastRead.getUTCMonth(),
        lastRead.getUTCDate()
      ))
      const daysDiff = Math.floor((today.getTime() - lastReadUTC.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 0) {
        // Same day, no update needed
        return
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        const newStreak = streak.currentStreak + 1
        console.log(`[Streak] User ${userId} streak increased: ${streak.currentStreak} → ${newStreak} days`)
        await prisma.readingStreak.update({
          where: { userId },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastReadDate: today,
          },
        })
      } else {
        // Streak broken, reset to 1
        console.log(`[Streak] User ${userId} streak broken after ${streak.currentStreak} days (${daysDiff} day gap)`)
        await prisma.readingStreak.update({
          where: { userId },
          data: {
            currentStreak: 1,
            lastReadDate: today,
          },
        })
      }
    } else {
      // No previous read date, start streak
      await prisma.readingStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak.longestStreak),
          lastReadDate: today,
        },
      })
    }
  }

  // Check for streak badges
  streak = await prisma.readingStreak.findUnique({
    where: { userId },
  })

  if (streak) {
    const streakMilestones = [
      { days: 7, badgeName: 'Week Warrior' },
      { days: 30, badgeName: 'Monthly Maven' },
      { days: 100, badgeName: 'Centurion Streak' },
      { days: 365, badgeName: 'Year-Long Reader' },
    ]

    for (const milestone of streakMilestones) {
      if (streak.currentStreak >= milestone.days) {
        let badge = await prisma.badge.findFirst({
          where: {
            name: milestone.badgeName,
            type: 'READING_STREAK',
          },
        })

        if (!badge) {
          try {
            badge = await prisma.badge.create({
              data: {
                name: milestone.badgeName,
                description: `Read for ${milestone.days} consecutive days`,
                type: 'READING_STREAK',
                criteria: JSON.stringify({ streakDays: milestone.days }),
                points: milestone.days,
              },
            })
          } catch (error: any) {
            if (error.code === 'P2002') {
              console.log(`[Badge] Race condition detected for "${milestone.badgeName}", refetching...`)
              badge = await prisma.badge.findFirst({
                where: {
                  name: milestone.badgeName,
                  type: 'READING_STREAK',
                },
              })
            } else {
              console.error(`[Badge] Failed to create streak badge "${milestone.badgeName}":`, error)
              throw error
            }
          }
        }

        if (!badge) {
          console.error(`[Badge] Failed to create or fetch streak badge "${milestone.badgeName}" for user ${userId}`)
          continue
        }

        const existing = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id,
            },
          },
        })

        if (!existing) {
          await prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id,
            },
          })
          console.log(`[Badge] User ${userId} earned "${badge.name}" (Reading Streak)`)
        }
      }
    }
  }
}
