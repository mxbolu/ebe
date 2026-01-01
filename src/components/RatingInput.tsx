'use client'

import { useState } from 'react'

interface RatingInputProps {
  value: number | null
  onChange: (rating: number | null) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
}

export default function RatingInput({
  value,
  onChange,
  min = 1.0,
  max = 10.0,
  step = 0.5,
  label = 'Rating',
  showValue = true,
}: RatingInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '')

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
    setInputValue(newValue.toFixed(1))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate and update
    if (newValue === '') {
      onChange(null)
      return
    }

    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // Ensure value is formatted correctly on blur
    if (value !== null) {
      setInputValue(value.toFixed(1))
    }
  }

  const clearRating = () => {
    onChange(null)
    setInputValue('')
  }

  // Generate star display (convert 10-point scale to 5 stars)
  const getStarDisplay = () => {
    if (value === null) return []
    const starValue = value / 2 // Convert 10-point to 5-star
    const stars = []

    for (let i = 1; i <= 5; i++) {
      if (starValue >= i) {
        stars.push('full')
      } else if (starValue >= i - 0.5) {
        stars.push('half')
      } else {
        stars.push('empty')
      }
    }

    return stars
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {value !== null && showValue && (
          <span className="ml-2 text-indigo-600 font-bold">{value.toFixed(1)}/10</span>
        )}
      </label>

      {/* Star Visual Display */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {getStarDisplay().map((type, idx) => (
            <svg
              key={idx}
              className={`w-6 h-6 ${
                type === 'full'
                  ? 'text-yellow-400 fill-yellow-400'
                  : type === 'half'
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-300'
              }`}
              viewBox="0 0 20 20"
            >
              {type === 'half' ? (
                <>
                  <defs>
                    <linearGradient id={`half-${idx}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#D1D5DB" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${idx})`}
                    d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                  />
                </>
              ) : (
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              )}
            </svg>
          ))}
        </div>
        {value !== null && (
          <button
            type="button"
            onClick={clearRating}
            className="text-xs text-gray-500 hover:text-red-600 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value || min}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="--"
          className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Quick Rating Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[1.0, 2.5, 5.0, 7.5, 10.0].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => {
              onChange(rating)
              setInputValue(rating.toFixed(1))
            }}
            className={`px-3 py-1 text-xs rounded-full transition ${
              value === rating
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {rating.toFixed(1)}
          </button>
        ))}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Rate from {min.toFixed(1)} (lowest) to {max.toFixed(1)} (highest)
      </p>
    </div>
  )
}
