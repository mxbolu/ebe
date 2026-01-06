'use client'

import { useState, useEffect } from 'react'
import ThreadedCommentSection from './ThreadedCommentSection'

interface ReviewCardProps {
  review: {
    id: string
    rating: number | null
    review: string | null
    createdAt: string
    helpfulCount?: number
    user: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
  }
  currentUserId?: string
  onHelpfulClick?: (reviewId: string) => void
  showComments?: boolean
}

export default function ReviewCard({ review, currentUserId, onHelpfulClick, showComments = false }: ReviewCardProps) {
  const [marking, setMarking] = useState(false)
  const [showCommentsSection, setShowCommentsSection] = useState(showComments)
  const [comments, setComments] = useState<any[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    if (showCommentsSection) {
      fetchComments()
    }
  }, [showCommentsSection])

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/reviews/${review.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        setCommentCount(data.totalCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleHelpful = async () => {
    if (!onHelpfulClick || marking) return
    setMarking(true)
    try {
      await onHelpfulClick(review.id)
    } finally {
      setMarking(false)
    }
  }

  const toggleComments = () => {
    setShowCommentsSection(!showCommentsSection)
  }

  const isOwnReview = currentUserId === review.user.id

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition">
      {/* User Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.user.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name || review.user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-sm">
                {(review.user.name || review.user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {review.user.name || review.user.username}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Rating */}
        {review.rating && (
          <div className="flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full">
            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-bold text-indigo-600">{review.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Review Text */}
      {review.review && (
        <p className="text-gray-700 whitespace-pre-wrap mb-3 leading-relaxed">
          {review.review}
        </p>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <button
            onClick={toggleComments}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
          </button>

          {!isOwnReview && currentUserId && onHelpfulClick && (
            <button
              onClick={handleHelpful}
              disabled={marking}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <span>Helpful {review.helpfulCount ? `(${review.helpfulCount})` : ''}</span>
            </button>
          )}

          {isOwnReview && (
            <span className="text-xs text-gray-500 italic">Your review</span>
          )}
        </div>

        {/* Comments Section */}
        {showCommentsSection && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {loadingComments ? (
              <div className="text-center py-4 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <ThreadedCommentSection
                reviewId={review.id}
                comments={comments}
                currentUserId={currentUserId}
                onCommentAdded={fetchComments}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
