'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import NotificationBell from './NotificationBell'

interface MainNavProps {
  user?: {
    id: string
    username: string
    name: string | null
    email: string
    isEmailVerified: boolean
  } | null
  onLogout?: () => void
}

export default function MainNav({ user, onLogout }: MainNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  const navLinks = [
    { href: '/dashboard', label: 'My Books', icon: '📚' },
    { href: '/search', label: 'Discover', icon: '🔍' },
    { href: '/clubs', label: 'Book Clubs', icon: '👥' },
    { href: '/challenges', label: 'Challenges', icon: '🎯' },
  ]

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight transform group-hover:scale-110 transition-transform duration-200">
              ebe
            </div>
            <span className="hidden sm:block text-white/90 text-xs sm:text-sm font-medium bg-white/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
              Reading Journal ✨
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 lg:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive(link.href)
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white/90 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="hidden lg:inline">{link.icon} {link.label}</span>
                <span className="lg:hidden text-lg">{link.icon}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {user?.isEmailVerified === false && (
              <button
                type="button"
                onClick={() => router.push(`/verify-email?email=${encodeURIComponent(user.email)}`)}
                className="hidden lg:flex items-center bg-yellow-400 text-yellow-900 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-yellow-300 transition text-xs sm:text-sm font-medium shadow-md whitespace-nowrap"
              >
                ⚠️ <span className="ml-1">Verify Email</span>
              </button>
            )}

            {user && <div className="flex-shrink-0"><NotificationBell /></div>}

            {user && (
              <div className="hidden sm:flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                <Link
                  href={`/users/${user.username}`}
                  className="hidden md:block text-right group"
                >
                  <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-yellow-200 transition truncate max-w-[100px]">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-white/80">Profile</p>
                </Link>
                <button
                  onClick={onLogout}
                  className="text-xs sm:text-sm text-white/90 hover:text-white font-medium bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/20 rounded-lg transition"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 space-y-1 border-t border-white/20 animate-in fade-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'bg-white text-indigo-600 shadow-md'
                    : 'text-white/90 hover:bg-white/20'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}

            {user && (
              <>
                <div className="border-t border-white/20 my-2"></div>
                <Link
                  href={`/users/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/20 transition-all"
                >
                  <span className="text-xl">👤</span>
                  <span>{user.name || user.username}</span>
                </Link>
                {user.isEmailVerified === false && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition-all"
                  >
                    <span className="text-xl">⚠️</span>
                    <span>Verify Email</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onLogout?.()
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-white/20 transition-all"
                >
                  <span className="text-xl">🚪</span>
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
