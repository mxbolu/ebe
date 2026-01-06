'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BookClubCard from '@/components/BookClubCard'
import CreateBookClubModal from '@/components/CreateBookClubModal'
import MainNav from '@/components/MainNav'
import PageHeader from '@/components/PageHeader'

export default function BookClubsPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'public' | 'my-clubs' | 'joined'>('public')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    fetchClubs()
  }, [filter, search])

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

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter) params.append('filter', filter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/book-clubs?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch book clubs')
      }

      const data = await response.json()
      setClubs(data.clubs || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <MainNav user={user} onLogout={handleLogout} />

      <PageHeader
        title="Book Clubs"
        description="Connect with readers, discuss amazing books together!"
        icon="👥"
        gradient="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600"
        actions={
          user ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-indigo-600 hover:bg-cyan-50 font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 text-sm sm:text-base whitespace-nowrap"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Create Club</span>
              <span className="sm:hidden">Create</span>
            </button>
          ) : null
        }
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search book clubs..."
              className="w-full px-4 py-3 sm:py-4 pl-10 sm:pl-12 border-2 border-indigo-200 bg-white rounded-lg sm:rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 text-gray-900 placeholder-gray-500 outline-none transition-all duration-200 shadow-sm"
            />
            <svg
              className="absolute left-3 sm:left-4 top-3 sm:top-4 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setFilter('public')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
              filter === 'public'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
            }`}
          >
            🌟 Discover
          </button>
          {user && (
            <>
              <button
                onClick={() => setFilter('joined')}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                  filter === 'joined'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                💙 My Clubs
              </button>
              <button
                onClick={() => setFilter('my-clubs')}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                  filter === 'my-clubs'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                ✨ Created by Me
              </button>
            </>
          )}
        </div>
        {/* Error */}
        {error && (
          <div className="bg-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 font-medium shadow-lg">
            ❌ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p className="text-indigo-600 font-semibold text-lg">Loading book clubs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && clubs.length === 0 && (
          <div className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-indigo-200 shadow-xl">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No book clubs found</h3>
            <p className="text-gray-600 text-lg mb-6">
              {filter === 'public' && search
                ? 'Try a different search term'
                : filter === 'public'
                ? 'Be the first to create an amazing book club!'
                : filter === 'joined'
                ? "You haven't joined any book clubs yet"
                : "You haven't created any book clubs yet"}
            </p>
            {user && filter === 'public' && !search && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-2xl hover:scale-105"
              >
                🚀 Create Your First Club
              </button>
            )}
          </div>
        )}

        {/* Clubs Grid */}
        {!loading && clubs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clubs.map((club) => (
              <BookClubCard
                key={club.id}
                club={club}
                userMembership={club.members?.find((m: any) => m.userId === user?.id)}
                onUpdate={fetchClubs}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateBookClubModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchClubs}
      />
    </div>
  )
}
