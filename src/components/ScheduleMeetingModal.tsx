'use client'

import { useState } from 'react'

interface ScheduleMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  bookClubId: string
  onScheduled: () => void
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  bookClubId,
  onScheduled,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)

      // Combine date and time
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)

      const response = await fetch(`/api/book-clubs/${bookClubId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          scheduledAt: scheduledAt.toISOString(),
          duration,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule meeting')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setScheduledDate('')
      setScheduledTime('')
      setDuration(60)

      onScheduled()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white">📅 Schedule Meeting</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-100 border-2 border-red-300 text-red-800 px-4 py-3 rounded-lg font-medium text-sm">
              ❌ {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Monthly Book Discussion"
              required
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition text-sm sm:text-base"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will we discuss?"
              rows={3}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition resize-none text-sm sm:text-base"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Time *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Duration *
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition text-sm sm:text-base"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-2.5 sm:py-3 rounded-lg transition disabled:opacity-50 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              {loading ? '⏳ Scheduling...' : '📅 Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
