'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Activity {
  id: string
  type: string
  data: any
  createdAt: string
  user: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/activity/feed?page=${pageNum}&limit=20`)

      if (response.ok) {
        const data = await response.json()
        if (pageNum === 1) {
          setActivities(data.activities)
        } else {
          setActivities((prev) => [...prev, ...data.activities])
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'finished_book':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        )
      case 'started_book':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        )
      case 'reviewed_book':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )
      case 'followed_user':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )
    }
  }

  const renderActivity = (activity: Activity) => {
    const { type, data, user: activityUser } = activity

    switch (type) {
      case 'finished_book':
        return (
          <div className="flex items-start gap-4">
            {getActivityIcon(type)}
            <div className="flex-1">
              <p className="text-gray-900">
                <Link href={`/users/${activityUser.username}`} className="font-semibold hover:text-indigo-600">
                  {activityUser.name || activityUser.username}
                </Link>
                {' finished reading '}
                <Link href={`/books/${data.bookId}`} className="font-semibold hover:text-indigo-600">
                  {data.bookTitle}
                </Link>
              </p>
              <p className="text-sm text-gray-500">{formatTime(activity.createdAt)}</p>
            </div>
          </div>
        )

      case 'started_book':
        return (
          <div className="flex items-start gap-4">
            {getActivityIcon(type)}
            <div className="flex-1">
              <p className="text-gray-900">
                <Link href={`/users/${activityUser.username}`} className="font-semibold hover:text-indigo-600">
                  {activityUser.name || activityUser.username}
                </Link>
                {' started reading '}
                <Link href={`/books/${data.bookId}`} className="font-semibold hover:text-indigo-600">
                  {data.bookTitle}
                </Link>
              </p>
              <p className="text-sm text-gray-500">{formatTime(activity.createdAt)}</p>
            </div>
          </div>
        )

      case 'reviewed_book':
        return (
          <div className="flex items-start gap-4">
            {getActivityIcon(type)}
            <div className="flex-1">
              <p className="text-gray-900">
                <Link href={`/users/${activityUser.username}`} className="font-semibold hover:text-indigo-600">
                  {activityUser.name || activityUser.username}
                </Link>
                {' reviewed '}
                <Link href={`/books/${data.bookId}`} className="font-semibold hover:text-indigo-600">
                  {data.bookTitle}
                </Link>
              </p>
              {data.rating && (
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(10)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3 h-3 ${
                        i < data.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">{data.rating}/10</span>
                </div>
              )}
              {data.review && (
                <p className="text-gray-700 mt-2 line-clamp-2">{data.review}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{formatTime(activity.createdAt)}</p>
            </div>
          </div>
        )

      case 'followed_user':
        return (
          <div className="flex items-start gap-4">
            {getActivityIcon(type)}
            <div className="flex-1">
              <p className="text-gray-900">
                <Link href={`/users/${activityUser.username}`} className="font-semibold hover:text-indigo-600">
                  {activityUser.name || activityUser.username}
                </Link>
                {' followed '}
                <Link href={`/users/${data.followedUsername}`} className="font-semibold hover:text-indigo-600">
                  {data.followedName || data.followedUsername}
                </Link>
              </p>
              <p className="text-sm text-gray-500">{formatTime(activity.createdAt)}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Feed</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Feed</h2>
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
          <p className="text-sm">Follow other readers to see their reading activity here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Activity Feed</h2>
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
            {renderActivity(activity)}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchActivities(page + 1)}
          disabled={loading}
          className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
