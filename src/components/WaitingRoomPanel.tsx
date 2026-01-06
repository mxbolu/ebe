'use client'

import { useState, useEffect } from 'react'

interface Participant {
  id: string
  userId: string
  status: string
  joinedAt: string
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

interface WaitingRoomPanelProps {
  bookClubId: string
  meetingId: string
}

export default function WaitingRoomPanel({ bookClubId, meetingId }: WaitingRoomPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParticipants()

    // Poll for new participants every 3 seconds
    const interval = setInterval(fetchParticipants, 3000)
    return () => clearInterval(interval)
  }, [bookClubId, meetingId])

  const fetchParticipants = async () => {
    try {
      const response = await fetch(
        `/api/book-clubs/${bookClubId}/meetings/${meetingId}/waiting-room/participants`
      )

      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error('Fetch participants error:', error)
    } finally {
      setLoading(false)
    }
  }

  const admitParticipant = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/book-clubs/${bookClubId}/meetings/${meetingId}/waiting-room/admit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      )

      if (response.ok) {
        // Remove from list
        setParticipants((prev) => prev.filter((p) => p.userId !== userId))
      }
    } catch (error) {
      console.error('Admit participant error:', error)
    }
  }

  const rejectParticipant = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/book-clubs/${bookClubId}/meetings/${meetingId}/waiting-room/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      )

      if (response.ok) {
        // Remove from list
        setParticipants((prev) => prev.filter((p) => p.userId !== userId))
      }
    } catch (error) {
      console.error('Reject participant error:', error)
    }
  }

  const admitAll = async () => {
    for (const participant of participants) {
      await admitParticipant(participant.userId)
    }
  }

  if (participants.length === 0) {
    return null // Don't show panel if no one is waiting
  }

  return (
    <div className="fixed bottom-20 right-4 bg-gray-800 border-2 border-indigo-600 rounded-xl shadow-2xl p-4 max-w-sm w-full z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          <h3 className="text-white font-bold">Waiting Room ({participants.length})</h3>
        </div>
        {participants.length > 1 && (
          <button
            onClick={admitAll}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition"
          >
            Admit All
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {participant.user.avatar ? (
                <img
                  src={participant.user.avatar}
                  alt={participant.user.name || participant.user.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {(participant.user.name || participant.user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {participant.user.name || participant.user.username}
                </p>
                <p className="text-gray-400 text-xs truncate">@{participant.user.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={() => admitParticipant(participant.userId)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition"
                title="Admit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => rejectParticipant(participant.userId)}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                title="Reject"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
