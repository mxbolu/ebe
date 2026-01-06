'use client'

import { useState, useEffect } from 'react'

interface WaitingRoomProps {
  bookClubId: string
  meetingId: string
  meetingTitle: string
  onAdmitted: () => void
  onRejected: () => void
}

export default function WaitingRoom({
  bookClubId,
  meetingId,
  meetingTitle,
  onAdmitted,
  onRejected,
}: WaitingRoomProps) {
  const [status, setStatus] = useState<'joining' | 'waiting' | 'error'>('joining')
  const [error, setError] = useState('')

  useEffect(() => {
    // Join the waiting room
    const joinWaitingRoom = async () => {
      try {
        const response = await fetch(
          `/api/book-clubs/${bookClubId}/meetings/${meetingId}/waiting-room/join`,
          {
            method: 'POST',
          }
        )

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to join waiting room')
          setStatus('error')
          return
        }

        if (data.status === 'admitted') {
          // User can join directly
          onAdmitted()
        } else {
          // User is in waiting room
          setStatus('waiting')
          // Start polling for admission status
          startPolling()
        }
      } catch (err) {
        setError('An error occurred. Please try again.')
        setStatus('error')
      }
    }

    joinWaitingRoom()
  }, [bookClubId, meetingId, onAdmitted])

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        // Check admission status
        const response = await fetch(
          `/api/book-clubs/${bookClubId}/meetings/${meetingId}/waiting-room/status`,
          {
            method: 'GET',
          }
        )

        const data = await response.json()

        if (data.status === 'admitted') {
          clearInterval(pollInterval)
          onAdmitted()
        } else if (data.status === 'rejected') {
          clearInterval(pollInterval)
          onRejected()
        }
      } catch (err) {
        console.error('Status check error:', err)
      }
    }, 3000) // Poll every 3 seconds

    // Clean up on unmount
    return () => clearInterval(pollInterval)
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Unable to Join</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (status === 'joining') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Joining Meeting</h2>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Waiting animation */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">You're in the Waiting Room</h2>
          <p className="text-gray-400 mb-1">Meeting: {meetingTitle}</p>
          <p className="text-sm text-gray-500">The host will let you in soon</p>
        </div>

        {/* Info section */}
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            While you wait
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Make sure your camera and microphone are working
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Check your internet connection
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              You'll be admitted automatically when approved
            </li>
          </ul>
        </div>

        {/* Pulsing dots indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
