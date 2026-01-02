'use client'

import { useState, useEffect } from 'react'

interface Streak {
  id: string
  currentStreak: number
  longestStreak: number
  lastReadDate: Date | null
}

export default function ReadingStreak() {
  const [streak, setStreak] = useState<Streak | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreak()
  }, [])

  const fetchStreak = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/streak')
      if (response.ok) {
        const data = await response.json()
        setStreak(data.streak)
      }
    } catch (error) {
      console.error('Failed to fetch streak:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate days until streak breaks
  const getDaysUntilBreak = () => {
    if (!streak?.lastReadDate) return null
    const lastRead = new Date(streak.lastReadDate)
    const now = new Date()
    lastRead.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)
    const daysSinceLastRead = Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastRead === 0) {
      return 'Read today ✓'
    } else if (daysSinceLastRead === 1) {
      return 'Read yesterday - Keep it going!'
    } else {
      return `${daysSinceLastRead} days since last read`
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/2 mb-4"></div>
          <div className="h-16 bg-white/20 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  const currentStreak = streak?.currentStreak || 0
  const longestStreak = streak?.longestStreak || 0

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Reading Streak</h2>
          <div className="text-3xl">🔥</div>
        </div>

        {/* Current streak display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold mb-2">{currentStreak}</div>
          <div className="text-lg opacity-90">
            day{currentStreak !== 1 ? 's' : ''} in a row
          </div>
          {streak?.lastReadDate && (
            <div className="text-sm opacity-75 mt-2">{getDaysUntilBreak()}</div>
          )}
        </div>

        {/* Fire icons visual */}
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(Math.min(currentStreak, 7))].map((_, i) => (
            <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              🔥
            </span>
          ))}
          {currentStreak > 7 && (
            <span className="text-2xl">...</span>
          )}
        </div>

        {/* Longest streak */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-sm opacity-75 mb-1">Personal Best</div>
          <div className="text-2xl font-bold">
            {longestStreak} day{longestStreak !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Milestone progress */}
      <div className="bg-white/5 backdrop-blur-sm p-4">
        <div className="text-white/90 text-sm mb-2">Next Milestone</div>
        <div className="space-y-2">
          {[
            { days: 7, label: 'Week Warrior', icon: '🏆' },
            { days: 30, label: 'Monthly Maven', icon: '⭐' },
            { days: 100, label: 'Centurion Streak', icon: '👑' },
            { days: 365, label: 'Year-Long Reader', icon: '🎯' },
          ].map((milestone) => {
            const progress = Math.min((currentStreak / milestone.days) * 100, 100)
            const isComplete = currentStreak >= milestone.days

            return (
              <div key={milestone.days} className={isComplete ? 'opacity-50' : ''}>
                <div className="flex items-center justify-between text-white/90 text-sm mb-1">
                  <span>
                    {milestone.icon} {milestone.label}
                  </span>
                  <span>
                    {isComplete ? '✓' : `${currentStreak}/${milestone.days}`}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete ? 'bg-green-400' : 'bg-white'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )
          }).filter((_, i) => {
            // Show only the next milestone or all completed
            const milestones = [7, 30, 100, 365]
            return currentStreak >= milestones[i] || currentStreak < milestones[i]
          }).slice(0, 2)} {/* Show max 2 milestones */}
        </div>
      </div>

      {/* Motivation message */}
      {currentStreak === 0 && (
        <div className="bg-white/5 backdrop-blur-sm p-4 text-center">
          <p className="text-white/90 text-sm">
            Mark a book as finished to start your streak! 🚀
          </p>
        </div>
      )}
    </div>
  )
}
