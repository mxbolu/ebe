'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainNav from '@/components/MainNav'

interface Challenge {
  id: string
  name: string
  description: string
  type: string
  targetValue: number
  startDate: string
  endDate: string
  iconUrl: string | null
  userChallenges?: {
    id: string
    currentValue: number
    isCompleted: boolean
    completedAt: string | null
  }[]
  _count: {
    userChallenges: number
  }
}

export default function ChallengesPage() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    fetchChallenges()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reading-challenges')

      if (!response.ok) {
        throw new Error('Failed to fetch challenges')
      }

      const data = await response.json()
      setChallenges(data.challenges)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinLeave = async (challengeId: string, isJoined: boolean) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/reading-challenges/${challengeId}/join`, {
        method: isJoined ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        await fetchChallenges()
      }
    } catch (error) {
      console.error('Failed to join/leave challenge:', error)
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isActive = (challenge: Challenge) => {
    const now = new Date()
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    return now >= start && now <= end
  }

  const getDaysRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Modern Navigation */}
      <MainNav user={user} onLogout={handleLogout} />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-5xl font-black mb-3">🎯 Reading Challenges</h1>
          <p className="text-orange-100 text-xl max-w-3xl">
            Push your reading boundaries, compete with friends, and unlock achievements! 🏆
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 font-medium shadow-lg">
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600 mb-4"></div>
            <p className="text-pink-600 font-semibold text-lg">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-pink-200 shadow-xl">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No active challenges</h3>
            <p className="text-gray-600 text-lg">Check back soon for exciting new reading challenges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const userChallenge = challenge.userChallenges?.[0]
              const isJoined = !!userChallenge
              const active = isActive(challenge)
              const daysRemaining = getDaysRemaining(challenge.endDate)

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-2xl border-2 border-pink-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  {/* Challenge Header */}
                  <div className={`p-6 text-white ${
                    userChallenge?.isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : active
                      ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-5xl">{getChallengeIcon(challenge.type)}</div>
                      {userChallenge?.isCompleted && (
                        <div className="bg-white/30 backdrop-blur-sm text-white text-sm font-black px-3 py-1.5 rounded-lg shadow-md">
                          ✓ Completed!
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-black mb-1">{challenge.name}</h3>
                    <p className="text-sm font-semibold text-white/80">{challenge.type.toUpperCase()} CHALLENGE</p>
                  </div>

                  {/* Challenge Body */}
                  <div className="p-6">
                    <p className="text-gray-700 mb-4 leading-relaxed font-medium">{challenge.description}</p>

                    {/* Target */}
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4 border border-pink-200">
                      <div className="text-sm font-bold text-pink-600 mb-1">🎯 TARGET</div>
                      <div className="text-3xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {challenge.targetValue}
                        {challenge.type === 'pages' ? ' pages' : ' books'}
                      </div>
                    </div>

                    {/* Progress (if joined) */}
                    {isJoined && userChallenge && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-800">📊 Your Progress</span>
                          <span className="text-sm font-bold text-pink-600">
                            {userChallenge.currentValue} / {challenge.targetValue}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-3 rounded-full transition-all duration-500 shadow-md"
                            style={{
                              width: `${Math.min((userChallenge.currentValue / challenge.targetValue) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs font-semibold text-gray-600 mt-1 text-right">
                          {Math.round((userChallenge.currentValue / challenge.targetValue) * 100)}% complete
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
                      <div>
                        <span className="block text-[10px] text-gray-500">STARTS</span>
                        {formatDate(challenge.startDate)}
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-500">ENDS</span>
                        {formatDate(challenge.endDate)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {active && daysRemaining > 0 && (
                      <div className="mb-4">
                        <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md">
                          🔥 {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left!
                        </span>
                      </div>
                    )}

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4 bg-indigo-50 rounded-lg p-3">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-indigo-700">{challenge._count.userChallenges} {challenge._count.userChallenges === 1 ? 'participant' : 'participants'}</span>
                    </div>

                    {/* Join/Leave Button */}
                    {user && (
                      <button
                        onClick={() => handleJoinLeave(challenge.id, isJoined)}
                        disabled={!active || userChallenge?.isCompleted}
                        className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md ${
                          isJoined
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 hover:shadow-lg'
                            : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white hover:shadow-2xl hover:scale-105'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {!active
                          ? '⏰ Challenge Ended'
                          : userChallenge?.isCompleted
                          ? '🏆 Completed!'
                          : isJoined
                          ? '👋 Leave Challenge'
                          : '🚀 Join Challenge'}
                      </button>
                    )}

                    {!user && (
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-2xl hover:scale-105"
                      >
                        🔐 Sign In to Join
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
