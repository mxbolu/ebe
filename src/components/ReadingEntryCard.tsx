'use client'

import { useState } from 'react'
import Link from 'next/link'
import EditReadingEntryModal from './EditReadingEntryModal'

interface ReadingEntry {
  id: string
  status: string
  rating: number | null
  review: string | null
  notes: string | null
  isFavorite: boolean
  isPrivate: boolean
  startDate: string | null
  finishDate: string | null
  currentPage: number | null
  book: {
    id: string
    title: string
    authors: string[]
    coverImageUrl: string | null
    pageCount: number | null
    averageRating: number | null
  }
  createdAt: string
  updatedAt: string
}

interface ReadingEntryCardProps {
  entry: ReadingEntry
  onUpdate: () => void
}

export default function ReadingEntryCard({ entry, onUpdate }: ReadingEntryCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusColors = {
    WANT_TO_READ: 'bg-blue-100 text-blue-800',
    CURRENTLY_READING: 'bg-green-100 text-green-800',
    FINISHED: 'bg-purple-100 text-purple-800',
    DID_NOT_FINISH: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    WANT_TO_READ: 'Want to Read',
    CURRENTLY_READING: 'Reading',
    FINISHED: 'Finished',
    DID_NOT_FINISH: 'DNF',
  }

  const handleDelete = async () => {
    if (!confirm('Remove this book from your list?')) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/reading-entries/${entry.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      onUpdate()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to remove book. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleFavorite = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/reading-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !entry.isFavorite }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite')
      }

      onUpdate()
    } catch (error) {
      console.error('Update failed:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    setShowStatusMenu(false)
    try {
      const updateData: any = { status: newStatus }

      // Auto-set dates based on status
      if (newStatus === 'CURRENTLY_READING' && !entry.startDate) {
        updateData.startDate = new Date().toISOString()
      }
      if (newStatus === 'FINISHED' && !entry.finishDate) {
        updateData.finishDate = new Date().toISOString()
      }

      const response = await fetch(`/api/reading-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      onUpdate()
    } catch (error) {
      console.error('Update failed:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleStartReading = async () => {
    await handleStatusChange('CURRENTLY_READING')
  }

  const handleFinishReading = async () => {
    await handleStatusChange('FINISHED')
  }

  const progress = entry.currentPage && entry.book.pageCount
    ? Math.round((entry.currentPage / entry.book.pageCount) * 100)
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden">
      <div className="p-4">
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColors[entry.status as keyof typeof statusColors]}`}>
            {statusLabels[entry.status as keyof typeof statusLabels]}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleToggleFavorite}
              disabled={updating}
              className="text-gray-400 hover:text-yellow-500 transition"
            >
              <svg
                className={`w-5 h-5 ${entry.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'fill-none'}`}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Book Info */}
        <div className="flex gap-3 mb-3">
          {entry.book.coverImageUrl ? (
            <img
              src={entry.book.coverImageUrl}
              alt={entry.book.title}
              className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8 text-gray-400"
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

          <div className="flex-1 min-w-0">
            <Link href={`/books/${entry.book.id}`}>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 hover:text-indigo-600 transition cursor-pointer">
                {entry.book.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-600 line-clamp-1">
              {entry.book.authors.join(', ')}
            </p>

            {/* Rating */}
            {entry.rating && (
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= entry.rating!
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 fill-gray-300'
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for Currently Reading */}
        {entry.status === 'CURRENTLY_READING' && entry.book.pageCount && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Page {entry.currentPage || 0} of {entry.book.pageCount}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Review Preview */}
        {entry.review && (
          <div className="mb-3 bg-gray-50 p-2 rounded text-sm text-gray-700 line-clamp-2">
            "{entry.review}"
          </div>
        )}

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-1">
          {entry.startDate && (
            <div>Started: {new Date(entry.startDate).toLocaleDateString()}</div>
          )}
          {entry.finishDate && (
            <div>Finished: {new Date(entry.finishDate).toLocaleDateString()}</div>
          )}
        </div>

        {/* Quick Actions */}
        {entry.status === 'WANT_TO_READ' && (
          <div className="mt-4">
            <button
              onClick={handleStartReading}
              disabled={updating}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
            >
              Start Reading
            </button>
          </div>
        )}

        {entry.status === 'CURRENTLY_READING' && (
          <div className="mt-4">
            <button
              onClick={handleFinishReading}
              disabled={updating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
            >
              Mark as Finished
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={updating}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50 flex items-center justify-between"
            >
              <span>Move to...</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusMenu && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {Object.entries(statusLabels).map(([status, label]) => (
                  status !== entry.status && (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm first:rounded-t-lg last:rounded-b-lg"
                    >
                      {label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition text-sm"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={updating}
            className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <EditReadingEntryModal
        entry={entry}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdate={onUpdate}
      />
    </div>
  )
}
