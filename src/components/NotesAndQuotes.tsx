'use client'

import { useState, useEffect } from 'react'

interface Note {
  id: string
  content: string
  page?: number
  chapter?: string
  createdAt: string
}

interface Quote {
  id: string
  text: string
  page?: number
  isFavorite: boolean
  createdAt: string
}

interface NotesAndQuotesProps {
  bookId: string
}

export default function NotesAndQuotes({ bookId }: NotesAndQuotesProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'quotes'>('notes')
  const [notes, setNotes] = useState<Note[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newPage, setNewPage] = useState('')

  useEffect(() => {
    fetchData()
  }, [bookId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [notesRes, quotesRes] = await Promise.all([
        fetch(`/api/notes?bookId=${bookId}`),
        fetch(`/api/quotes?bookId=${bookId}`),
      ])

      if (notesRes.ok) {
        const data = await notesRes.json()
        setNotes(data.notes || [])
      }

      if (quotesRes.ok) {
        const data = await quotesRes.json()
        setQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Failed to fetch notes/quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newContent.trim()) return

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          content: newContent,
          page: newPage ? parseInt(newPage) : null,
        }),
      })

      if (response.ok) {
        setNewContent('')
        setNewPage('')
        setAdding(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      alert('Failed to add note. Please try again.')
    }
  }

  const handleAddQuote = async () => {
    if (!newContent.trim()) return

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          text: newContent,
          page: newPage ? parseInt(newPage) : null,
        }),
      })

      if (response.ok) {
        setNewContent('')
        setNewPage('')
        setAdding(false)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add quote:', error)
      alert('Failed to add quote. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 border-b-2 font-medium transition ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-2 border-b-2 font-medium transition ${
              activeTab === 'quotes'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💬 Quotes ({quotes.length})
          </button>
        </div>

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            + Add {activeTab === 'notes' ? 'Note' : 'Quote'}
          </button>
        )}
      </div>

      {/* Add Form */}
      {adding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={activeTab === 'notes' ? 'Write your note...' : 'Enter quote...'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            rows={4}
          />
          <div className="flex items-center gap-3 mt-3">
            <input
              type="number"
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
              placeholder="Page (optional)"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button
              onClick={activeTab === 'notes' ? handleAddNote : handleAddQuote}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setAdding(false)
                setNewContent('')
                setNewPage('')
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'notes' ? (
            notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <p className="text-gray-900">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {note.page && <span>Page {note.page}</span>}
                    <span>•</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No notes yet. Add your first note!</p>
              </div>
            )
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div key={quote.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                <p className="text-gray-900 italic">"{quote.text}"</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  {quote.page && <span>Page {quote.page}</span>}
                  <span>•</span>
                  <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No quotes saved yet. Save your favorite quotes!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
