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

  for (const milestone of milestones) {
    if (finishedCount >= milestone.count) {
      // Check if badge exists or create it (with race condition handling)
      let badge = await prisma.badge.findFirst({
        where: {
          name: milestone.badgeName,
          type: 'READING_MILESTONE',
        },
      })

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
        } catch (error: any) {
          // If unique constraint fails (race condition), refetch the badge
          if (error.code === 'P2002') {
            badge = await prisma.badge.findFirst({
              where: {
                name: milestone.badgeName,
                type: 'READING_MILESTONE',
              },
            })
          } else {
            throw error
          }
        }
      }

      // Skip if badge creation/fetch failed
      if (!badge) continue

      // Check if user already has this badge
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

  for (const milestone of milestones) {
    if (reviewCount >= milestone.count) {
      let badge = await prisma.badge.findFirst({
        where: {
          name: milestone.badgeName,
          type: 'REVIEW_MASTER',
        },
      })

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
        } catch (error: any) {
          if (error.code === 'P2002') {
            badge = await prisma.badge.findFirst({
              where: {
                name: milestone.badgeName,
                type: 'REVIEW_MASTER',
              },
            })
          } else {
            throw error
          }
        }
      }

      if (!badge) continue

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
            badge = await prisma.badge.findFirst({
              where: {
                name: badgeName,
                type: 'GENRE_EXPLORER',
              },
            })
          } else {
            throw error
          }
        }
      }

      if (!badge) continue

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = await prisma.readingStreak.findUnique({
    where: { userId },
  })

  if (!streak) {
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
      lastRead.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 0) {
        // Same day, no update needed
        return
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        const newStreak = streak.currentStreak + 1
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
              badge = await prisma.badge.findFirst({
                where: {
                  name: milestone.badgeName,
                  type: 'READING_STREAK',
                },
              })
            } else {
              throw error
            }
          }
        }

        if (!badge) continue

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
        }
      }
    }
  }
}
