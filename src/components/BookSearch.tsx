'use client'

import { useState } from 'react'
import Link from 'next/link'
import BookCard from './BookCard'

interface Book {
  id: string
  title: string
  authors: string[]
  isbn?: string
  coverImageUrl?: string
  description?: string
  pageCount?: number
  publishedYear?: number
  publisher?: string
  averageRating?: number
  source: string
}

export default function BookSearch() {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const response = await fetch(
        `/api/books/search?q=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      console.log('Search API Response:', data)
      console.log('Results array:', data.results)
      console.log('Number of results:', data.results?.length)
      setBooks(data.results || [])
    } catch (err) {
      setError('Failed to search books. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Books</h2>
        <p className="text-gray-600">
          Search our database or discover new books from multiple sources
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </form>

      {/* Search Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Searching across multiple sources...</p>
        </div>
      )}

      {!loading && hasSearched && books.length === 0 && (
        <div className="text-center py-12">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No books found</h3>
          <p className="mt-2 text-gray-500 mb-4">
            Try searching with a different title, author, or ISBN
          </p>
          <Link
            href="/submit-book"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Can't find your book? Submit it here
          </Link>
        </div>
      )}

      {!loading && books.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {books.length} {books.length === 1 ? 'result' : 'results'} found
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {!hasSearched && (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Start searching</h3>
          <p className="mt-2 text-gray-500">
            Enter a book title, author name, or ISBN to find books
          </p>
        </div>
      )}
    </div>
  )
}
