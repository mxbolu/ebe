'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ScheduleMeetingModal from '@/components/ScheduleMeetingModal'
import VideoRoom from '@/components/VideoRoom'

export default function BookClubPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [club, setClub] = useState<any>(null)
  const [userMembership, setUserMembership] = useState<any>(null)
  const [discussions, setDiscussions] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [activeTab, setActiveTab] = useState<'discussions' | 'books' | 'members' | 'meetings'>('discussions')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchClub()
      fetchDiscussions()
      fetchMeetings()
    }
  }, [id])

  const fetchClub = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/book-clubs/${id}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch book club')
      }

      const data = await response.json()
      setClub(data.bookClub)
      setUserMembership(data.userMembership)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${id}/discussions`)

      if (!response.ok) return

      const data = await response.json()
      setDiscussions(data.discussions || [])
    } catch (err) {
      console.error('Failed to fetch discussions:', err)
    }
  }

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${id}/meetings`)

      if (!response.ok) return

      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (err) {
      console.error('Failed to fetch meetings:', err)
    }
  }

  const handleJoinMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/book-clubs/${id}/meetings/${meetingId}/join`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join meeting')
      }

      const data = await response.json()
      setActiveMeeting({
        meetingId,
        ...data,
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleLeaveMeeting = () => {
    setActiveMeeting(null)
    fetchMeetings()
  }

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setPosting(true)
    try {
      const response = await fetch(`/api/book-clubs/${id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post discussion')
      }

      setNewMessage('')
      fetchDiscussions()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPosting(false)
    }
  }

  const handleJoinClub = async () => {
    try {
      const response = await fetch(`/api/book-clubs/${id}/members`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join club')
      }

      fetchClub()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleLeaveClub = async () => {
    if (!confirm('Are you sure you want to leave this book club?')) return

    try {
      const response = await fetch(`/api/book-clubs/${id}/members`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave club')
      }

      router.push('/clubs')
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading book club...</p>
        </div>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Book Club Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This book club does not exist or you do not have access to it.'}</p>
          <button
            onClick={() => router.push('/clubs')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
          >
            Browse Book Clubs
          </button>
        </div>
      </div>
    )
  }

  const isMember = !!userMembership
  const isAdmin = userMembership?.role === 'admin'

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
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Book Clubs
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Header with Cover */}
      <div className="bg-white border-b border-gray-200">
        {club.coverImage ? (
          <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
            <img
              src={club.coverImage}
              alt={club.name}
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
        )}

        <div className="max-w-7xl mx-auto px-4 -mt-16">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{club.name}</h1>
                  {!club.isPublic && (
                    <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{club.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
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
                    <span>Created by {club.createdBy.name || club.createdBy.username}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isMember ? (
                  <button
                    onClick={handleJoinClub}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Join Club
                  </button>
                ) : !isAdmin ? (
                  <button
                    onClick={handleLeaveClub}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-6 rounded-lg transition border border-red-200"
                  >
                    Leave Club
                  </button>
                ) : null}
              </div>
            </div>

            {/* Current Read */}
            {club.currentRead && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-sm font-medium text-indigo-900 mb-2">📚 Currently Reading:</p>
                <div className="flex gap-3">
                  {club.currentRead.book.coverImageUrl && (
                    <img
                      src={club.currentRead.book.coverImageUrl}
                      alt={club.currentRead.book.title}
                      className="w-12 h-16 object-cover rounded shadow"
                    />
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900">{club.currentRead.book.title}</h4>
                    <p className="text-sm text-gray-700">{club.currentRead.book.authors.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('discussions')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'discussions'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Discussions ({club._count.discussions})
              </button>
              <button
                onClick={() => setActiveTab('books')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'books'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Books ({club._count.books})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'members'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Members ({club._count.members})
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`flex-1 py-4 px-6 font-medium transition ${
                  activeTab === 'meetings'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Meetings
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Discussions Tab */}
            {activeTab === 'discussions' && (
              <div>
                {isMember && (
                  <form onSubmit={handlePostDiscussion} className="mb-6">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                      placeholder="Share your thoughts with the club..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none mb-2"
                    />
                    <button
                      type="submit"
                      disabled={posting || !newMessage.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {posting ? 'Posting...' : 'Post'}
                    </button>
                  </form>
                )}

                <div className="space-y-4">
                  {discussions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No discussions yet. Be the first to start one!</p>
                    </div>
                  ) : (
                    discussions.map((discussion) => (
                      <div key={discussion.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-indigo-600 font-bold">
                              {(discussion.user.name || discussion.user.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {discussion.user.name || discussion.user.username}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(discussion.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{discussion.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Books Tab */}
            {activeTab === 'books' && (
              <div>
                {club.books.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No books added yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {club.books.map((clubBook: any) => (
                      <div key={clubBook.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          {clubBook.book.coverImageUrl && (
                            <img
                              src={clubBook.book.coverImageUrl}
                              alt={clubBook.book.title}
                              className="w-16 h-24 object-cover rounded shadow"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 line-clamp-2 mb-1">
                              {clubBook.book.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                              {clubBook.book.authors.join(', ')}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              clubBook.status === 'current'
                                ? 'bg-green-100 text-green-700'
                                : clubBook.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {clubBook.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {club.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 font-bold text-lg">
                          {(member.user.name || member.user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {member.user.name || member.user.username}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.role === 'admin' ? '👑 Admin' : member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div>
                {isMember && (userMembership.role === 'admin' || userMembership.role === 'moderator') && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition"
                    >
                      📅 Schedule Meeting
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {meetings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No meetings scheduled yet.</p>
                    </div>
                  ) : (
                    meetings.map((meeting) => {
                      const meetingDate = new Date(meeting.scheduledAt)
                      const isPast = meetingDate < new Date()
                      const isToday = meetingDate.toDateString() === new Date().toDateString()
                      const isSoon = !isPast && meetingDate.getTime() - Date.now() < 3600000 // Within 1 hour

                      return (
                        <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">{meeting.title}</h3>
                                {isSoon && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium">
                                    Starting Soon
                                  </span>
                                )}
                                {isPast && (
                                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    Ended
                                  </span>
                                )}
                              </div>
                              {meeting.description && (
                                <p className="text-gray-600 mb-3">{meeting.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{meetingDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>{meeting.duration} minutes</span>
                                </div>
                              </div>
                            </div>
                            {isMember && !isPast && (
                              <button
                                onClick={() => handleJoinMeeting(meeting.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition whitespace-nowrap"
                              >
                                🎥 Join
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        bookClubId={id}
        onScheduled={fetchMeetings}
      />

      {activeMeeting && (
        <div className="fixed inset-0 z-50 bg-black">
          <VideoRoom
            appId={activeMeeting.appId}
            channelName={activeMeeting.channelName}
            token={activeMeeting.token}
            uid={activeMeeting.uid}
            onLeave={handleLeaveMeeting}
          />
        </div>
      )}
    </div>
  )
}
