'use client'

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

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  const navLinks = [
    { href: '/dashboard', label: '📚 My Books', icon: '📚' },
    { href: '/search', label: '🔍 Discover', icon: '🔍' },
    { href: '/clubs', label: '👥 Book Clubs', icon: '👥' },
    { href: '/challenges', label: '🎯 Challenges', icon: '🎯' },
  ]

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="text-3xl font-black text-white tracking-tight transform group-hover:scale-110 transition-transform duration-200">
              ebe
            </div>
            <span className="hidden sm:block text-white/90 text-sm font-medium bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              Reading Journal ✨
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-white text-indigo-600 shadow-md transform scale-105'
                    : 'text-white/90 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="hidden lg:inline">{link.label}</span>
                <span className="lg:hidden text-xl">{link.icon}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {user?.isEmailVerified === false && (
              <button
                type="button"
                onClick={() => router.push(`/verify-email?email=${encodeURIComponent(user.email)}`)}
                className="hidden sm:flex items-center bg-yellow-400 text-yellow-900 rounded-lg px-3 py-2 hover:bg-yellow-300 transition text-sm font-medium shadow-md"
              >
                ⚠️ Verify Email
              </button>
            )}

            {user && <NotificationBell />}

            {user && (
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Link
                  href={`/users/${user.username}`}
                  className="hidden sm:block text-right group"
                >
                  <p className="text-sm font-semibold text-white group-hover:text-yellow-200 transition">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-white/80">View Profile</p>
                </Link>
                <button
                  onClick={onLogout}
                  className="text-sm text-white/90 hover:text-white font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-3 space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-white/90'
              }`}
            >
              <span className="text-lg mb-1">{link.icon}</span>
              <span>{link.label.replace(/[^\w\s]/g, '').trim()}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
