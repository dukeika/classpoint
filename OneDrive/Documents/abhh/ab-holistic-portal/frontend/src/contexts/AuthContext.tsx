import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import {
  AuthContextType,
  AuthState,
  User,
  LoginCredentials,
  SignupData,
  PasswordResetData,
  AuthError,
  AuthErrorType
} from '../types/auth';
import { useErrorHandler } from '../hooks/useErrorHandler';
// import awsConfig from '../config/aws'; // Temporarily disabled for development

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Enhanced AuthProvider with improved error handling and type safety
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const { handleError: logError } = useErrorHandler({
    context: 'AuthContext',
    logErrors: true,
  });

  /**
   * Create an authentication error with proper typing
   */
  const createAuthError = useCallback((type: AuthErrorType, message: string, details?: Record<string, unknown>): AuthError => {
    return { type, message, details };
  }, []);

  /**
   * Set error state with proper error handling
   */
  const setError = useCallback((error: string | AuthError | null) => {
    let errorMessage: string | null = null;

    if (error) {
      if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = error.message;
        // Log the full error object for debugging
        logError(new Error(`Auth Error [${error.type}]: ${error.message}`));
      }
    }

    setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
  }, [logError]);

  /**
   * Set user with proper state management
   */
  const setUser = useCallback((user: User | null) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }));
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((isLoading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading }));
  }, []);

  /**
   * Parse stored user data with validation
   */
  const parseStoredUser = useCallback((storedData: string): User | null => {
    try {
      const parsed = JSON.parse(storedData);

      // Validate required user properties
      if (!parsed.id || !parsed.email || !parsed.role) {
        throw new Error('Invalid user data structure');
      }

      return parsed as User;
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to parse stored user data'));
      return null;
    }
  }, [logError]);

  /**
   * Refresh authentication state from storage
   */
  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);

      // Check localStorage for demo user
      const storedUser = localStorage.getItem('demo-user');
      if (storedUser) {
        const user = parseStoredUser(storedUser);
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      const authError = createAuthError(
        'unknown_error',
        'Failed to refresh authentication state',
        { originalError: error }
      );
      setError(authError);
      setUser(null);
    }
  }, [setLoading, parseStoredUser, setUser, createAuthError, setError]);

  /**
   * Login with enhanced error handling
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw createAuthError('invalid_credentials', 'Email and password are required');
      }

      // Mock login - in production this would use AWS Cognito
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Demo credentials with enhanced user data
      let user: User;
      const currentTime = new Date().toISOString();

      if (credentials.email === 'admin@abholistic.com') {
        user = {
          id: 'admin-1',
          email: 'admin@abholistic.com',
          name: 'Admin User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          profileStatus: 'verified',
          groups: ['admin', 'users'],
          createdAt: currentTime,
          updatedAt: currentTime,
          lastLogin: currentTime,
        };
      } else {
        user = {
          id: `applicant-${Date.now()}`,
          email: credentials.email,
          name: 'Test Applicant',
          firstName: 'Test',
          lastName: 'Applicant',
          role: 'applicant',
          profileStatus: 'verified',
          groups: ['applicant'],
          createdAt: currentTime,
          updatedAt: currentTime,
          lastLogin: currentTime,
        };
      }

      // Store user data
      try {
        localStorage.setItem('demo-user', JSON.stringify(user));
      } catch (storageError) {
        logError(storageError instanceof Error ? storageError : new Error('Failed to store user data'));
        // Continue with login even if storage fails
      }

      setUser(user);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Login failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError, logError, setUser]);

  /**
   * Signup with enhanced validation and error handling
   */
  const signup = useCallback(async (data: SignupData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate signup data
      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        throw createAuthError('invalid_credentials', 'All fields are required for signup');
      }

      // Mock signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoading(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Signup failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError]);

  /**
   * Logout with proper cleanup
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // Clear stored user data
      try {
        localStorage.removeItem('demo-user');
      } catch (storageError) {
        logError(storageError instanceof Error ? storageError : new Error('Failed to clear user data'));
        // Continue with logout even if storage clear fails
      }

      setUser(null);
    } catch (error) {
      const authError = createAuthError('unknown_error', 'Logout failed');
      setError(authError);
    }
  }, [setLoading, logError, setUser, createAuthError, setError]);

  /**
   * Confirm signup with validation
   */
  const confirmSignup = useCallback(async (email: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !code) {
        throw createAuthError('invalid_credentials', 'Email and confirmation code are required');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Confirmation failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError]);

  /**
   * Resend confirmation code
   */
  const resendConfirmation = useCallback(async (email: string) => {
    try {
      if (!email) {
        throw createAuthError('invalid_credentials', 'Email is required');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Resend confirmation failed');
        setError(authError);
      }
    }
  }, [setError, createAuthError]);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (email: string) => {
    try {
      if (!email) {
        throw createAuthError('invalid_credentials', 'Email is required');
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Password reset request failed');
        setError(authError);
      }
    }
  }, [setError, createAuthError]);

  /**
   * Reset password with new interface
   */
  const resetPassword = useCallback(async (data: PasswordResetData) => {
    try {
      setLoading(true);
      setError(null);

      if (!data.email || !data.code || !data.newPassword || !data.confirmPassword) {
        throw createAuthError('invalid_credentials', 'All fields are required for password reset');
      }

      if (data.newPassword !== data.confirmPassword) {
        throw createAuthError('invalid_credentials', 'Passwords do not match');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Password reset failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      if (!authState.user) {
        throw createAuthError('unknown_error', 'No user logged in');
      }

      // Mock profile update
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: User = {
        ...authState.user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('demo-user', JSON.stringify(updatedUser));
      } catch (storageError) {
        logError(storageError instanceof Error ? storageError : new Error('Failed to store updated user data'));
      }

      setUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Profile update failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError, authState.user, logError, setUser]);

  /**
   * Change password
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!currentPassword || !newPassword) {
        throw createAuthError('invalid_credentials', 'Current and new passwords are required');
      }

      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        const authError = createAuthError('unknown_error', 'Password change failed');
        setError(authError);
      }
    }
  }, [setLoading, setError, createAuthError]);

  // Initialize auth on mount
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const value: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    signup,
    logout,
    confirmSignup,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    refreshAuth,
    updateProfile,
    changePassword,
  }), [
    authState,
    login,
    signup,
    logout,
    confirmSignup,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    refreshAuth,
    updateProfile,
    changePassword,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};