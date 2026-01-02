'use client'

import { useState, useEffect } from 'react'
import ReadingEntryCard from './ReadingEntryCard'
import ReadingGoal from './ReadingGoal'
import Recommendations from './Recommendations'
import TrendingBooks from './TrendingBooks'

interface ReadingEntry {
  id: string
  status: string
  rating: number | null
  review: string | null
  notes: string | null
  isFavorite: boolean
  isPrivate: boolean
  startDate: string | null
  finishDate: string | null
  currentPage: number | null
  book: {
    id: string
    title: string
    authors: string[]
    coverImageUrl: string | null
    pageCount: number | null
    averageRating: number | null
  }
  createdAt: string
  updatedAt: string
}

export default function ReadingLists() {
  const [entries, setEntries] = useState<ReadingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'WANT_TO_READ' | 'CURRENTLY_READING' | 'FINISHED'>('all')
  const [stats, setStats] = useState<any>(null)

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/reading-entries?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reading entries')
      }

      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reading-entries/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchEntries()
    fetchStats()
  }, [filter])

  const handleEntryUpdated = () => {
    fetchEntries()
    fetchStats()
  }

  const filteredCounts = {
    all: entries.length,
    WANT_TO_READ: entries.filter(e => e.status === 'WANT_TO_READ').length,
    CURRENTLY_READING: entries.filter(e => e.status === 'CURRENTLY_READING').length,
    FINISHED: entries.filter(e => e.status === 'FINISHED').length,
  }

  const currentlyReadingBooks = entries.filter(e => e.status === 'CURRENTLY_READING')

  return (
    <div className="space-y-6">
      {/* Continue Reading Widget */}
      {currentlyReadingBooks.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Continue Reading</h2>
            <span className="ml-auto text-sm text-gray-600">{currentlyReadingBooks.length} {currentlyReadingBooks.length === 1 ? 'book' : 'books'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyReadingBooks.map((entry) => (
              <ReadingEntryCard
                key={entry.id}
                entry={entry}
                onUpdate={handleEntryUpdated}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Books</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.finished}</div>
              <div className="text-sm text-gray-600">Finished</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalPagesRead.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Pages Read</div>
            </div>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{stats.booksThisYear}</div>
              <div className="text-sm text-gray-600">Books This Year</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.booksThisMonth}</div>
              <div className="text-sm text-gray-600">Books This Month</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-red-600">
                {stats.currentStreak}
                <span className="text-lg ml-1">🔥</span>
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-pink-600">{stats.favorites}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All ({stats?.total || 0})
        </button>
        <button
          onClick={() => setFilter('WANT_TO_READ')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            filter === 'WANT_TO_READ'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Want to Read ({stats?.byStatus.wantToRead || 0})
        </button>
        <button
          onClick={() => setFilter('CURRENTLY_READING')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            filter === 'CURRENTLY_READING'
              ? 'bg-green-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Reading ({stats?.byStatus.currentlyReading || 0})
        </button>
        <button
          onClick={() => setFilter('FINISHED')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
            filter === 'FINISHED'
              ? 'bg-purple-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Finished ({stats?.byStatus.finished || 0})
        </button>
      </div>

      {/* New Widgets Row - Only show when viewing all books */}
      {filter === 'all' && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ReadingGoal />
          <TrendingBooks />
          <div className="lg:col-span-1">
            {/* Placeholder for future widget */}
          </div>
        </div>
      )}

      {/* Recommendations Section - Only show when viewing all books */}
      {filter === 'all' && !loading && (
        <Recommendations />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your books...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No books yet</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all'
              ? 'Start by searching and adding books to your reading list'
              : `No books in ${filter.toLowerCase().replace(/_/g, ' ')}`}
          </p>
        </div>
      )}

      {/* Books Grid */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <ReadingEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleEntryUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
