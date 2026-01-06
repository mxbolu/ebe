'use client'

import { useState, useEffect, useRef } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng'

interface VideoRoomProps {
  appId: string
  channelName: string
  token: string
  uid: number
  bookClubId?: string
  meetingId?: string
  isAdminOrModerator?: boolean
  onLeave: () => void
}

interface ChatMessage {
  id: string
  userId: number
  username: string
  message: string
  timestamp: Date
}

export default function VideoRoom({
  appId,
  channelName,
  token,
  uid,
  bookClubId,
  meetingId,
  isAdminOrModerator = false,
  onLeave
}: VideoRoomProps) {
  const [joined, setJoined] = useState(false)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSession, setRecordingSession] = useState<{
    resourceId: string
    sid: string
    channelName: string
    uid: number
  } | null>(null)

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const screenVideoRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Agora client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    // Event handlers
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)

      if (mediaType === 'video') {
        setRemoteUsers((prev) => {
          if (prev.find((u) => u.uid === user.uid)) {
            return prev
          }
          return [...prev, user]
        })
      }

      if (mediaType === 'audio') {
        user.audioTrack?.play()
      }
    })

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
      }
    })

    client.on('user-left', (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
    })

    // Join channel and publish
    const join = async () => {
      try {
        await client.join(appId, channelName, token, uid)

        const [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ])

        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        await client.publish([audioTrack, videoTrack])
        setJoined(true)
      } catch (error) {
        console.error('Failed to join channel:', error)
      }
    }

    join()

    // Cleanup
    return () => {
      const leave = async () => {
        if (localAudioTrack) {
          localAudioTrack.close()
        }
        if (localVideoTrack) {
          localVideoTrack.close()
        }
        if (screenTrack) {
          screenTrack.close()
        }
        if (client) {
          await client.leave()
        }
      }
      leave()
    }
  }, [appId, channelName, token, uid])

  // Play remote videos when they change
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        const element = document.getElementById(`remote-${user.uid}`)
        if (element) {
          user.videoTrack.play(element)
        }
      }
    })
  }, [remoteUsers])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const toggleMic = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setMuted(!micMuted)
      setMicMuted(!micMuted)
    }
  }

  const toggleCamera = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(cameraOff)
      setCameraOff(!cameraOff)
    }
  }

  const toggleScreenShare = async () => {
    const client = clientRef.current
    if (!client) return

    try {
      if (isScreenSharing && screenTrack) {
        // Stop screen sharing
        await client.unpublish([screenTrack])
        screenTrack.close()
        setScreenTrack(null)
        setIsScreenSharing(false)

        // Re-publish camera if it was on
        if (localVideoTrack && !cameraOff) {
          await client.publish([localVideoTrack])
        }
      } else {
        // Start screen sharing
        const screen = await AgoraRTC.createScreenVideoTrack({})

        // Unpublish camera
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack])
        }

        // Publish screen
        await client.publish([screen as ILocalVideoTrack])
        setScreenTrack(screen as ILocalVideoTrack)
        setIsScreenSharing(true)

        // Play screen locally
        if (screenVideoRef.current) {
          (screen as ILocalVideoTrack).play(screenVideoRef.current)
        }

        // Handle screen share ended (user clicked browser's "Stop sharing" button)
        ;(screen as ILocalVideoTrack).on('track-ended', async () => {
          await client.unpublish([screen as ILocalVideoTrack])
          ;(screen as ILocalVideoTrack).close()
          setScreenTrack(null)
          setIsScreenSharing(false)

          // Re-publish camera
          if (localVideoTrack && !cameraOff) {
            await client.publish([localVideoTrack])
          }
        })
      }
    } catch (error) {
      console.error('Screen sharing error:', error)
      setIsScreenSharing(false)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: uid,
      username: 'You',
      message: newMessage.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, message])
    setNewMessage('')
  }

  const toggleRecording = async () => {
    if (!bookClubId || !meetingId) {
      console.error('Missing bookClubId or meetingId')
      return
    }

    try {
      if (isRecording && recordingSession) {
        // Stop recording
        const response = await fetch(
          `/api/book-clubs/${bookClubId}/meetings/${meetingId}/recording/stop`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordingSession),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to stop recording')
        }

        setIsRecording(false)
        setRecordingSession(null)
      } else {
        // Start recording
        const response = await fetch(
          `/api/book-clubs/${bookClubId}/meetings/${meetingId}/recording/start`,
          {
            method: 'POST',
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to start recording')
        }

        const data = await response.json()
        setIsRecording(true)
        setRecordingSession(data.recordingSession)
      }
    } catch (error) {
      console.error('Recording error:', error)
      alert(error instanceof Error ? error.message : 'Failed to toggle recording')
    }
  }

  const handleLeave = async () => {
    if (localAudioTrack) {
      localAudioTrack.close()
    }
    if (localVideoTrack) {
      localVideoTrack.close()
    }
    if (screenTrack) {
      screenTrack.close()
    }
    if (clientRef.current) {
      await clientRef.current.leave()
    }
    onLeave()
  }

  return (
    <div className="flex h-full bg-gray-900">
      {/* Video Grid */}
      <div className={`flex-1 flex flex-col ${showChat ? 'lg:w-3/4' : 'w-full'}`}>
        {/* Recording Indicator */}
        {isRecording && (
          <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="font-medium text-sm sm:text-base">Recording in progress</span>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-4 overflow-y-auto">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden aspect-video">
            {isScreenSharing ? (
              <div ref={screenVideoRef} className="w-full h-full" />
            ) : (
              <div ref={localVideoRef} className="w-full h-full" />
            )}
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
              <p className="text-white text-xs sm:text-sm font-medium">
                {isScreenSharing ? 'Your Screen' : 'You'}
              </p>
            </div>
            {cameraOff && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl sm:text-3xl font-bold">U</span>
                </div>
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden aspect-video"
            >
              <div id={`remote-${user.uid}`} className="w-full h-full" />
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-black/70 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                <p className="text-white text-xs sm:text-sm font-medium">User {user.uid}</p>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {remoteUsers.length === 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm sm:text-base font-medium">Waiting for others to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 border-t border-gray-700 p-3 sm:p-4">
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4">
            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              className={`p-3 sm:p-4 rounded-full transition-all duration-200 min-touch-target ${
                micMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={micMuted ? 'Unmute' : 'Mute'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {micMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                )}
              </svg>
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`p-3 sm:p-4 rounded-full transition-all duration-200 min-touch-target ${
                cameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={cameraOff ? 'Turn on camera' : 'Turn off camera'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 sm:p-4 rounded-full transition-all duration-200 min-touch-target ${
                isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 sm:p-4 rounded-full transition-all duration-200 min-touch-target ${
                showChat ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title="Toggle chat"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>

            {/* Recording Toggle (Admin/Moderator only) */}
            {isAdminOrModerator && bookClubId && meetingId && (
              <button
                onClick={toggleRecording}
                className={`p-3 sm:p-4 rounded-full transition-all duration-200 min-touch-target ${
                  isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" strokeWidth={2} />
                </svg>
              </button>
            )}

            {/* Leave Button */}
            <button
              onClick={handleLeave}
              className="bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-full transition-all duration-200 flex items-center space-x-2 min-touch-target"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-white font-medium text-sm sm:text-base">Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-full lg:w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-bold text-lg">Meeting Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-indigo-400 font-medium text-sm">{msg.username}</span>
                  <span className="text-gray-400 text-xs">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-white text-sm">{msg.message}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg transition text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
