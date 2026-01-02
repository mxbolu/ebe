'use client'

import { useState, useEffect } from 'react'

interface Stats {
  totalBooks: number
  booksRead: number
  booksReading: number
  totalPages: number
  reviewsWritten: number
  averageRating: number
  favoriteGenres: Array<{ genre: string; count: number }>
  readingStreak: number
  badgesEarned: number
  totalPoints: number
}

export default function UserStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // Fetch data from multiple endpoints
      const [entriesRes, badgesRes, streakRes] = await Promise.all([
        fetch('/api/user/reading-entries'),
        fetch('/api/user/badges'),
        fetch('/api/user/streak'),
      ])

      const entries = entriesRes.ok ? await entriesRes.json() : { entries: [] }
      const badges = badgesRes.ok ? await badgesRes.json() : { badges: [] }
      const streak = streakRes.ok ? await streakRes.json() : { streak: null }

      // Calculate stats
      const allEntries = entries.entries || []
      const finishedBooks = allEntries.filter((e: any) => e.status === 'FINISHED')
      const readingBooks = allEntries.filter((e: any) => e.status === 'READING')

      const totalPages = finishedBooks.reduce((sum: number, e: any) => sum + (e.book.pageCount || 0), 0)
      const reviewsWritten = finishedBooks.filter((e: any) => e.review).length
      const ratingsSum = finishedBooks.reduce((sum: number, e: any) => sum + (e.rating || 0), 0)
      const averageRating = finishedBooks.length > 0 ? ratingsSum / finishedBooks.length : 0

      // Count genres
      const genreMap = new Map<string, number>()
      finishedBooks.forEach((e: any) => {
        e.book.genres?.forEach((genre: string) => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 1)
        })
      })

      const favoriteGenres = Array.from(genreMap.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const totalPoints = (badges.badges || []).reduce((sum: number, b: any) => sum + b.badge.points, 0)

      setStats({
        totalBooks: allEntries.length,
        booksRead: finishedBooks.length,
        booksReading: readingBooks.length,
        totalPages,
        reviewsWritten,
        averageRating,
        favoriteGenres,
        readingStreak: streak.streak?.currentStreak || 0,
        badgesEarned: (badges.badges || []).length,
        totalPoints,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Failed to load statistics</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Reading Statistics</h2>
        <p className="text-gray-600 mt-1">Your reading journey at a glance</p>
      </div>

      <div className="p-6">
        {/* Main stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📚"
            label="Books Read"
            value={stats.booksRead}
            color="blue"
          />
          <StatCard
            icon="📖"
            label="Currently Reading"
            value={stats.booksReading}
            color="green"
          />
          <StatCard
            icon="📄"
            label="Total Pages"
            value={stats.totalPages.toLocaleString()}
            color="purple"
          />
          <StatCard
            icon="✍️"
            label="Reviews Written"
            value={stats.reviewsWritten}
            color="pink"
          />
          <StatCard
            icon="⭐"
            label="Avg Rating"
            value={stats.averageRating.toFixed(1)}
            color="yellow"
          />
          <StatCard
            icon="🔥"
            label="Current Streak"
            value={`${stats.readingStreak} days`}
            color="orange"
          />
          <StatCard
            icon="🏆"
            label="Badges Earned"
            value={stats.badgesEarned}
            color="indigo"
          />
          <StatCard
            icon="💎"
            label="Total Points"
            value={stats.totalPoints.toLocaleString()}
            color="teal"
          />
        </div>

        {/* Favorite genres */}
        {stats.favoriteGenres.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Genres</h3>
            <div className="space-y-2">
              {stats.favoriteGenres.map((genre, index) => {
                const maxCount = stats.favoriteGenres[0].count
                const width = (genre.count / maxCount) * 100

                return (
                  <div key={genre.genre}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">
                        {index + 1}. {genre.genre}
                      </span>
                      <span className="text-gray-600">{genre.count} books</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    pink: 'from-pink-500 to-pink-700',
    yellow: 'from-yellow-500 to-yellow-700',
    orange: 'from-orange-500 to-orange-700',
    indigo: 'from-indigo-500 to-indigo-700',
    teal: 'from-teal-500 to-teal-700',
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-4 text-white shadow-lg`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  )
}
