import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { authService } from '../auth/auth-service'
import { apiClient } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  initialize: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
        // Set token for API client
        apiClient.setToken(token)
      },

      logout: async () => {
        try {
          // Sign out from Cognito
          await authService.logout()
          // Clear local state
          set({ user: null, token: null, isAuthenticated: false })
          // Clear API client token
          apiClient.clearToken()
        } catch (error) {
          console.error('Logout error:', error)
          // Clear local state even if Cognito logout fails
          set({ user: null, token: null, isAuthenticated: false })
          apiClient.clearToken()
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      /**
       * Initialize auth state from Cognito session
       * Call this on app startup to restore authentication
       */
      initialize: async () => {
        try {
          set({ isLoading: true })

          const isAuth = await authService.isAuthenticated()

          if (isAuth) {
            // Get user attributes from Cognito
            const attributes = await authService.getUserAttributes()
            const idToken = await authService.getIdToken()

            if (attributes && idToken) {
              const user: User = {
                id: attributes.sub,
                email: attributes.email,
                firstName: attributes.given_name,
                lastName: attributes.family_name,
                role: attributes['custom:roles'] || 'ADMIN',
                tenantId: attributes['custom:tenant_id'] || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }

              set({ user, token: idToken, isAuthenticated: true })
              apiClient.setToken(idToken)
            } else {
              set({ user: null, token: null, isAuthenticated: false })
            }
          } else {
            set({ user: null, token: null, isAuthenticated: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ user: null, token: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partiallyPersist: true,
    }
  )
)
