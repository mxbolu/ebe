'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BookClubCardProps {
  club: {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    coverImage: string | null
    createdAt: string
    createdBy: {
      id: string
      username: string
      name: string | null
      avatar: string | null
    }
    _count: {
      members: number
      books: number
      discussions: number
    }
    currentRead?: {
      book: {
        id: string
        title: string
        authors: string[]
        coverImageUrl: string | null
      }
    } | null
  }
  userMembership?: {
    role: string
  } | null
  onUpdate?: () => void
}

export default function BookClubCard({ club, userMembership, onUpdate }: BookClubCardProps) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setJoining(true)

    try {
      const response = await fetch(`/api/book-clubs/${club.id}/members`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join club')
      }

      if (onUpdate) onUpdate()
      router.push(`/clubs/${club.id}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm('Are you sure you want to leave this book club?')) {
      return
    }

    setLeaving(true)

    try {
      const response = await fetch(`/api/book-clubs/${club.id}/members`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave club')
      }

      if (onUpdate) onUpdate()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLeaving(false)
    }
  }

  const handleCardClick = () => {
    router.push(`/clubs/${club.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer overflow-hidden"
    >
      {/* Cover Image */}
      {club.coverImage ? (
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
          <img
            src={club.coverImage}
            alt={club.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{club.name}</h3>
            <p className="text-xs text-gray-500">
              by {club.createdBy.name || club.createdBy.username}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!club.isPublic && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {club.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {club.description}
          </p>
        )}

        {/* Current Read */}
        {club.currentRead && (
          <div className="mb-3 p-2 bg-indigo-50 rounded-lg">
            <p className="text-xs text-indigo-600 font-medium mb-1">Currently Reading:</p>
            <div className="flex gap-2">
              {club.currentRead.book.coverImageUrl && (
                <img
                  src={club.currentRead.book.coverImageUrl}
                  alt={club.currentRead.book.title}
                  className="w-8 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 line-clamp-1">
                  {club.currentRead.book.title}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  {club.currentRead.book.authors.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{club._count.members} members</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{club._count.books} books</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{club._count.discussions} posts</span>
          </div>
        </div>

        {/* Action Button */}
        {userMembership ? (
          <div className="flex gap-2">
            <button
              onClick={handleCardClick}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              View Club
            </button>
            {userMembership.role !== 'admin' && (
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
              >
                {leaving ? 'Leaving...' : 'Leave'}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Club'}
          </button>
        )}
      </div>
    </div>
  )
}
