import { useAuthStore } from '../stores/auth-store'

/**
 * Hook to access authentication state and methods
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
