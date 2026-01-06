'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface Book {
  id?: string
  title: string
  authors: string[]
  coverImageUrl?: string
  publishedYear?: number
  genres?: string[]
  pageCount?: number
  averageRating?: number
  totalRatings?: number
  description?: string
  source: string
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    genre: '',
    minYear: '',
    maxYear: '',
    minRating: '',
    sortBy: 'relevance',
  })

  const fetchBooks = useCallback(async (searchQuery: string, pageNum: number = 1, resetResults: boolean = true) => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        offset: ((pageNum - 1) * 20).toString(),
        sortBy: filters.sortBy,
      })

      if (filters.genre) params.append('genre', filters.genre)
      if (filters.minYear) params.append('minYear', filters.minYear)
      if (filters.maxYear) params.append('maxYear', filters.maxYear)
      if (filters.minRating) params.append('minRating', filters.minRating)

      const response = await fetch(`/api/books/search?${params}`)

      if (response.ok) {
        const data = await response.json()
        if (resetResults) {
          setBooks(data.results)
        } else {
          setBooks((prev) => [...prev, ...data.results])
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const initialQuery = searchParams.get('q')
    if (initialQuery) {
      setQuery(initialQuery)
      fetchBooks(initialQuery, 1, true)
    }
  }, [searchParams, fetchBooks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      fetchBooks(query, 1, true)
    }
  }

  const handleFilterChange = () => {
    if (query.trim()) {
      fetchBooks(query, 1, true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Books</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <input
                type="text"
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                onBlur={handleFilterChange}
                placeholder="e.g., Fiction"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Year</label>
              <input
                type="number"
                value={filters.minYear}
                onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                onBlur={handleFilterChange}
                placeholder="e.g., 2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                onBlur={handleFilterChange}
                placeholder="e.g., 7.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value })
                  handleFilterChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="year">Year</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {query && !loading && books.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}

        {books.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {books.map((book, index) => (
                <BookCard key={book.id || `${book.title}-${index}`} book={book} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => fetchBooks(query, page + 1, false)}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Search for books</h3>
            <p className="text-gray-600">Enter a title, author, or ISBN to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition">
      {book.coverImageUrl ? (
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2">
          {book.authors.join(', ')}
        </p>
        {book.publishedYear && (
          <p className="text-xs text-gray-500 mb-2">{book.publishedYear}</p>
        )}
        {book.averageRating && (
          <div className="flex items-center gap-1 mb-3">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm text-gray-700">{book.averageRating.toFixed(1)}</span>
            {book.totalRatings && (
              <span className="text-xs text-gray-500">({book.totalRatings})</span>
            )}
          </div>
        )}
        {book.id ? (
          <Link
            href={`/books/${book.id}`}
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
          >
            View Details
          </Link>
        ) : (
          <button
            onClick={() => alert('This book needs to be added to the database first')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
          >
            Add to Database
          </button>
        )}
      </div>
    </div>
  )
}
