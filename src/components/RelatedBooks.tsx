'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from './ToastContainer'

interface Book {
  id: string
  title: string
  authors: string[]
  coverImageUrl?: string
  averageRating?: number
  publishedYear?: number
}

interface RelatedBooksProps {
  bookId: string
  genres?: string[]
  authors?: string[]
}

export default function RelatedBooks({ bookId, genres = [], authors = [] }: RelatedBooksProps) {
  const toast = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatedBooks()
  }, [bookId])

  const fetchRelatedBooks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        bookId,
        limit: '6',
      })

      if (genres.length > 0) {
        params.append('genres', genres.join(','))
      }
      if (authors.length > 0) {
        params.append('authors', authors.join(','))
      }

      const response = await fetch(`/api/books/${bookId}/related?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch related books')
      }

      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching related books:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (books.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">You Might Also Like</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="group"
          >
            <div className="relative aspect-[2/3] mb-2 overflow-hidden rounded">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition">
              {book.title}
            </h3>

            <p className="text-xs text-gray-600 mb-1 line-clamp-1">
              {book.authors.join(', ')}
            </p>

            {book.averageRating && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-xs text-gray-600">{book.averageRating.toFixed(1)}</span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
