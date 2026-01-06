'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import MainNav from '@/components/MainNav'

interface Book {
  id?: string
  title: string
  authors: string[]
  coverImageUrl?: string
  publishedYear?: number
  genres?: string[]
  pageCount?: number
  averageRating?: number
  totalRatings?: number
  description?: string
  source: string
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [genres, setGenres] = useState<Array<{ name: string; count: number }>>([])
  const [searchHistory, setSearchHistory] = useState<Array<{
    id: string
    query: string
    filters: any
    resultCount: number
    createdAt: string
  }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [autocomplete, setAutocomplete] = useState<Array<{
    id: string
    title: string
    authors: string[]
    coverImageUrl?: string
    publishedYear?: number
    averageRating?: number
    matchType: 'title' | 'author'
    matchText: string
  }>>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteLoading, setAutocompleteLoading] = useState(false)
  const [filters, setFilters] = useState({
    genre: '',
    minYear: '',
    maxYear: '',
    minRating: '',
    sortBy: 'relevance',
  })

  useEffect(() => {
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

    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/books/genres')
        if (response.ok) {
          const data = await response.json()
          setGenres(data.genres)
        }
      } catch (error) {
        console.error('Fetch genres failed:', error)
      }
    }

    const fetchSearchHistory = async () => {
      try {
        const response = await fetch('/api/search-history?limit=10')
        if (response.ok) {
          const data = await response.json()
          setSearchHistory(data.searches)
        }
      } catch (error) {
        console.error('Fetch search history failed:', error)
      }
    }

    checkAuth()
    fetchGenres()
    fetchSearchHistory()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Debounced autocomplete fetch
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (query.trim().length < 2) {
        setAutocomplete([])
        setShowAutocomplete(false)
        return
      }

      try {
        setAutocompleteLoading(true)
        const response = await fetch(
          `/api/books/autocomplete?q=${encodeURIComponent(query)}`
        )

        if (response.ok) {
          const data = await response.json()
          setAutocomplete(data.suggestions)
          setShowAutocomplete(data.suggestions.length > 0)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
      } finally {
        setAutocompleteLoading(false)
      }
    }

    // Debounce autocomplete requests
    const timer = setTimeout(fetchAutocomplete, 300)
    return () => clearTimeout(timer)
  }, [query])

  const fetchBooks = useCallback(async (searchQuery: string, pageNum: number = 1, resetResults: boolean = true) => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20',
        offset: ((pageNum - 1) * 20).toString(),
        sortBy: filters.sortBy,
      })

      if (filters.genre) params.append('genre', filters.genre)
      if (filters.minYear) params.append('minYear', filters.minYear)
      if (filters.maxYear) params.append('maxYear', filters.maxYear)
      if (filters.minRating) params.append('minRating', filters.minRating)

      const response = await fetch(`/api/books/search?${params}`)

      if (response.ok) {
        const data = await response.json()
        if (resetResults) {
          setBooks(data.results)

          // Save to search history (only for new searches, not pagination)
          if (user && pageNum === 1) {
            try {
              await fetch('/api/search-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: searchQuery,
                  filters: {
                    genre: filters.genre || undefined,
                    minYear: filters.minYear || undefined,
                    maxYear: filters.maxYear || undefined,
                    minRating: filters.minRating || undefined,
                    sortBy: filters.sortBy,
                  },
                  resultCount: data.results.length,
                }),
              })

              // Refresh search history
              const historyResponse = await fetch('/api/search-history?limit=10')
              if (historyResponse.ok) {
                const historyData = await historyResponse.json()
                setSearchHistory(historyData.searches)
              }
            } catch (error) {
              console.error('Failed to save search history:', error)
            }
          }
        } else {
          setBooks((prev) => [...prev, ...data.results])
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, user])

  useEffect(() => {
    const initialQuery = searchParams.get('q')
    if (initialQuery) {
      setQuery(initialQuery)
      fetchBooks(initialQuery, 1, true)
    }
  }, [searchParams, fetchBooks])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-history-container')) {
        setShowHistory(false)
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      fetchBooks(query, 1, true)
    }
  }

  const handleFilterChange = () => {
    if (query.trim()) {
      fetchBooks(query, 1, true)
    }
  }

  const applyHistoricalSearch = (search: typeof searchHistory[0]) => {
    setQuery(search.query)
    if (search.filters) {
      setFilters({
        genre: search.filters.genre || '',
        minYear: search.filters.minYear || '',
        maxYear: search.filters.maxYear || '',
        minRating: search.filters.minRating || '',
        sortBy: search.filters.sortBy || 'relevance',
      })
    }
    setShowHistory(false)
    // Trigger search after state updates
    setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(search.query)}`)
    }, 100)
  }

  return (
    <>
      <MainNav user={user} onLogout={handleLogout} />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Header */}
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
            <h1 className="text-5xl font-black mb-3">🔍 Discover Books</h1>
            <p className="text-emerald-100 text-lg mb-6">Find your next great read from millions of books!</p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3 relative">
              <div className="flex-1 relative search-history-container">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowHistory(false) // Hide history when typing
                  }}
                  onFocus={() => {
                    if (!query.trim()) {
                      setShowHistory(true)
                      setShowAutocomplete(false)
                    }
                  }}
                  placeholder="Search by title, author, or ISBN..."
                  className="w-full px-6 py-4 border-2 border-white/30 bg-white/20 backdrop-blur-sm rounded-xl focus:ring-4 focus:ring-white/50 focus:border-white text-white placeholder-white/70 outline-none text-lg font-medium"
                />

                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && user && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-white/50 overflow-hidden z-50 max-h-80 overflow-y-auto">
                    <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-between">
                      <span className="text-white font-bold text-sm">Recent Searches</span>
                      <button
                        type="button"
                        onClick={() => setShowHistory(false)}
                        className="text-white/80 hover:text-white text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {searchHistory.map((search) => (
                        <button
                          key={search.id}
                          type="button"
                          onClick={() => applyHistoricalSearch(search)}
                          className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-gray-900 font-medium group-hover:text-teal-600">
                                {search.query}
                              </div>
                              {search.filters && Object.values(search.filters).some(v => v) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {search.filters.genre && `Genre: ${search.filters.genre} • `}
                                  {search.filters.minYear && `Year: ${search.filters.minYear}+ • `}
                                  {search.filters.minRating && `Rating: ${search.filters.minRating}+ • `}
                                  Sort: {search.filters.sortBy || 'relevance'}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 ml-3">
                              {search.resultCount} results
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocomplete.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border-2 border-white/50 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-between">
                      <span className="text-white font-bold text-sm">Suggestions</span>
                      <button
                        type="button"
                        onClick={() => setShowAutocomplete(false)}
                        className="text-white/80 hover:text-white text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {autocomplete.map((suggestion) => (
                        <Link
                          key={suggestion.id}
                          href={`/books/${suggestion.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors group"
                          onClick={() => setShowAutocomplete(false)}
                        >
                          {suggestion.coverImageUrl ? (
                            <img
                              src={suggestion.coverImageUrl}
                              alt={suggestion.title}
                              className="w-12 h-16 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center">
                              <svg className="w-6 h-6 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-900 font-medium group-hover:text-purple-600 truncate">
                              {suggestion.title}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {suggestion.matchType === 'author' ? (
                                <span className="text-purple-600 font-medium">{suggestion.matchText}</span>
                              ) : (
                                suggestion.authors.join(', ')
                              )}
                            </div>
                            {suggestion.publishedYear && (
                              <div className="text-xs text-gray-500">
                                {suggestion.publishedYear}
                                {suggestion.averageRating && (
                                  <span className="ml-2">
                                    ⭐ {suggestion.averageRating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 uppercase font-medium px-2 py-1 bg-purple-100 rounded">
                            {suggestion.matchType === 'title' ? 'Title' : 'Author'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-white text-teal-600 hover:bg-cyan-50 font-bold px-10 py-4 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-xl hover:shadow-2xl hover:scale-105"
              >
                {loading ? '🔄 Searching...' : '🔍 Search'}
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-bold text-white/90 mb-1.5">📚 Genre</label>
              <select
                value={filters.genre}
                onChange={(e) => {
                  setFilters({ ...filters, genre: e.target.value })
                  if (query.trim()) {
                    setTimeout(() => fetchBooks(query, 1, true), 100)
                  }
                }}
                className="w-full px-4 py-2.5 border border-white/20 bg-white/20 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-white/50 text-white outline-none font-medium"
              >
                <option value="" className="text-gray-900">All Genres</option>
                {genres.slice(0, 50).map((genre) => (
                  <option key={genre.name} value={genre.name} className="text-gray-900">
                    {genre.name} ({genre.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-1.5">📅 Min Year</label>
              <input
                type="number"
                value={filters.minYear}
                onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                onBlur={handleFilterChange}
                placeholder="e.g., 2000"
                className="w-full px-4 py-2.5 border border-white/20 bg-white/20 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-1.5">⭐ Min Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                onBlur={handleFilterChange}
                placeholder="e.g., 7.0"
                className="w-full px-4 py-2.5 border border-white/20 bg-white/20 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-white/50 text-white placeholder-white/60 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/90 mb-1.5">🔢 Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters({ ...filters, sortBy: e.target.value })
                  handleFilterChange()
                }}
                className="w-full px-4 py-2.5 border border-white/20 bg-white/20 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-white/50 text-white outline-none font-medium"
              >
                <option value="relevance" className="text-gray-900">Relevance</option>
                <option value="rating" className="text-gray-900">Rating</option>
                <option value="year" className="text-gray-900">Year</option>
                <option value="title" className="text-gray-900">Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {query && !loading && books.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-teal-200 p-16 text-center shadow-xl">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No books found</h3>
            <p className="text-gray-600 text-lg">Try adjusting your search or filters</p>
          </div>
        )}

        {books.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-teal-700 font-semibold text-lg">Found {books.length} results</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {books.map((book, index) => (
                <BookCard key={book.id || `${book.title}-${index}`} book={book} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => fetchBooks(query, page + 1, false)}
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-2xl hover:scale-105"
                >
                  {loading ? '🔄 Loading...' : '📚 Load More Books'}
                </button>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-teal-200 p-16 text-center shadow-xl">
            <div className="text-7xl mb-4">🔍</div>
            <h3 className="text-3xl font-black text-gray-900 mb-3">Search for books</h3>
            <p className="text-gray-600 text-lg">Enter a title, author, or ISBN to discover amazing books!</p>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition">
      {book.coverImageUrl ? (
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-64 object-cover"
        />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <svg className="w-16 h-16 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2">
          {book.authors.join(', ')}
        </p>
        {book.publishedYear && (
          <p className="text-xs text-gray-500 mb-2">{book.publishedYear}</p>
        )}
        {book.averageRating && (
          <div className="flex items-center gap-1 mb-3">
            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm text-gray-700">{book.averageRating.toFixed(1)}</span>
            {book.totalRatings && (
              <span className="text-xs text-gray-500">({book.totalRatings})</span>
            )}
          </div>
        )}
        {book.id ? (
          <Link
            href={`/books/${book.id}`}
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition"
          >
            View Details
          </Link>
        ) : (
          <button
            onClick={() => alert('This book needs to be added to the database first')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
          >
            Add to Database
          </button>
        )}
      </div>
    </div>
  )
}
