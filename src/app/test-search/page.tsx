'use client'

import { useState } from 'react'

export default function TestSearchPage() {
  const [query, setQuery] = useState('oliver twist')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSearch = async () => {
    setLoading(true)
    setDebugInfo(null)

    try {
      const url = `/api/books/search?q=${encodeURIComponent(query)}`
      const response = await fetch(url)
      const data = await response.json()

      setDebugInfo({
        url,
        status: response.status,
        ok: response.ok,
        data,
        resultsCount: data.results?.length || 0,
        firstBook: data.results?.[0] || null,
      })
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        stack: error.stack,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Book Search Debug Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search Query:</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Enter search query..."
              />
            </div>

            <button
              onClick={testSearch}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Search API'}
            </button>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information:</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">API URL:</h3>
                <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {debugInfo.url}
                </code>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Response Status:</h3>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {debugInfo.status} - {debugInfo.ok ? 'OK ✅' : 'ERROR ❌'}
                </code>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Results Count:</h3>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {debugInfo.resultsCount} books found
                </code>
              </div>

              {debugInfo.firstBook && (
                <div>
                  <h3 className="font-medium text-gray-700">First Book:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo.firstBook, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-700">Full Response:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                  {JSON.stringify(debugInfo.data, null, 2)}
                </pre>
              </div>

              {debugInfo.error && (
                <div>
                  <h3 className="font-medium text-red-700">Error:</h3>
                  <pre className="bg-red-100 p-4 rounded text-sm overflow-x-auto">
                    {debugInfo.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
