'use client'

interface SearchFiltersProps {
  filters: {
    genre?: string
    minRating?: number
    maxRating?: number
    minYear?: number
    maxYear?: number
    sortBy: 'relevance' | 'rating' | 'year' | 'title'
    sortOrder: 'asc' | 'desc'
  }
  onFilterChange: (filters: any) => void
  availableGenres?: string[]
}

export default function SearchFilters({ filters, onFilterChange, availableGenres = [] }: SearchFiltersProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters & Sort</h3>
        <button
          onClick={() => onFilterChange({
            sortBy: 'relevance',
            sortOrder: 'desc',
          })}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Clear All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Rating</option>
            <option value="year">Year Published</option>
            <option value="title">Title (A-Z)</option>
          </select>
          <button
            onClick={() => onFilterChange({
              ...filters,
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Rating
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filters.minRating || 0}
          onChange={(e) => onFilterChange({
            ...filters,
            minRating: parseFloat(e.target.value) || undefined
          })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Any</span>
          <span className="font-medium text-gray-900">
            {filters.minRating ? `${filters.minRating}+ stars` : 'No minimum'}
          </span>
        </div>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Publication Year
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              placeholder="From"
              min="1000"
              max={currentYear}
              value={filters.minYear || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                minYear: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="To"
              min="1000"
              max={currentYear}
              value={filters.maxYear || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                maxYear: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Genre Filter (if genres provided) */}
      {availableGenres.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre
          </label>
          <select
            value={filters.genre || ''}
            onChange={(e) => onFilterChange({
              ...filters,
              genre: e.target.value || undefined
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
          >
            <option value="">All Genres</option>
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active Filters */}
      {(filters.minRating || filters.minYear || filters.maxYear || filters.genre) && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.minRating && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                Rating {filters.minRating}+
                <button
                  onClick={() => onFilterChange({ ...filters, minRating: undefined })}
                  className="hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.minYear || filters.maxYear) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                {filters.minYear || '?'} - {filters.maxYear || currentYear}
                <button
                  onClick={() => onFilterChange({ ...filters, minYear: undefined, maxYear: undefined })}
                  className="hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.genre && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">
                {filters.genre}
                <button
                  onClick={() => onFilterChange({ ...filters, genre: undefined })}
                  className="hover:text-indigo-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
