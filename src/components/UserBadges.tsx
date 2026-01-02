'use client'

import { useState, useEffect } from 'react'
import BadgeCard from './BadgeCard'

interface Badge {
  id: string
  name: string
  description: string
  type: string
  iconUrl?: string | null
  points: number
}

interface UserBadge {
  id: string
  earnedAt: Date
  badge: Badge
}

export default function UserBadges() {
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/badges')
      if (response.ok) {
        const data = await response.json()
        setBadges(data.badges || [])
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total points
  const totalPoints = badges.reduce((sum, ub) => sum + ub.badge.points, 0)

  // Filter badges by type
  const filteredBadges = filter === 'all'
    ? badges
    : badges.filter((ub) => ub.badge.type === filter)

  // Badge type filters
  const badgeTypes = [
    { value: 'all', label: 'All Badges', icon: '🏆' },
    { value: 'READING_MILESTONE', label: 'Reading', icon: '📚' },
    { value: 'REVIEW_MASTER', label: 'Reviews', icon: '✍️' },
    { value: 'GENRE_EXPLORER', label: 'Explorer', icon: '🌍' },
    { value: 'READING_STREAK', label: 'Streaks', icon: '🔥' },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Badges</h2>
            <p className="text-gray-600 mt-1">
              {badges.length} badge{badges.length !== 1 ? 's' : ''} earned • {totalPoints} points
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {badgeTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setFilter(type.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${
                  filter === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
              {type.value !== 'all' && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${filter === type.value ? 'bg-white/20' : 'bg-gray-200'}
                `}>
                  {badges.filter((b) => b.badge.type === type.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Badges grid */}
      <div className="p-6">
        {filteredBadges.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No badges earned yet
            </h3>
            <p className="text-gray-600">
              Start reading and reviewing books to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBadges.map((userBadge) => (
              <BadgeCard
                key={userBadge.id}
                badge={{ ...userBadge.badge, earnedAt: userBadge.earnedAt }}
                earned={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {badges.length > 0 && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {badges.filter((b) => b.badge.type === 'READING_MILESTONE').length}
              </div>
              <div className="text-sm text-gray-600">Reading Badges</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {badges.filter((b) => b.badge.type === 'REVIEW_MASTER').length}
              </div>
              <div className="text-sm text-gray-600">Review Badges</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {badges.filter((b) => b.badge.type === 'GENRE_EXPLORER').length}
              </div>
              <div className="text-sm text-gray-600">Explorer Badges</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {badges.filter((b) => b.badge.type === 'READING_STREAK').length}
              </div>
              <div className="text-sm text-gray-600">Streak Badges</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
