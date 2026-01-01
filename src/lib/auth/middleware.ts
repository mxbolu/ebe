import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * Extract token from Authorization header or cookies
 */
function extractToken(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try cookie
  const cookieToken = request.cookies.get('token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Middleware to authenticate requests
 * Returns null if authenticated, or an error response if not
 */
export function authenticateRequest(
  request: NextRequest
): { user: JWTPayload } | NextResponse {
  const token = extractToken(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const user = verifyToken(token)

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  return { user }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(request: NextRequest): JWTPayload | null {
  const token = extractToken(request)
  if (!token) return null
  return verifyToken(token)
}

/**
 * Check if user has required role
 */
export function requireRole(user: JWTPayload, allowedRoles: string[]): boolean {
  return allowedRoles.includes(user.role)
}
