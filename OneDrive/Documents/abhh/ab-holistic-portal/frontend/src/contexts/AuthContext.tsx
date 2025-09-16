import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, AuthState, User, LoginCredentials, SignupData } from '../types/auth';
// import awsConfig from '../config/aws'; // Temporarily disabled for development

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setError = (error: string | null) => {
    setAuthState(prev => ({ ...prev, error, isLoading: false }));
  };

  const setUser = (user: User | null) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }));
  };

  // Mock authentication for development
  const refreshAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Check localStorage for demo user
      const storedUser = localStorage.getItem('demo-user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock login - in production this would use AWS Cognito
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Demo credentials
      let user: User;
      if (credentials.email === 'admin@abholistic.com') {
        user = {
          id: 'admin-1',
          email: 'admin@abholistic.com',
          name: 'Admin User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        };
      } else {
        user = {
          id: 'applicant-1',
          email: credentials.email,
          name: 'Test Applicant',
          firstName: 'Test',
          lastName: 'Applicant',
          role: 'applicant'
        };
      }

      localStorage.setItem('demo-user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock signup
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('demo-user');
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    }
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Confirm signup error:', error);
      setError(error.message || 'Confirmation failed');
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      setError(error.message || 'Resend confirmation failed');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Password reset request failed');
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Password reset failed');
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    logout,
    confirmSignup,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};