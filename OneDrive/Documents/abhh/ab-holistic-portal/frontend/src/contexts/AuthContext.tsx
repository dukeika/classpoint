/**
 * Authentication Context for AB Holistic Interview Portal
 * Provides centralized authentication state management
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import {
  AuthState,
  AuthContextValue,
  UserProfile,
  UserRole,
  AuthTokens,
  AuthError,
  AuthStatus,
  LoginOptions,
  LogoutOptions,
  AuthCodeParams,
  ROLE_PERMISSIONS,
} from '../types/auth';
import { authService, AuthUtils } from '../services/auth';
import { tokenManager } from '../services/tokenManager';

/**
 * Authentication action types
 */
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserProfile; tokens: AuthTokens } }
  | { type: 'AUTH_ERROR'; payload: AuthError }
  | { type: 'LOGOUT_START' }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'TOKEN_REFRESH_START' }
  | { type: 'TOKEN_REFRESH_SUCCESS'; payload: { user: UserProfile; tokens: AuthTokens } }
  | { type: 'TOKEN_REFRESH_ERROR'; payload: AuthError }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  status: 'loading',
  user: null,
  tokens: null,
  error: null,
  isRefreshing: false,
  isLoggingOut: false,
};

/**
 * Authentication reducer
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        status: 'authenticated',
        user: action.payload.user,
        tokens: action.payload.tokens,
        error: null,
        isRefreshing: false,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        status: 'error',
        user: null,
        tokens: null,
        error: action.payload,
        isRefreshing: false,
        isLoggingOut: false,
      };

    case 'LOGOUT_START':
      return {
        ...state,
        isLoggingOut: true,
        error: null,
      };

    case 'LOGOUT_SUCCESS':
      return {
        ...initialState,
        status: 'unauthenticated',
      };

    case 'TOKEN_REFRESH_START':
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };

    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isRefreshing: false,
        error: null,
      };

    case 'TOKEN_REFRESH_ERROR':
      return {
        ...state,
        status: 'unauthenticated',
        user: null,
        tokens: null,
        error: action.payload,
        isRefreshing: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        status: action.payload ? 'loading' : state.status,
      };

    default:
      return state;
  }
};

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      console.log('[AuthContext] Initializing authentication...');
      dispatch({ type: 'AUTH_START' });

      // First, check if we have tokens in the URL hash (returning from Cognito)
      if (authService.hasTokensInUrl()) {
        console.log('[AuthContext] Found tokens in URL hash');
        try {
          const tokens = authService.parseTokensFromHash(window.location.hash);
          if (tokens) {
            // Clear tokens from URL immediately
            authService.clearTokensFromUrl();

            // Store tokens
            await tokenManager.setTokens(tokens);

            // Get user profile
            const user = await authService.getUserProfile(tokens);
            console.log('[AuthContext] Hash auth successful, user:', user.email);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
            return;
          }
        } catch (hashError) {
          console.error('[AuthContext] Error parsing tokens from hash:', hashError);
          authService.clearTokensFromUrl();
          const authError = hashError as AuthError;
          dispatch({ type: 'AUTH_ERROR', payload: authError });
          return;
        }
      }

      // Check for stored tokens
      const storedTokens = await tokenManager.getTokens();
      console.log('[AuthContext] Has stored tokens:', !!storedTokens);

      if (!storedTokens) {
        console.log('[AuthContext] No tokens found, setting unauthenticated');
        dispatch({ type: 'LOGOUT_SUCCESS' });
        return;
      }

      // Check if tokens are expired
      const areExpired = await tokenManager.areTokensExpired();
      console.log('[AuthContext] Tokens expired:', areExpired);

      if (areExpired) {
        // Implicit flow doesn't support refresh tokens, so we need to re-authenticate
        await tokenManager.removeTokens();
        console.log('[AuthContext] Tokens expired, cleared');
        dispatch({ type: 'LOGOUT_SUCCESS' });
      } else {
        // Tokens are valid, get user profile
        try {
          const user = await authService.getUserProfile(storedTokens);
          console.log('[AuthContext] Auth successful, user:', user.email, 'role:', user.role);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens: storedTokens } });
        } catch (profileError) {
          // Invalid tokens, clear and logout
          console.error('[AuthContext] Invalid tokens:', profileError);
          await tokenManager.removeTokens();
          dispatch({ type: 'LOGOUT_SUCCESS' });
        }
      }
    } catch (error) {
      console.error('[AuthContext] Auth initialization error:', error);
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
  }, []);

  /**
   * Login user (redirect to Cognito Hosted UI)
   */
  const login = useCallback(async (options: LoginOptions = {}) => {
    try {
      const loginUrl = authService.getLoginUrl(options);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login error:', error);
      const authError: AuthError = {
        type: 'OAUTH_ERROR',
        message: 'Failed to initiate login',
        retryable: true,
      };
      dispatch({ type: 'AUTH_ERROR', payload: authError });
    }
  }, []);


  /**
   * Logout user
   */
  const logout = useCallback(async (options: LogoutOptions = {}) => {
    try {
      dispatch({ type: 'LOGOUT_START' });

      // Revoke refresh token if available
      if (state.tokens?.refreshToken) {
        try {
          await authService.revokeToken(state.tokens.refreshToken);
        } catch (revokeError) {
          console.warn('Failed to revoke token:', revokeError);
        }
      }

      // Clear stored tokens
      await tokenManager.clearAll();

      if (options.global) {
        // Global logout - redirect to Cognito logout
        const logoutUrl = authService.getLogoutUrl(options);
        window.location.href = logoutUrl;
      } else {
        // Local logout
        dispatch({ type: 'LOGOUT_SUCCESS' });

        // Redirect if specified
        if (options.redirectTo) {
          window.location.href = options.redirectTo;
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there were errors
      dispatch({ type: 'LOGOUT_SUCCESS' });
    }
  }, [state.tokens]);

  /**
   * Refresh authentication tokens (not supported in implicit flow)
   */
  const refreshTokens = useCallback(async () => {
    try {
      // Implicit flow doesn't support refresh tokens
      // Clear tokens and force re-authentication
      await tokenManager.clearAll();

      const authError: AuthError = {
        type: 'TOKEN_EXPIRED',
        message: 'Session has expired. Please sign in again.',
        retryable: false,
      };

      dispatch({ type: 'TOKEN_REFRESH_ERROR', payload: authError });
    } catch (error) {
      console.error('Token refresh error:', error);
      await tokenManager.clearAll();

      const authError: AuthError = {
        type: 'TOKEN_EXPIRED',
        message: 'Session has expired',
        retryable: false,
      };

      dispatch({ type: 'TOKEN_REFRESH_ERROR', payload: authError });
    }
  }, []);

  /**
   * Check if user has permission
   */
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!state.user) return false;

    const rolePermissions = ROLE_PERMISSIONS[state.user.role] || [];
    return rolePermissions.some(permission =>
      permission.resource === resource && permission.action === action
    );
  }, [state.user]);

  /**
   * Clear authentication errors
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Setup automatic token refresh
   */
  useEffect(() => {
    if (state.status !== 'authenticated' || !state.tokens) return;

    const checkTokenExpiration = async () => {
      const timeUntilExpiration = await tokenManager.getTimeUntilExpiration();

      // Refresh if tokens expire in less than 5 minutes
      if (timeUntilExpiration > 0 && timeUntilExpiration < 300) {
        await refreshTokens();
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Set up periodic check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [state.status, state.tokens, refreshTokens]);

  /**
   * Initialize authentication on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Setup broadcast channel for cross-tab logout
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('auth');

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'LOGOUT') {
        dispatch({ type: 'LOGOUT_SUCCESS' });
      }
    };

    channel.addEventListener('message', handleMessage);

    // Broadcast logout when user logs out
    if (state.status === 'unauthenticated' && state.user === null) {
      channel.postMessage({ type: 'LOGOUT' });
    }

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [state.status, state.user]);

  /**
   * Listen for auth callback completion event
   * This allows the callback page to notify us immediately when auth completes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthCallbackComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userProfile, tokens } = customEvent.detail;

      console.log('[AuthContext] Received auth-callback-complete event');
      console.log('[AuthContext] User from event:', userProfile.email, 'Role:', userProfile.role);

      if (userProfile && tokens) {
        // Immediately update auth state with the provided data
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: userProfile, tokens }
        });
      }
    };

    window.addEventListener('auth-callback-complete', handleAuthCallbackComplete);

    return () => {
      window.removeEventListener('auth-callback-complete', handleAuthCallbackComplete);
    };
  }, []);

  /**
   * Listen for localStorage changes (for cross-tab auth sync)
   * This handles cases where auth happens in another tab
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // When user data is added to localStorage, re-initialize
      if (e.key === 'user' && e.newValue && !e.oldValue) {
        console.log('[AuthContext] Detected user storage change, re-initializing auth');
        initializeAuth();
      }

      // When token is added, re-initialize
      if (e.key === 'token' && e.newValue && !e.oldValue) {
        console.log('[AuthContext] Detected token storage change, re-initializing auth');
        initializeAuth();
      }

      // When user/token is removed, logout
      if ((e.key === 'user' || e.key === 'token') && !e.newValue && e.oldValue) {
        console.log('[AuthContext] Detected auth data removal, logging out');
        dispatch({ type: 'LOGOUT_SUCCESS' });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initializeAuth]);

  /**
   * Memoized context value
   */
  const contextValue = useMemo<AuthContextValue>(() => ({
    state,
    actions: {
      login,
      logout,
      refreshTokens,
      hasPermission,
      clearError,
    },
  }), [state, login, logout, refreshTokens, hasPermission, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to get current user
 */
export const useUser = (): UserProfile | null => {
  const { state } = useAuth();
  return state.user;
};

/**
 * Hook to check authentication status
 */
export const useAuthStatus = (): AuthStatus => {
  const { state } = useAuth();
  return state.status;
};

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { state } = useAuth();
  return state.status === 'authenticated' && !!state.user;
};

/**
 * Hook to check if user is admin
 */
export const useIsAdmin = (): boolean => {
  const user = useUser();
  return AuthUtils.isAdmin(user);
};

/**
 * Hook to check if user is applicant
 */
export const useIsApplicant = (): boolean => {
  const user = useUser();
  return AuthUtils.isApplicant(user);
};

/**
 * Hook to check permissions
 */
export const usePermissions = () => {
  const { actions } = useAuth();
  return {
    hasPermission: actions.hasPermission,
    canRead: (resource: string) => actions.hasPermission(resource, 'read'),
    canWrite: (resource: string) => actions.hasPermission(resource, 'write'),
    canDelete: (resource: string) => actions.hasPermission(resource, 'delete'),
  };
};

/**
 * Authentication error context for error boundaries
 */
export const AuthErrorContext = createContext<{
  error: AuthError | null;
  clearError: () => void;
} | undefined>(undefined);

/**
 * Hook to use auth error context
 */
export const useAuthError = () => {
  const context = useContext(AuthErrorContext);
  if (context === undefined) {
    throw new Error('useAuthError must be used within an AuthErrorContext');
  }
  return context;
};

export default AuthContext;