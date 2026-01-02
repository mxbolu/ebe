'use client'

import { useState, useEffect } from 'react'

interface Challenge {
  id: string
  name: string
  description: string
  type: string
  targetValue: number
  startDate: Date
  endDate: Date
  iconUrl?: string | null
}

interface UserChallenge {
  id: string
  currentValue: number
  isCompleted: boolean
  completedAt: Date | null
  joinedAt: Date
  challenge: Challenge
}

export default function Challenges() {
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([])
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const [allResponse, userResponse] = await Promise.all([
        fetch('/api/challenges'),
        fetch('/api/challenges/user'),
      ])

      if (allResponse.ok) {
        const data = await allResponse.json()
        setAllChallenges(data.challenges || [])
      }

      if (userResponse.ok) {
        const data = await userResponse.json()
        setUserChallenges(data.userChallenges || [])
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: string) => {
    try {
      setJoining(challengeId)
      const response = await fetch('/api/challenges/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })

      if (response.ok) {
        await fetchChallenges() // Refresh
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join challenge')
      }
    } catch (error) {
      console.error('Failed to join challenge:', error)
      alert('Failed to join challenge')
    } finally {
      setJoining(null)
    }
  }

  const isJoined = (challengeId: string) => {
    return userChallenges.some((uc) => uc.challenge.id === challengeId)
  }

  const getDaysRemaining = (endDate: Date) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'monthly':
        return '📅'
      case 'genre':
        return '🎭'
      case 'pages':
        return '📖'
      case 'author':
        return '✍️'
      default:
        return '🎯'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      {userChallenges.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Active Challenges</h2>
            <p className="text-gray-600 mt-1">{userChallenges.length} challenge{userChallenges.length !== 1 ? 's' : ''} in progress</p>
          </div>

          <div className="p-6 space-y-4">
            {userChallenges.map((uc) => {
              const progress = (uc.currentValue / uc.challenge.targetValue) * 100
              const daysLeft = getDaysRemaining(uc.challenge.endDate)

              return (
                <div
                  key={uc.id}
                  className={`border-2 rounded-lg p-4 ${
                    uc.isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getChallengeIcon(uc.challenge.type)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{uc.challenge.name}</h3>
                        <p className="text-sm text-gray-600">{uc.challenge.description}</p>
                      </div>
                    </div>
                    {uc.isCompleted && (
                      <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ Completed
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-700 mb-1">
                      <span>
                        {uc.currentValue} / {uc.challenge.targetValue}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          uc.isCompleted ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Started {new Date(uc.joinedAt).toLocaleDateString()}</span>
                    <span>
                      {uc.isCompleted
                        ? `Completed ${new Date(uc.completedAt!).toLocaleDateString()}`
                        : daysLeft > 0
                        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                        : 'Expired'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Available Challenges */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Available Challenges</h2>
          <p className="text-gray-600 mt-1">Join a challenge to push your reading goals</p>
        </div>

        <div className="p-6 space-y-4">
          {allChallenges.filter((c) => !isJoined(c.id)).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No new challenges available
              </h3>
              <p className="text-gray-600">
                {userChallenges.length > 0
                  ? 'Focus on your active challenges!'
                  : 'Check back soon for new challenges!'}
              </p>
            </div>
          ) : (
            allChallenges
              .filter((c) => !isJoined(c.id))
              .map((challenge) => {
                const daysLeft = getDaysRemaining(challenge.endDate)

                return (
                  <div
                    key={challenge.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-3xl">{getChallengeIcon(challenge.type)}</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">{challenge.name}</h3>
                          <p className="text-sm text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => joinChallenge(challenge.id)}
                        disabled={joining === challenge.id}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          joining === challenge.id
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {joining === challenge.id ? 'Joining...' : 'Join Challenge'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Goal: {challenge.targetValue} {challenge.type === 'pages' ? 'pages' : 'books'}
                      </span>
                      <span>
                        {daysLeft > 0
                          ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                          : 'Expired'}
                      </span>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
