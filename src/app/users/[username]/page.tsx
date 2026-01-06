'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  name: string | null
  avatar: string | null
  bio: string | null
  createdAt: string
  stats: {
    wantToRead: number
    currentlyReading: number
    finished: number
    didNotFinish: number
  }
  reviewCount: number
  isFollowing: boolean
  _count: {
    readingEntries: number
    followers: number
    following: number
  }
}

interface ReadingEntry {
  id: string
  status: string
  rating: number | null
  review: string | null
  book: {
    id: string
    title: string
    author: string
    coverImage: string | null
    publishedYear: number | null
  }
}

interface Review {
  id: string
  rating: number | null
  review: string | null
  createdAt: string
  helpfulCount: number
  book: {
    id: string
    title: string
    author: string
    coverImage: string | null
  }
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'books' | 'reviews'>('books')
  const [statusFilter, setStatusFilter] = useState('all')
  const [readingEntries, setReadingEntries] = useState<ReadingEntry[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchUserProfile()
  }, [username])

  useEffect(() => {
    if (activeTab === 'books') {
      fetchReadingEntries()
    } else {
      fetchReviews()
    }
  }, [activeTab, statusFilter])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${username}`)

      if (!response.ok) {
        throw new Error('User not found')
      }

      const data = await response.json()
      setUser(data.user)
      setFollowing(data.user.isFollowing)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReadingEntries = async () => {
    if (!user) return

    try {
      setLoadingContent(true)
      const response = await fetch(
        `/api/users/${username}/reading-entries?status=${statusFilter}&limit=12`
      )

      if (response.ok) {
        const data = await response.json()
        setReadingEntries(data.entries)
      }
    } catch (error) {
      console.error('Failed to fetch reading entries:', error)
    } finally {
      setLoadingContent(false)
    }
  }

  const fetchReviews = async () => {
    if (!user) return

    try {
      setLoadingContent(true)
      const response = await fetch(`/api/users/${username}/reviews?limit=10`)

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoadingContent(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: following ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        setFollowing(!following)
        fetchUserProfile() // Refresh to update follower count
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested user could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUserId === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-white font-bold text-4xl">
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.name || user.username}
                  </h1>
                  <p className="text-gray-600">@{user.username}</p>
                </div>

                {!isOwnProfile && currentUserId && (
                  <button
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      following
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {user.bio && (
                <p className="text-gray-700 mb-4">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-gray-900">{user._count.readingEntries}</span>
                  <span className="text-gray-600 ml-1">books</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{user.reviewCount}</span>
                  <span className="text-gray-600 ml-1">reviews</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{user._count.followers}</span>
                  <span className="text-gray-600 ml-1">followers</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{user._count.following}</span>
                  <span className="text-gray-600 ml-1">following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{user.stats.wantToRead}</div>
              <div className="text-sm text-gray-600">Want to Read</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{user.stats.currentlyReading}</div>
              <div className="text-sm text-gray-600">Currently Reading</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{user.stats.finished}</div>
              <div className="text-sm text-gray-600">Finished</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{user.stats.didNotFinish}</div>
              <div className="text-sm text-gray-600">Did Not Finish</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('books')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'books'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 font-medium border-b-2 transition ${
                activeTab === 'reviews'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'books' && (
          <div>
            {/* Status Filter */}
            <div className="mb-6 flex gap-2">
              {['all', 'WANT_TO_READ', 'CURRENTLY_READING', 'FINISHED', 'DID_NOT_FINISH'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>

            {/* Books Grid */}
            {loadingContent ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : readingEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No books found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {readingEntries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/books/${entry.book.id}`}
                    className="group"
                  >
                    <div className="aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden mb-2">
                      {entry.book.coverImage ? (
                        <img
                          src={entry.book.coverImage}
                          alt={entry.book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                          <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition">
                      {entry.book.title}
                    </h3>
                    <p className="text-xs text-gray-600">{entry.book.authors?.[0] || 'Unknown Author'}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {loadingContent ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex gap-4">
                      {/* Book Cover */}
                      <Link href={`/books/${review.book.id}`} className="flex-shrink-0">
                        <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden">
                          {review.book.coverImage ? (
                            <img
                              src={review.book.coverImage}
                              alt={review.book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                              <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Review Content */}
                      <div className="flex-1">
                        <Link href={`/books/${review.book.id}`} className="hover:text-indigo-600">
                          <h3 className="font-bold text-gray-900 mb-1">{review.book.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{review.book.authors?.[0] || 'Unknown Author'}</p>
                        </Link>

                        {review.rating && (
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(10)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {review.rating}/10
                            </span>
                          </div>
                        )}

                        {review.review && (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {review.review}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          <span>{review.helpfulCount} found helpful</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
