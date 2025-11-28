import { useAuthStore } from '../stores/auth-store'

// DEVELOPMENT MODE: Set to true to use mock user data
const DEV_MODE = false

// Mock user for development
const DEV_USER = {
  id: 'dev-user-1',
  email: 'dev@classpoint.test',
  firstName: 'Demo',
  lastName: 'User',
  role: 'ADMIN' as const,
  tenantId: 'dev-tenant-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

/**
 * Hook to access authentication state and methods
 *
 * DEV MODE: When DEV_MODE = true, provides mock user data for UI testing
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    initialize,
  } = useAuthStore()

  // In development mode, provide mock user data
  if (DEV_MODE && !user) {
    return {
      user: DEV_USER,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login,
      logout,
      updateUser,
      initialize,
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    initialize,
  }
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string | string[]) {
  const { user } = useAuthStore()

  if (!user) return false

  if (Array.isArray(role)) {
    return role.includes(user.role)
  }

  return user.role === role
}

/**
 * Hook to check if user is admin (SUPER_ADMIN or ADMIN)
 */
export function useIsAdmin() {
  return useHasRole(['SUPER_ADMIN', 'ADMIN'])
}

/**
 * Hook to check if user is teacher
 */
export function useIsTeacher() {
  return useHasRole('TEACHER')
}

/**
 * Hook to check if user is parent
 */
export function useIsParent() {
  return useHasRole('PARENT')
}

/**
 * Hook to check if user is student
 */
export function useIsStudent() {
  return useHasRole('STUDENT')
}
