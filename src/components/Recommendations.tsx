'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BookCard from './BookCard'
import { SearchResultsSkeleton } from './LoadingSkeleton'

interface Book {
  id: string
  title: string
  authors: string[]
  coverImageUrl?: string
  averageRating?: number
  publishedYear?: number
  genres?: string[]
  pageCount?: number
  source: string
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [basedOn, setBasedOn] = useState<{ genres: string[]; authors: string[] } | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recommendations?limit=6')
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        setBasedOn(data.basedOn)
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <SearchResultsSkeleton />
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations for You</h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600 mb-2">No recommendations yet</p>
          <p className="text-sm text-gray-500">Rate some books to get personalized suggestions!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommendations for You
          </h3>
          {basedOn && (
            <p className="text-sm text-gray-500 mt-1">
              Based on your interest in {basedOn.genres.slice(0, 2).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {recommendations.length >= 6 && (
        <div className="mt-4 text-center">
          <button
            onClick={fetchRecommendations}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Show more recommendations →
          </button>
        </div>
      )}
    </div>
  )
}
