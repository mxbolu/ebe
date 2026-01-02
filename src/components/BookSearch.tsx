'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BookCard from './BookCard'
import SearchFilters from './SearchFilters'
import { SearchResultsSkeleton } from './LoadingSkeleton'
import { useToast } from './ToastContainer'

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

interface Filters {
  genre?: string
  minRating?: number
  maxRating?: number
  minYear?: number
  maxYear?: number
  sortBy: 'relevance' | 'rating' | 'year' | 'title'
  sortOrder: 'asc' | 'desc'
}

export default function BookSearch() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    sortBy: 'relevance',
    sortOrder: 'desc',
  })
  const resultsPerPage = 20

  const performSearch = async (page: number = 1) => {
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const offset = (page - 1) * resultsPerPage
      const params = new URLSearchParams({
        q: query,
        limit: resultsPerPage.toString(),
        offset: offset.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      if (filters.genre) params.append('genre', filters.genre)
      if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString())
      if (filters.maxRating !== undefined) params.append('maxRating', filters.maxRating.toString())
      if (filters.minYear !== undefined) params.append('minYear', filters.minYear.toString())
      if (filters.maxYear !== undefined) params.append('maxYear', filters.maxYear.toString())

      const response = await fetch(`/api/books/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      console.log('Search API Response:', data)
      setBooks(data.results || [])
      setTotalResults(data.total || 0)
      setHasMore(data.hasMore || false)
      setCurrentPage(page)

      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.total} ${data.total === 1 ? 'book' : 'books'}`)
      }
    } catch (err) {
      setError('Failed to search books. Please try again.')
      toast.error('Failed to search books. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(1)
  }

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    performSearch(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Re-search when filters change
  useEffect(() => {
    if (hasSearched) {
      performSearch(1)
    }
  }, [filters])

  // Real-time search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setBooks([])
      setHasSearched(false)
      return
    }

    const debounceTimer = setTimeout(() => {
      performSearch(1)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(debounceTimer)
  }, [query])

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Books</h2>
        <p className="text-gray-600">
          Search our database of 90,000+ books from multiple sources
        </p>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            autoFocus
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Filters and Results */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            {loading && <SearchResultsSkeleton />}

            {!loading && books.length === 0 && (
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
                  Try searching with a different title, author, or ISBN, or adjust your filters
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {totalResults} {totalResults === 1 ? 'result' : 'results'} found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {totalResults > resultsPerPage && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.ceil(totalResults / resultsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(totalResults / resultsPerPage)
                          if (totalPages <= 7) return true
                          if (page === 1 || page === totalPages) return true
                          if (Math.abs(page - currentPage) <= 1) return true
                          return false
                        })
                        .map((page, idx, array) => {
                          const prevPage = array[idx - 1]
                          const showEllipsis = prevPage && page - prevPage > 1

                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`px-4 py-2 rounded-lg transition ${
                                  currentPage === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          )
                        })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!hasMore}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
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
