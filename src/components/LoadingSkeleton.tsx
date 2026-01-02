'use client'

interface LoadingSkeletonProps {
  className?: string
}

export function SkeletonLine({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex gap-4">
        {/* Cover skeleton */}
        <div className="flex-shrink-0">
          <SkeletonLine className="w-24 h-36" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <SkeletonLine className="h-6 w-3/4" />
          <SkeletonLine className="h-4 w-1/2" />
          <div className="space-y-2">
            <SkeletonLine className="h-3 w-1/4" />
            <SkeletonLine className="h-3 w-1/3" />
          </div>
          <SkeletonLine className="h-10 w-full mt-4" />
        </div>
      </div>
    </div>
  )
}

export function BookDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <SkeletonLine className="h-6 w-40" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <SkeletonLine className="w-full aspect-[2/3] mb-6" />
              <SkeletonLine className="h-12 w-full" />
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-full" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <SkeletonLine className="h-8 w-3/4 mb-3" />
              <SkeletonLine className="h-6 w-1/2 mb-4" />
              <div className="flex gap-2">
                <SkeletonLine className="h-8 w-20" />
                <SkeletonLine className="h-8 w-20" />
                <SkeletonLine className="h-8 w-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <SkeletonLine className="h-6 w-40 mb-4" />
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  )
}
