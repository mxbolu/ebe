'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TrendingBook {
  id: string
  title: string
  authors: string[]
  coverImageUrl?: string
  averageRating?: number
  trendingCount: number
}

export default function TrendingBooks() {
  const [books, setBooks] = useState<TrendingBook[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    fetchTrending()
  }, [period])

  const fetchTrending = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/trending?period=${period}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books || [])
      }
    } catch (error) {
      console.error('Failed to fetch trending:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-12 h-16 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 Trending This {period === 'week' ? 'Week' : 'Month'}</h3>
        <p className="text-center text-gray-500 py-8">No trending books yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          🔥 Trending This {period === 'week' ? 'Week' : 'Month'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`text-xs font-medium px-3 py-1 rounded-full transition ${
              period === 'week'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`text-xs font-medium px-3 py-1 rounded-full transition ${
              period === 'month'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {books.map((book, index) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition group"
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
            </div>
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-12 h-16 object-cover rounded shadow-sm"
              />
            ) : (
              <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition">
                {book.title}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-1">{book.authors.join(', ')}</p>
              <div className="flex items-center gap-2 mt-1">
                {book.averageRating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="text-xs text-gray-600">{book.averageRating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-xs text-orange-600 font-medium">
                  {book.trendingCount} {book.trendingCount === 1 ? 'person' : 'people'} reading
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
