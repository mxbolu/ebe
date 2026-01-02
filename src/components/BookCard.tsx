'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

interface BookCardProps {
  book: Book
  onAdded?: () => void
}

export default function BookCard({ book, onAdded }: BookCardProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddToList = async (status: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'FINISHED') => {
    setAdding(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/reading-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add book')
      }

      setSuccess(`Added to ${status.toLowerCase().replace(/_/g, ' ')}`)
      setShowAddMenu(false)

      if (onAdded) {
        onAdded()
      }

      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden">
      <div className="p-4">
        {/* Book Cover and Info */}
        <div className="flex gap-4">
          {/* Cover Image */}
          <div className="flex-shrink-0">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-24 h-36 object-cover rounded shadow-sm"
              />
            ) : (
              <div className="w-24 h-36 bg-gray-200 rounded flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
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
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <Link href={`/books/${book.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-indigo-600 transition cursor-pointer">
                {book.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 mb-2">
              {book.authors.map((author, index) => (
                <span key={author}>
                  <Link
                    href={`/authors/${encodeURIComponent(author)}`}
                    className="hover:text-indigo-600 hover:underline transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {author}
                  </Link>
                  {index < book.authors.length - 1 && ', '}
                </span>
              ))}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {book.publishedYear && (
                <span>{book.publishedYear}</span>
              )}
              {book.pageCount && (
                <span>{book.pageCount} pages</span>
              )}
              {book.averageRating && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  {book.averageRating.toFixed(1)}
                </span>
              )}
            </div>

            {book.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {book.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 relative">
          {success && (
            <div className="mb-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {!showAddMenu ? (
            <button
              onClick={() => setShowAddMenu(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
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
          )}
        </div>
      </div>
    </div>
  )
}
