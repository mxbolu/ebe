'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import RatingInput from '@/components/RatingInput'
import BookReviews from '@/components/BookReviews'
import RelatedBooks from '@/components/RelatedBooks'
import { BookDetailSkeleton } from '@/components/LoadingSkeleton'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useToast } from '@/components/ToastContainer'

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
  genres?: string[]
  language?: string
  averageRating?: number
  totalRatings?: number
}

interface ReadingEntry {
  id: string
  status: string
  rating: number | null
  review: string | null
  isFavorite: boolean
  currentPage: number | null
}

export default function BookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string
  const toast = useToast()

  const [book, setBook] = useState<Book | null>(null)
  const [readingEntry, setReadingEntry] = useState<ReadingEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchBookDetails()
  }, [bookId])

  const fetchBookDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${bookId}`)

      if (!response.ok) {
        throw new Error('Book not found')
      }

      const data = await response.json()
      setBook(data.book)
      setReadingEntry(data.readingEntry || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async (status: string) => {
    setAdding(true)
    try {
      const response = await fetch('/api/reading-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add book')
      }

      await fetchBookDetails()
      setShowAddMenu(false)
      toast.success('Book added to your library!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remove this book from your list?')) return

    try {
      const response = await fetch(`/api/reading-entries/${readingEntry!.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove book')
      }

      await fetchBookDetails()
      toast.success('Book removed from your library')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return <BookDetailSkeleton />
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This book does not exist'}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 font-medium">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Book Cover & Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-8">
                {/* Cover Image */}
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full rounded-lg shadow-lg mb-6"
                  />
                ) : (
                <div className="w-full aspect-[2/3] bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                  <svg
                    className="w-24 h-24 text-gray-400"
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
                </div>
              )}

              {/* Actions */}
              {!readingEntry ? (
                !showAddMenu ? (
                  <button
                    onClick={() => setShowAddMenu(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    Add to My Books
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAddToList('WANT_TO_READ')}
                      disabled={adding}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      Want to Read
                    </button>
                    <button
                      onClick={() => handleAddToList('CURRENTLY_READING')}
                      disabled={adding}
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      Currently Reading
                    </button>
                    <button
                      onClick={() => handleAddToList('FINISHED')}
                      disabled={adding}
                      className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      Finished
                    </button>
                    <button
                      onClick={() => setShowAddMenu(false)}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">In Your Library</p>
                    <p className="text-xs text-green-700 mt-1">
                      Status: {readingEntry.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Edit Entry
                  </Link>
                  <button
                    onClick={handleRemove}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition"
                  >
                    Remove from Library
                  </button>
                </div>
              )}

              {/* Book Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
                {book.pageCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages</span>
                    <span className="font-medium text-gray-900">{book.pageCount}</span>
                  </div>
                )}
                {book.publishedYear && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published</span>
                    <span className="font-medium text-gray-900">
                      {book.publishedYear}
                    </span>
                  </div>
                )}
                {book.publisher && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publisher</span>
                    <span className="font-medium text-gray-900">{book.publisher}</span>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISBN</span>
                    <span className="font-medium text-gray-900">{book.isbn}</span>
                  </div>
                )}
                {book.language && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium text-gray-900">{book.language}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Book Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Author */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{book.title}</h1>
              <p className="text-lg text-gray-700 mb-4">
                by {book.authors.map((author, index) => (
                  <span key={author}>
                    <Link
                      href={`/authors/${encodeURIComponent(author)}`}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline transition"
                    >
                      {author}
                    </Link>
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))}
              </p>

              {/* Rating */}
              {book.averageRating && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= (book.averageRating! / 2)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 fill-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {book.averageRating.toFixed(1)} {book.totalRatings && `(${book.totalRatings} ratings)`}
                  </span>
                </div>
              )}

              {/* Genres */}
              {book.genres && book.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About This Book</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {book.description}
                </div>
              </div>
            )}

            {/* Your Entry */}
            {readingEntry && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Entry</h2>

                {readingEntry.rating && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Rating</p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-6 h-6 ${
                            star <= (readingEntry.rating! / 2)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 fill-gray-300'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-lg font-semibold text-gray-900">
                        {readingEntry.rating.toFixed(1)}/10
                      </span>
                    </div>
                  </div>
                )}

                {readingEntry.review && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Review</p>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                      {readingEntry.review}
                    </div>
                  </div>
                )}

                {book.pageCount && readingEntry.currentPage && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Reading Progress</p>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Page {readingEntry.currentPage} of {book.pageCount}</span>
                      <span>{Math.round((readingEntry.currentPage / book.pageCount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((readingEntry.currentPage / book.pageCount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Section */}
            <BookReviews bookId={bookId} />

            {/* Related Books Section */}
            <RelatedBooks
              bookId={bookId}
              genres={book.genres}
              authors={book.authors}
            />
          </div>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  )
}
