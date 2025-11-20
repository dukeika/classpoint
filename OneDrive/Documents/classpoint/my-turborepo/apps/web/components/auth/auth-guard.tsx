'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requiredRoles?: string[]
}

/**
 * Component that guards routes requiring authentication
 * Redirects to login if not authenticated
 */
export function AuthGuard({
  children,
  redirectTo = '/login',
  requiredRoles = [],
}: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      } else if (requiredRoles.length > 0 && user) {
        // Check if user has required role
        const hasRequiredRole = requiredRoles.includes(user.role)
        if (!hasRequiredRole) {
          // User doesn't have required role, redirect to unauthorized
          router.push('/unauthorized')
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, requiredRoles])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children until we're sure user is authenticated
  if (!isAuthenticated) {
    return null
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}
