import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            ebe
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            Your Personal Reading Journal
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Track every book you've ever read. Discover new reads from our collection of 90,000+ books.
            Share your reading journey with the community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold px-8 py-4 rounded-lg text-lg transition border-2 border-indigo-600 shadow-lg hover:shadow-xl"
            >
              Log In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Track Your Reading</h3>
              <p className="text-gray-600">
                Keep a record of all the books you've read, are reading, or want to read.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Rate & Review</h3>
              <p className="text-gray-600">
                Share your thoughts and ratings. Help others discover great books.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">View Statistics</h3>
              <p className="text-gray-600">
                See your reading stats, set goals, and track your progress over time.
              </p>
            </div>
          </div>

          <div className="mt-20 text-gray-500">
            <p className="text-sm">90,000+ books in our catalog</p>
          </div>
        </div>
      </div>
    </div>
  )
}
