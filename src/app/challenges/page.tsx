'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    progress: number
    completed: boolean
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <h1 className="text-2xl font-bold text-indigo-600">ebe</h1>
                <span className="text-sm text-gray-500">Reading Journal</span>
              </button>
              <nav className="flex space-x-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  My Books
                </button>
                <button
                  onClick={() => router.push('/clubs')}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Book Clubs
                </button>
                <span className="text-sm text-indigo-600 font-medium border-b-2 border-indigo-600 pb-1">
                  Challenges
                </span>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reading Challenges</h1>
          <p className="text-gray-600">Join challenges to push your reading boundaries and connect with other readers</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No active challenges</h3>
            <p className="mt-2 text-gray-500">Check back later for new reading challenges!</p>
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
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
                >
                  {/* Challenge Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-4xl">{getChallengeIcon(challenge.type)}</div>
                      {userChallenge?.completed && (
                        <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{challenge.name}</h3>
                    <p className="text-sm text-indigo-100">{challenge.type.toUpperCase()}</p>
                  </div>

                  {/* Challenge Body */}
                  <div className="p-6">
                    <p className="text-gray-700 mb-4 leading-relaxed">{challenge.description}</p>

                    {/* Target */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-600 mb-1">Target</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {challenge.targetValue}
                        {challenge.type === 'pages' ? ' pages' : ' books'}
                      </div>
                    </div>

                    {/* Progress (if joined) */}
                    {isJoined && userChallenge && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Your Progress</span>
                          <span className="text-sm text-gray-600">
                            {userChallenge.progress} / {challenge.targetValue}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((userChallenge.progress / challenge.targetValue) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div>
                        <span className="font-medium">Starts:</span> {formatDate(challenge.startDate)}
                      </div>
                      <div>
                        <span className="font-medium">Ends:</span> {formatDate(challenge.endDate)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {active && daysRemaining > 0 && (
                      <div className="mb-4 text-sm">
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                          🔥 {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                        </span>
                      </div>
                    )}

                    {/* Participants */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>{challenge._count.userChallenges} {challenge._count.userChallenges === 1 ? 'participant' : 'participants'}</span>
                    </div>

                    {/* Join/Leave Button */}
                    {user && (
                      <button
                        onClick={() => handleJoinLeave(challenge.id, isJoined)}
                        disabled={!active || userChallenge?.completed}
                        className={`w-full font-medium py-2 px-4 rounded-lg transition ${
                          isJoined
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {!active
                          ? 'Challenge Ended'
                          : userChallenge?.completed
                          ? 'Completed'
                          : isJoined
                          ? 'Leave Challenge'
                          : 'Join Challenge'}
                      </button>
                    )}

                    {!user && (
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Sign In to Join
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
