import { PrismaClient, UserRole, BadgeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ebe.com' },
    update: {},
    create: {
      email: 'admin@ebe.com',
      username: 'admin',
      name: 'Admin User',
      password: '$2a$10$XqWKz5QmZQ0vXYx1qXqH4eJ4YwQ7qD4xJZxQG7Wg8Zu0vXYx1qXqH', // "password123" - CHANGE THIS IN PRODUCTION
      role: UserRole.SUPER_ADMIN,
      showContributions: true,
      gamificationStats: {
        create: {
          totalPoints: 0,
          level: 1,
        },
      },
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create achievement badges
  const badges = [
    {
      name: 'First Book',
      description: 'Submit your first book to the community',
      type: BadgeType.BOOK_CONTRIBUTOR,
      points: 10,
      criteria: JSON.stringify({ booksSubmitted: 1 }),
    },
    {
      name: 'Book Contributor',
      description: 'Successfully have 5 books approved',
      type: BadgeType.BOOK_CONTRIBUTOR,
      points: 50,
      criteria: JSON.stringify({ booksApproved: 5 }),
    },
    {
      name: 'Prolific Contributor',
      description: 'Successfully have 25 books approved',
      type: BadgeType.BOOK_CONTRIBUTOR,
      points: 250,
      criteria: JSON.stringify({ booksApproved: 25 }),
    },
    {
      name: 'Edit Master',
      description: 'Have 10 edit suggestions approved',
      type: BadgeType.EDIT_CONTRIBUTOR,
      points: 100,
      criteria: JSON.stringify({ editsApproved: 10 }),
    },
    {
      name: 'First Steps',
      description: 'Finish your first book',
      type: BadgeType.READING_MILESTONE,
      points: 5,
      criteria: JSON.stringify({ booksRead: 1 }),
    },
    {
      name: 'Bookworm',
      description: 'Read 10 books',
      type: BadgeType.READING_MILESTONE,
      points: 50,
      criteria: JSON.stringify({ booksRead: 10 }),
    },
    {
      name: 'Voracious Reader',
      description: 'Read 50 books',
      type: BadgeType.READING_MILESTONE,
      points: 250,
      criteria: JSON.stringify({ booksRead: 50 }),
    },
    {
      name: 'Century Club',
      description: 'Read 100 books',
      type: BadgeType.READING_MILESTONE,
      points: 500,
      criteria: JSON.stringify({ booksRead: 100 }),
    },
    {
      name: 'Page Turner',
      description: 'Read 1,000 pages',
      type: BadgeType.READING_MILESTONE,
      points: 25,
      criteria: JSON.stringify({ pagesRead: 1000 }),
    },
    {
      name: 'Marathon Reader',
      description: 'Read 10,000 pages',
      type: BadgeType.READING_MILESTONE,
      points: 200,
      criteria: JSON.stringify({ pagesRead: 10000 }),
    },
    {
      name: 'Thoughtful Reviewer',
      description: 'Write 10 book reviews',
      type: BadgeType.REVIEW_MASTER,
      points: 50,
      criteria: JSON.stringify({ reviewsWritten: 10 }),
    },
    {
      name: 'Review Champion',
      description: 'Write 50 book reviews',
      type: BadgeType.REVIEW_MASTER,
      points: 250,
      criteria: JSON.stringify({ reviewsWritten: 50 }),
    },
    {
      name: 'Early Adopter',
      description: 'One of the first 100 users to join ebe',
      type: BadgeType.EARLY_ADOPTER,
      points: 100,
      criteria: JSON.stringify({ joinedBefore: '2026-03-01T00:00:00.000Z' }),
    },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
  }

  console.log(`✅ Created ${badges.length} achievement badges`)

  // Create some sample books (optional - remove if you want a clean start)
  const sampleBooks = [
    {
      title: 'The Great Gatsby',
      authors: ['F. Scott Fitzgerald'],
      isbn: '9780743273565',
      description: 'A classic American novel set in the Jazz Age.',
      publishedYear: 1925,
      genres: ['Fiction', 'Classic'],
      pageCount: 180,
      publisher: 'Scribner',
      language: 'en',
      source: 'ADMIN_ADDED' as const,
      addedByUserId: adminUser.id,
      approvedByUserId: adminUser.id,
    },
    {
      title: 'To Kill a Mockingbird',
      authors: ['Harper Lee'],
      isbn: '9780061120084',
      description: 'A gripping tale of racial injustice and childhood innocence.',
      publishedYear: 1960,
      genres: ['Fiction', 'Classic'],
      pageCount: 324,
      publisher: 'Harper Perennial Modern Classics',
      language: 'en',
      source: 'ADMIN_ADDED' as const,
      addedByUserId: adminUser.id,
      approvedByUserId: adminUser.id,
    },
    {
      title: '1984',
      authors: ['George Orwell'],
      isbn: '9780451524935',
      description: 'A dystopian social science fiction novel.',
      publishedYear: 1949,
      genres: ['Fiction', 'Dystopian', 'Classic'],
      pageCount: 328,
      publisher: 'Signet Classic',
      language: 'en',
      source: 'ADMIN_ADDED' as const,
      addedByUserId: adminUser.id,
      approvedByUserId: adminUser.id,
    },
  ]

  for (const book of sampleBooks) {
    await prisma.book.upsert({
      where: { isbn: book.isbn! },
      update: {},
      create: book,
    })
  }

  console.log(`✅ Created ${sampleBooks.length} sample books`)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
