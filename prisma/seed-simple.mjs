import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

console.log('🌱 Starting database seeding...')

try {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ebe.com' },
    update: {},
    create: {
      email: 'admin@ebe.com',
      username: 'admin',
      name: 'Admin User',
      password: '$2a$10$XqWKz5QmZQ0vXYx1qXqH4eJ4YwQ7qD4xJZxQG7Wg8Zu0vXYx1qXqH',
      role: 'SUPER_ADMIN',
      showContributions: true,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create a few badges
  await prisma.badge.create({
    data: {
      name: 'First Book',
      description: 'Submit your first book to the community',
      type: 'BOOK_CONTRIBUTOR',
      points: 10,
      criteria: JSON.stringify({ booksSubmitted: 1 }),
    },
  })

  console.log('✅ Created badges')
  console.log('🎉 Database seeding completed successfully!')
} catch (error) {
  console.error('❌ Error seeding database:', error)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
