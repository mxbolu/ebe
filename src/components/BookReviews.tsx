'use client'

import { useState, useEffect } from 'react'
import { useToast } from './ToastContainer'
import ReviewCard from './ReviewCard'

interface Review {
  id: string
  rating: number | null
  review: string | null
  createdAt: string
  helpfulCount: number
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

interface BookReviewsProps {
  bookId: string
}

export default function BookReviews({ bookId }: BookReviewsProps) {
  const toast = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    setPage(1)
    fetchReviews(1, sortBy)
  }, [bookId, sortBy])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchReviews = async (pageNum: number = page, sort: string = sortBy) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${bookId}/reviews?page=${pageNum}&limit=5&sortBy=${sort}`)

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(pageNum === 1 ? data.reviews : [...reviews, ...data.reviews])
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleHelpfulClick = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchReviews(1, sortBy)
      }
    } catch (error) {
      console.error('Failed to mark review as helpful:', error)
      toast.error('Failed to mark review as helpful')
    }
  }

  if (loading && page === 1) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reader Reviews</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reader Reviews</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews yet. Be the first to review this book!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Reader Reviews ({reviews.length})
        </h2>

        {/* Sort Filter */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            currentUserId={currentUserId}
            onHelpfulClick={handleHelpfulClick}
            showComments={false}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchReviews(page + 1, sortBy)}
          disabled={loading}
          className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More Reviews'}
        </button>
      )}
    </div>
  )
}
