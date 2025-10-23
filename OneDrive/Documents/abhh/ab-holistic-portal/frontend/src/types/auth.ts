/**
 * Authentication type definitions for AB Holistic Interview Portal
 * Integrates with AWS Cognito Hosted UI
 */

import { BaseEntity } from './common';

/**
 * User role types
 */
export type UserRole = 'admin' | 'applicant';

/**
 * Authentication status
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * User profile information
 */
export interface UserProfile extends BaseEntity {
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's role in the system */
  role: UserRole;
  /** Whether email is verified */
  emailVerified: boolean;
  /** User's avatar URL */
  avatarUrl?: string;
  /** User's phone number */
  phoneNumber?: string;
  /** User's preferred language */
  preferredLanguage?: string;
  /** User's timezone */
  timezone?: string;
  /** User's last login timestamp */
  lastLoginAt?: string;
  /** User's Cognito sub identifier */
  cognitoSub: string;
}

/**
 * JWT token claims structure
 */
export interface JWTClaims {
  /** Subject (user ID) */
  sub: string;
  /** Email address */
  email: string;
  /** Email verification status */
  email_verified: boolean;
  /** User's first name */
  given_name?: string;
  /** User's last name */
  family_name?: string;
  /** Custom role claim */
  'custom:role'?: UserRole;
  /** Token audience */
  aud: string;
  /** Token issuer */
  iss: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Token type */
  token_use: 'access' | 'id';
  /** Cognito username */
  username?: string;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  /** Access token for API calls */
  accessToken: string;
  /** ID token containing user info */
  idToken: string;
  /** Refresh token for token renewal */
  refreshToken: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Token type (usually 'Bearer') */
  tokenType: string;
}

/**
 * OAuth authorization code flow parameters
 */
export interface AuthCodeParams {
  /** Authorization code from Cognito */
  code: string;
  /** State parameter for CSRF protection */
  state?: string;
  /** Error code if authorization failed */
  error?: string;
  /** Error description */
  error_description?: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Cognito User Pool ID */
  userPoolId: string;
  /** Cognito App Client ID */
  clientId: string;
  /** AWS Region */
  region: string;
  /** Cognito Domain for hosted UI */
  domain: string;
  /** OAuth redirect URI */
  redirectUri: string;
  /** OAuth logout URI */
  logoutUri: string;
  /** OAuth scopes */
  scope: string[];
  /** OAuth response type */
  responseType: string;
}

/**
 * Authentication context state
 */
export interface AuthState {
  /** Current authentication status */
  status: AuthStatus;
  /** Current user profile */
  user: UserProfile | null;
  /** Authentication tokens */
  tokens: AuthTokens | null;
  /** Authentication error */
  error: AuthError | null;
  /** Whether tokens are being refreshed */
  isRefreshing: boolean;
  /** Whether user is being logged out */
  isLoggingOut: boolean;
}

/**
 * Authentication error types
 */
export type AuthErrorType =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'USER_NOT_CONFIRMED'
  | 'PASSWORD_RESET_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'NETWORK_ERROR'
  | 'OAUTH_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNKNOWN_ERROR';

/**
 * Authentication error structure
 */
export interface AuthError {
  /** Error type */
  type: AuthErrorType;
  /** Error message */
  message: string;
  /** Detailed error code */
  code?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * Login options
 */
export interface LoginOptions {
  /** Redirect URL after successful login */
  redirectTo?: string;
  /** Additional state to preserve */
  state?: string;
  /** Whether to force prompt for credentials */
  forceLogin?: boolean;
}

/**
 * Logout options
 */
export interface LogoutOptions {
  /** Whether to logout from all devices */
  global?: boolean;
  /** Redirect URL after logout */
  redirectTo?: string;
}

/**
 * Permission definitions
 */
export interface Permission {
  /** Permission resource (e.g., 'jobs', 'applications') */
  resource: string;
  /** Permission action (e.g., 'read', 'write', 'delete') */
  action: string;
  /** Optional conditions */
  conditions?: Record<string, unknown>;
}

/**
 * Role-based permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: 'jobs', action: 'read' },
    { resource: 'jobs', action: 'write' },
    { resource: 'jobs', action: 'delete' },
    { resource: 'applications', action: 'read' },
    { resource: 'applications', action: 'write' },
    { resource: 'applications', action: 'delete' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'write' },
    { resource: 'analytics', action: 'read' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'write' },
  ],
  applicant: [
    { resource: 'jobs', action: 'read' },
    { resource: 'applications', action: 'read', conditions: { ownOnly: true } },
    { resource: 'applications', action: 'write', conditions: { ownOnly: true } },
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'write' },
  ],
};

/**
 * Authentication context interface
 */
export interface AuthContextValue {
  /** Current authentication state */
  state: AuthState;

  /** Authentication actions */
  actions: {
    /** Initiate login flow */
    login: (options?: LoginOptions) => Promise<void>;
    /** Logout user */
    logout: (options?: LogoutOptions) => Promise<void>;
    /** Refresh authentication tokens */
    refreshTokens: () => Promise<void>;
    /** Check if user has permission */
    hasPermission: (resource: string, action: string) => boolean;
    /** Clear authentication errors */
    clearError: () => void;
  };
}

/**
 * Token storage interface
 */
export interface TokenStorage {
  /** Get stored tokens */
  getTokens: () => Promise<AuthTokens | null>;
  /** Store tokens securely */
  setTokens: (tokens: AuthTokens) => Promise<void>;
  /** Remove stored tokens */
  removeTokens: () => Promise<void>;
  /** Check if tokens exist */
  hasTokens: () => Promise<boolean>;
}

/**
 * Authentication service interface
 */
export interface AuthService {
  /** Get current authentication configuration */
  getConfig: () => AuthConfig;
  /** Generate login URL */
  getLoginUrl: (options?: LoginOptions) => string;
  /** Generate logout URL */
  getLogoutUrl: (options?: LogoutOptions) => string;
  /** Parse tokens from URL hash (implicit flow) */
  parseTokensFromHash: (hash: string) => AuthTokens | null;
  /** Check if URL contains tokens */
  hasTokensInUrl: () => boolean;
  /** Clear tokens from URL hash */
  clearTokensFromUrl: () => void;
  /** Refresh access token */
  refreshAccessToken: (refreshToken: string) => Promise<AuthTokens>;
  /** Validate and decode token */
  validateToken: (token: string) => Promise<JWTClaims>;
  /** Get user profile from tokens */
  getUserProfile: (tokens: AuthTokens) => Promise<UserProfile>;
  /** Revoke refresh token */
  revokeToken: (refreshToken: string) => Promise<void>;
}

/**
 * Route protection options
 */
export interface RouteProtectionOptions {
  /** Required role to access route */
  requiredRole?: UserRole;
  /** Required permissions */
  requiredPermissions?: Permission[];
  /** Redirect path for unauthorized users */
  redirectPath?: string;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ComponentType;
}

/**
 * Auth guard props
 */
export interface AuthGuardProps extends RouteProtectionOptions {
  /** Children to render if authorized */
  children: React.ReactNode;
  /** Fallback component for unauthorized access */
  fallback?: React.ReactNode;
}

/**
 * Protected route props
 */
export interface ProtectedRouteProps extends RouteProtectionOptions {
  /** Component to render if authorized */
  component: React.ComponentType<any>;
  /** Component props */
  componentProps?: Record<string, unknown>;
}

/**
 * OAuth callback state
 */
export interface CallbackState {
  /** Original URL to redirect to after auth */
  redirectTo?: string;
  /** Additional state data */
  data?: Record<string, unknown>;
}

/**
 * Authentication event types
 */
export type AuthEventType =
  | 'LOGIN_START'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_ERROR'
  | 'LOGOUT_START'
  | 'LOGOUT_SUCCESS'
  | 'TOKEN_REFRESH_START'
  | 'TOKEN_REFRESH_SUCCESS'
  | 'TOKEN_REFRESH_ERROR'
  | 'TOKEN_EXPIRED'
  | 'SESSION_EXPIRED'
  | 'UNAUTHORIZED_ACCESS';

/**
 * Authentication event payload
 */
export interface AuthEvent {
  /** Event type */
  type: AuthEventType;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data?: Record<string, unknown>;
  /** User ID if available */
  userId?: string;
  /** Error if applicable */
  error?: AuthError;
}

/**
 * Authentication event listener
 */
export type AuthEventListener = (event: AuthEvent) => void;