'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BookSearch from '@/components/BookSearch'
import ReadingLists from '@/components/ReadingLists'
import ActivityFeed from '@/components/ActivityFeed'
import ReadingGoalWidget from '@/components/ReadingGoalWidget'
import MainNav from '@/components/MainNav'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'search' | 'mybooks'>('mybooks')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading your books...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Modern Navigation */}
      <MainNav user={user} onLogout={handleLogout} />

      {/* Sub-navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('mybooks')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'mybooks'
                  ? 'border-indigo-500 text-indigo-600 scale-105'
                  : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-300'
              }`}
            >
              📚 My Library
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'search'
                  ? 'border-purple-500 text-purple-600 scale-105'
                  : 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300'
              }`}
            >
              ➕ Add Books
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'mybooks' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <ReadingLists />
            </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-1 space-y-6">
              <ReadingGoalWidget />
              <ActivityFeed />
            </div>
          </div>
        ) : (
          <BookSearch />
        )}
      </main>
    </div>
  )
}
