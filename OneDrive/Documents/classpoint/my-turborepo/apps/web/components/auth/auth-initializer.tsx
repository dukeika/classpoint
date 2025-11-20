'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth-store'

/**
 * Component that initializes authentication state on app startup
 * Should be rendered at the root level
 */
export function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return null
}
