'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BookCard from '@/components/BookCard'
import { SearchResultsSkeleton } from '@/components/LoadingSkeleton'
import { useToast } from '@/components/ToastContainer'
import ErrorBoundary from '@/components/ErrorBoundary'

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

export default function GenrePage() {
  const params = useParams()
  const genreName = decodeURIComponent(params.name as string)
  const toast = useToast()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year' | 'title'>('rating')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const resultsPerPage = 20

  useEffect(() => {
    fetchGenreBooks(1)
  }, [genreName, sortBy, sortOrder])

  const fetchGenreBooks = async (page: number) => {
    try {
      setLoading(true)
      setError('')

      const offset = (page - 1) * resultsPerPage
      const params = new URLSearchParams({
        genre: genreName,
        limit: resultsPerPage.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/books/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch books in genre')
      }

      const data = await response.json()
      setBooks(data.results || [])
      setTotalResults(data.total || 0)
      setHasMore(data.hasMore || false)
      setCurrentPage(page)

      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.total} ${data.total === 1 ? 'book' : 'books'} in ${genreName}`)
      }
    } catch (err) {
      setError('Failed to load books in this genre')
      toast.error('Failed to load books in this genre')
      console.error('Genre books error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchGenreBooks(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Genre Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{genreName}</h1>
                <p className="text-gray-600">Genre</p>
              </div>
            </div>
          </div>

          {/* Sort Controls */}
          {!loading && books.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="rating">Rating</option>
                  <option value="year">Year Published</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="relevance">Relevance</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && <SearchResultsSkeleton />}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Books</h3>
              <p className="mt-2 text-gray-500">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && books.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Books Found</h3>
              <p className="mt-2 text-gray-500">
                We couldn't find any books in the {genreName} genre.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && books.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {totalResults} {totalResults === 1 ? 'Book' : 'Books'} in {genreName}
                </h2>
                {totalResults > resultsPerPage && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {Math.ceil(totalResults / resultsPerPage)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </main>
      </div>
    </ErrorBoundary>
  )
}
