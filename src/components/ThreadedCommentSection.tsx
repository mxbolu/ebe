'use client'

import { useState } from 'react'

interface Comment {
  id: string
  comment: string
  createdAt: string
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  replies?: Comment[]
}

interface ThreadedCommentSectionProps {
  reviewId: string
  comments: Comment[]
  currentUserId?: string
  onCommentAdded?: () => void
}

function CommentItem({
  comment,
  reviewId,
  currentUserId,
  onCommentAdded,
  depth = 0,
}: {
  comment: Comment
  reviewId: string
  currentUserId?: string
  onCommentAdded?: () => void
  depth?: number
}) {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim() || posting) return

    setPosting(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: replyText.trim(),
          parentId: comment.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post reply')
      }

      setReplyText('')
      setShowReplyBox(false)
      if (onCommentAdded) onCommentAdded()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setPosting(false)
    }
  }

  const maxDepth = 5 // Maximum nesting level
  const canReply = depth < maxDepth

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatar ? (
            <img
              src={comment.user.avatar}
              alt={comment.user.name || comment.user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-xs">
                {(comment.user.name || comment.user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user.name || comment.user.username}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: new Date(comment.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {comment.comment}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1 ml-3">
            {canReply && currentUserId && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-xs text-gray-600 hover:text-indigo-600 font-medium transition"
              >
                Reply
              </button>
            )}
          </div>

          {/* Reply Box */}
          {showReplyBox && currentUserId && (
            <div className="mt-3 ml-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleReply}
                  disabled={posting || !replyText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-1.5 px-3 rounded transition disabled:opacity-50"
                >
                  {posting ? 'Posting...' : 'Reply'}
                </button>
                <button
                  onClick={() => {
                    setShowReplyBox(false)
                    setReplyText('')
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-1.5 px-3 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  reviewId={reviewId}
                  currentUserId={currentUserId}
                  onCommentAdded={onCommentAdded}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ThreadedCommentSection({
  reviewId,
  comments,
  currentUserId,
  onCommentAdded,
}: ThreadedCommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)

  const handlePostComment = async () => {
    if (!newComment.trim() || posting) return

    setPosting(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post comment')
      }

      setNewComment('')
      if (onCommentAdded) onCommentAdded()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* New Comment Box */}
      {currentUserId && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Start a discussion about this review..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePostComment}
              disabled={posting || !newComment.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No comments yet. Be the first to start a discussion!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              reviewId={reviewId}
              currentUserId={currentUserId}
              onCommentAdded={onCommentAdded}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  )
}
