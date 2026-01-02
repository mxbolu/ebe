'use client'

import { useState, useEffect } from 'react'

interface ReadingGoalProps {
  userId?: string
}

interface Goal {
  id: string
  year: number
  targetBooks: number
  currentBooks: number
}

export default function ReadingGoal({ userId }: ReadingGoalProps) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [targetBooks, setTargetBooks] = useState(12)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchGoal()
  }, [])

  const fetchGoal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/goals?year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        setGoal(data.goal)
        if (data.goal) {
          setTargetBooks(data.goal.targetBooks)
        }
      }
    } catch (error) {
      console.error('Failed to fetch goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGoal = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          targetBooks,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGoal(data.goal)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to save goal:', error)
      alert('Failed to save goal. Please try again.')
    }
  }

  const handleDeleteGoal = async () => {
    if (!confirm('Delete your reading goal for this year?')) return

    try {
      const response = await fetch(`/api/goals?year=${currentYear}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setGoal(null)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    )
  }

  const progress = goal ? (goal.currentBooks / goal.targetBooks) * 100 : 0
  const progressCapped = Math.min(progress, 100)

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900">{currentYear} Reading Goal</h3>
        </div>
        {goal && !editing && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setEditing(true)
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {!goal && !editing ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Set a reading goal for {currentYear}!</p>
          <button
            onClick={() => setEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Set Goal
          </button>
        </div>
      ) : editing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many books do you want to read in {currentYear}?
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={targetBooks}
              onChange={(e) => setTargetBooks(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveGoal}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Save Goal
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
            {goal && (
              <button
                onClick={handleDeleteGoal}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ) : goal ? (
        <div>
          <div className="flex items-end justify-between mb-2">
            <div>
              <div className="text-4xl font-bold text-indigo-600">
                {goal.currentBooks}
                <span className="text-2xl text-gray-500">/{goal.targetBooks}</span>
              </div>
              <p className="text-sm text-gray-600">books read</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{Math.round(progressCapped)}%</div>
              <p className="text-sm text-gray-600">complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressCapped}%` }}
            ></div>
          </div>

          {/* Motivational message */}
          {goal.currentBooks >= goal.targetBooks ? (
            <p className="text-sm text-green-600 font-medium">
              🎉 Goal achieved! Consider setting a new challenge!
            </p>
          ) : goal.currentBooks >= goal.targetBooks * 0.75 ? (
            <p className="text-sm text-indigo-600 font-medium">
              🔥 Almost there! {goal.targetBooks - goal.currentBooks} more to go!
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              {goal.targetBooks - goal.currentBooks} books remaining
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
