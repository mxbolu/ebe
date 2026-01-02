'use client'

import { useState } from 'react'

interface HelpfulButtonProps {
  reviewId: string
  initialCount: number
  initialIsHelpful?: boolean
  onUpdate?: (count: number, isHelpful: boolean) => void
}

export default function HelpfulButton({
  reviewId,
  initialCount,
  initialIsHelpful = false,
  onUpdate,
}: HelpfulButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [isHelpful, setIsHelpful] = useState(initialIsHelpful)
  const [loading, setLoading] = useState(false)

  const toggleHelpful = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: isHelpful ? 'DELETE' : 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setCount(data.helpfulCount)
        setIsHelpful(!isHelpful)
        onUpdate?.(data.helpfulCount, !isHelpful)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to mark review as helpful')
      }
    } catch (error) {
      console.error('Failed to toggle helpful:', error)
      alert('Failed to mark review as helpful')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleHelpful}
      disabled={loading}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${
          isHelpful
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span className={isHelpful ? 'animate-bounce' : ''}>👍</span>
      <span>
        {isHelpful ? 'Helpful' : 'Mark helpful'}
        {count > 0 && ` (${count})`}
      </span>
    </button>
  )
}
