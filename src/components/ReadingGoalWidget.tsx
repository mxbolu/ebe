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
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 p-6 animate-pulse shadow-xl">
        <div className="h-6 bg-purple-200 rounded w-1/2 mb-4"></div>
        <div className="h-32 bg-purple-200 rounded"></div>
      </div>
    )
  }

  const progress = goal ? (goal.currentBooks / goal.targetBooks) * 100 : 0
  const isAchieved = goal && goal.currentBooks >= goal.targetBooks

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-2xl transition-all duration-300 hover:shadow-3xl ${
      isAchieved
        ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 border-green-300'
        : 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 border-purple-300'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-4xl ${isAchieved ? 'animate-bounce' : ''}`}>
            {isAchieved ? '🏆' : '📚'}
          </div>
          <h3 className="text-xl font-black text-white drop-shadow-md">
            {currentYear} Reading Goal
          </h3>
        </div>
        {goal && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <label className="block text-sm font-bold text-white mb-2 drop-shadow">
            📖 Books to read in {currentYear}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={targetBooks}
              onChange={(e) => setTargetBooks(parseInt(e.target.value) || 1)}
              className="flex-1 px-4 py-3 border-2 border-white/30 bg-white/90 rounded-lg focus:ring-4 focus:ring-white/50 focus:border-white outline-none font-bold text-purple-600"
            />
            <button
              onClick={handleSetGoal}
              disabled={submitting}
              className="bg-white text-purple-600 hover:bg-purple-50 font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {submitting ? '💾 Saving...' : '✅ Save'}
            </button>
            {goal && (
              <button
                onClick={() => {
                  setShowForm(false)
                  setTargetBooks(goal.targetBooks)
                }}
                className="bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105"
              >
                ❌
              </button>
            )}
          </div>
        </div>
      ) : goal ? (
        <div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white drop-shadow-lg">{goal.currentBooks}</span>
                <span className="text-2xl font-bold text-white/90">/ {goal.targetBooks}</span>
              </div>
              <span className="text-lg font-bold text-white/90">books 📚</span>
            </div>

            <div className="relative w-full bg-white/30 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className={`h-4 rounded-full transition-all duration-500 shadow-lg ${
                  isAchieved
                    ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {progress >= 10 && (
                  <div className="h-full flex items-center justify-end pr-2">
                    <span className="text-xs font-black text-white drop-shadow">
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {goal.currentBooks < goal.targetBooks ? (
              <>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-sm font-bold text-white drop-shadow">
                    {goal.targetBooks - goal.currentBooks} books to go! 💪
                  </span>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-sm font-bold text-white drop-shadow">
                    {Math.round(progress)}% complete
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full bg-white/30 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                <span className="text-lg font-black text-white drop-shadow-lg animate-pulse">
                  🎉 Goal Achieved! You're Amazing! 🎉
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-white/20 backdrop-blur-sm rounded-xl">
          <div className="text-6xl mb-3">🎯</div>
          <h4 className="text-xl font-black text-white mb-2 drop-shadow">Set Your Reading Goal!</h4>
          <p className="text-white/90 font-medium mb-4 drop-shadow">
            Challenge yourself to read more books in {currentYear}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-purple-600 hover:bg-purple-50 font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-110"
          >
            🚀 Set Goal Now!
          </button>
        </div>
      )}
    </div>
  )
}
