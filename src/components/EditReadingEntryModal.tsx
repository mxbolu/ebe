'use client'

import { useState, useEffect } from 'react'
import RatingInput from './RatingInput'

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
    averageRating?: number | null
  }
}

interface EditReadingEntryModalProps {
  entry: ReadingEntry
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function EditReadingEntryModal({
  entry,
  isOpen,
  onClose,
  onUpdate,
}: EditReadingEntryModalProps) {
  const [formData, setFormData] = useState({
    status: entry.status,
    rating: entry.rating,
    review: entry.review || '',
    notes: entry.notes || '',
    isFavorite: entry.isFavorite,
    isPrivate: entry.isPrivate,
    startDate: entry.startDate ? entry.startDate.split('T')[0] : '',
    finishDate: entry.finishDate ? entry.finishDate.split('T')[0] : '',
    currentPage: entry.currentPage || 0,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Reset form when entry changes
  useEffect(() => {
    setFormData({
      status: entry.status,
      rating: entry.rating,
      review: entry.review || '',
      notes: entry.notes || '',
      isFavorite: entry.isFavorite,
      isPrivate: entry.isPrivate,
      startDate: entry.startDate ? entry.startDate.split('T')[0] : '',
      finishDate: entry.finishDate ? entry.finishDate.split('T')[0] : '',
      currentPage: entry.currentPage || 0,
    })
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/reading-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          rating: formData.rating,
          review: formData.review || null,
          notes: formData.notes || null,
          isFavorite: formData.isFavorite,
          isPrivate: formData.isPrivate,
          startDate: formData.startDate || null,
          finishDate: formData.finishDate || null,
          currentPage: formData.currentPage || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update entry')
      }

      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const progressPercentage = entry.book.pageCount && formData.currentPage
    ? Math.min(Math.round((formData.currentPage / entry.book.pageCount) * 100), 100)
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {entry.book.coverImageUrl && (
              <img
                src={entry.book.coverImageUrl}
                alt={entry.book.title}
                className="w-12 h-18 object-cover rounded shadow-sm"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Reading Entry</h2>
              <p className="text-sm text-gray-600 line-clamp-1">{entry.book.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Reading Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'WANT_TO_READ', label: 'Want to Read', color: 'blue' },
                { value: 'CURRENTLY_READING', label: 'Currently Reading', color: 'green' },
                { value: 'FINISHED', label: 'Finished', color: 'purple' },
                { value: 'DID_NOT_FINISH', label: 'Did Not Finish', color: 'gray' },
              ].map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: status.value })}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    formData.status === status.value
                      ? `bg-${status.color}-600 text-white`
                      : `bg-${status.color}-50 text-${status.color}-700 hover:bg-${status.color}-100`
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating - Only for finished books */}
          {formData.status === 'FINISHED' && (
            <div>
              <RatingInput
                value={formData.rating}
                onChange={(rating) => setFormData({ ...formData, rating })}
                label="Your Rating"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finish Date
              </label>
              <input
                type="date"
                value={formData.finishDate}
                onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Reading Progress */}
          {entry.book.pageCount && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Page
              </label>
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <input
                    type="number"
                    min="0"
                    max={entry.book.pageCount}
                    value={formData.currentPage || ''}
                    onChange={(e) => setFormData({ ...formData, currentPage: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <span className="text-sm text-gray-600">
                    of {entry.book.pageCount}
                  </span>
                </div>
                {progressPercentage > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{progressPercentage}% complete</span>
                      <span>{entry.book.pageCount - (formData.currentPage || 0)} pages remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review - Only for finished books */}
          {formData.status === 'FINISHED' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                rows={4}
                placeholder="Share your thoughts about this book..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.review.length} characters
              </p>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-indigo-900">Rate and review after finishing</p>
                  <p className="text-xs text-indigo-700 mt-1">Mark this book as "Finished" to add your rating and review.</p>
                </div>
              </div>
            </div>
          )}

          {/* Personal Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Private notes for yourself..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Only you can see these notes
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFavorite}
                onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-900">Mark as Favorite</div>
                <div className="text-sm text-gray-500">Add to your favorites collection</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <div className="font-medium text-gray-900">Keep Private</div>
                <div className="text-sm text-gray-500">Hide this entry from your public profile</div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
