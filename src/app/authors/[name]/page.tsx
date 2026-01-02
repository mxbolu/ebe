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

export default function AuthorPage() {
  const params = useParams()
  const authorName = decodeURIComponent(params.name as string)
  const toast = useToast()

  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'year' | 'title'>('year')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const resultsPerPage = 20

  useEffect(() => {
    fetchAuthorBooks(1)
  }, [authorName, sortBy, sortOrder])

  const fetchAuthorBooks = async (page: number) => {
    try {
      setLoading(true)
      setError('')

      const offset = (page - 1) * resultsPerPage
      const params = new URLSearchParams({
        author: authorName,
        limit: resultsPerPage.toString(),
        offset: offset.toString(),
        sortBy,
        sortOrder,
      })

      const response = await fetch(`/api/books/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch books by author')
      }

      const data = await response.json()
      setBooks(data.results || [])
      setTotalResults(data.total || 0)
      setHasMore(data.hasMore || false)
      setCurrentPage(page)

      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.total} ${data.total === 1 ? 'book' : 'books'} by ${authorName}`)
      }
    } catch (err) {
      setError('Failed to load books by this author')
      toast.error('Failed to load books by this author')
      console.error('Author books error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    fetchAuthorBooks(page)
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
          {/* Author Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{authorName}</h1>
                <p className="text-gray-600">Author</p>
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
                  <option value="year">Year Published</option>
                  <option value="rating">Rating</option>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Books Found</h3>
              <p className="mt-2 text-gray-500">
                We couldn't find any books by {authorName} in our database.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && books.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {totalResults} {totalResults === 1 ? 'Book' : 'Books'} by {authorName}
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
