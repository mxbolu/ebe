'use client'

import { useState, useEffect } from 'react'

interface ReadingGoal {
  id: string
  year: number
  targetBooks: number
  currentBooks: number
}

export default function ReadingGoalWidget() {
  const [goal, setGoal] = useState<ReadingGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [targetBooks, setTargetBooks] = useState(12)
  const [submitting, setSubmitting] = useState(false)

  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchGoal()
  }, [])

  const fetchGoal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reading-goals?year=${currentYear}`)

      if (response.ok) {
        const data = await response.json()
        setGoal(data.goal)
        if (data.goal) {
          setTargetBooks(data.goal.targetBooks)
        }
      }
    } catch (error) {
      console.error('Failed to fetch reading goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetGoal = async () => {
    if (targetBooks < 1) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/reading-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          targetBooks,
        }),
      })

      if (response.ok) {
        await fetchGoal()
        setShowForm(false)
      }
    } catch (error) {
      console.error('Failed to set reading goal:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const progress = goal ? (goal.currentBooks / goal.targetBooks) * 100 : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{currentYear} Reading Goal</h3>
        {goal && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {showForm ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Books to read in {currentYear}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={targetBooks}
              onChange={(e) => setTargetBooks(parseInt(e.target.value) || 1)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSetGoal}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
            {goal && (
              <button
                onClick={() => {
                  setShowForm(false)
                  setTargetBooks(goal.targetBooks)
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : goal ? (
        <div>
          <div className="mb-2">
            <div className="flex items-end justify-between mb-1">
              <span className="text-3xl font-bold text-indigo-600">{goal.currentBooks}</span>
              <span className="text-lg text-gray-600">/ {goal.targetBooks} books</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{Math.round(progress)}% complete</span>
            {goal.currentBooks < goal.targetBooks && (
              <span>{goal.targetBooks - goal.currentBooks} books to go</span>
            )}
            {goal.currentBooks >= goal.targetBooks && (
              <span className="text-green-600 font-medium">Goal achieved! 🎉</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Set Your Reading Goal</h4>
          <p className="text-gray-600 mb-4">Challenge yourself to read more books in {currentYear}</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Set Goal
          </button>
        </div>
      )}
    </div>
  )
}
