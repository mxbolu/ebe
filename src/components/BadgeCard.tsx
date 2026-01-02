'use client'

interface Badge {
  id: string
  name: string
  description: string
  type: string
  iconUrl?: string | null
  points: number
  earnedAt?: Date
}

interface BadgeCardProps {
  badge: Badge
  earned?: boolean
  onClick?: () => void
}

export default function BadgeCard({ badge, earned = false, onClick }: BadgeCardProps) {
  // Badge type colors
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'READING_MILESTONE':
        return 'from-blue-500 to-blue-700'
      case 'REVIEW_MASTER':
        return 'from-purple-500 to-purple-700'
      case 'GENRE_EXPLORER':
        return 'from-green-500 to-green-700'
      case 'READING_STREAK':
        return 'from-orange-500 to-orange-700'
      case 'EARLY_ADOPTER':
        return 'from-pink-500 to-pink-700'
      default:
        return 'from-gray-500 to-gray-700'
    }
  }

  // Badge icon emoji based on type
  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'READING_MILESTONE':
        return '📚'
      case 'REVIEW_MASTER':
        return '✍️'
      case 'GENRE_EXPLORER':
        return '🌍'
      case 'READING_STREAK':
        return '🔥'
      case 'EARLY_ADOPTER':
        return '⭐'
      default:
        return '🏆'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border-2 p-4 transition-all
        ${
          earned
            ? `border-transparent bg-gradient-to-br ${getBadgeColor(badge.type)} text-white shadow-lg hover:shadow-xl cursor-pointer`
            : 'border-gray-300 bg-gray-100 opacity-50 grayscale'
        }
      `}
    >
      {/* Badge icon */}
      <div className="flex items-center justify-center mb-3">
        {badge.iconUrl ? (
          <img
            src={badge.iconUrl}
            alt={badge.name}
            className="w-16 h-16 object-contain"
          />
        ) : (
          <div className="text-5xl">{getBadgeIcon(badge.type)}</div>
        )}
      </div>

      {/* Badge info */}
      <div className="text-center">
        <h3 className={`font-bold text-lg mb-1 ${earned ? 'text-white' : 'text-gray-700'}`}>
          {badge.name}
        </h3>
        <p className={`text-sm mb-2 ${earned ? 'text-white/90' : 'text-gray-600'}`}>
          {badge.description}
        </p>
        <div className={`text-xs font-semibold ${earned ? 'text-white/80' : 'text-gray-500'}`}>
          {badge.points} pts
        </div>
      </div>

      {/* Earned date badge */}
      {earned && badge.earnedAt && (
        <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
          {new Date(badge.earnedAt).toLocaleDateString()}
        </div>
      )}

      {/* Locked overlay for unearned badges */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10">
          <div className="text-4xl">🔒</div>
        </div>
      )}
    </div>
  )
}
