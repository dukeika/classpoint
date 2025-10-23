/**
 * Authentication Service for AB Holistic Interview Portal
 * Integrates with AWS Cognito Hosted UI
 */

import {
  AuthConfig,
  AuthTokens,
  AuthService,
  JWTClaims,
  UserProfile,
  UserRole,
  LoginOptions,
  LogoutOptions,
  AuthError,
  AuthErrorType,
} from '../types/auth';
import { tokenManager } from './tokenManager';

/**
 * Authentication configuration for AWS Cognito
 */
const AUTH_CONFIG: AuthConfig = {
  userPoolId: 'us-west-1_n0Ij4uUuB',
  clientId: '3npp9udv9uarhb2ob18sj7jgvl',
  region: 'us-west-1',
  domain: 'ab-holistic-portal',
  // IMPORTANT: Must match Next.js trailingSlash config (currently true)
  redirectUri: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/auth/callback/`
    : (process.env.NODE_ENV === 'production'
      ? 'https://d8wgee9e93vts.cloudfront.net/auth/callback/'
      : 'http://localhost:3000/auth/callback/'),
  logoutUri: process.env.NODE_ENV === 'production'
    ? 'https://d8wgee9e93vts.cloudfront.net'
    : 'http://localhost:3000',
  scope: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
  responseType: 'code',
};

/**
 * Cognito URLs
 */
const COGNITO_URLS = {
  hosted: `https://${AUTH_CONFIG.domain}.auth.${AUTH_CONFIG.region}.amazoncognito.com`,
  token: `https://${AUTH_CONFIG.domain}.auth.${AUTH_CONFIG.region}.amazoncognito.com/oauth2/token`,
  revoke: `https://${AUTH_CONFIG.domain}.auth.${AUTH_CONFIG.region}.amazoncognito.com/oauth2/revoke`,
  userInfo: `https://${AUTH_CONFIG.domain}.auth.${AUTH_CONFIG.region}.amazoncognito.com/oauth2/userInfo`,
  jwks: `https://cognito-idp.${AUTH_CONFIG.region}.amazonaws.com/${AUTH_CONFIG.userPoolId}/.well-known/jwks.json`,
};

/**
 * Create authentication error
 */
const createAuthError = (
  type: AuthErrorType,
  message: string,
  code?: string,
  details?: Record<string, unknown>
): AuthError => ({
  type,
  message,
  code,
  details,
  retryable: ['NETWORK_ERROR', 'TOKEN_EXPIRED'].includes(type),
});

/**
 * Authentication service implementation
 */
class CognitoAuthService implements AuthService {
  private config: AuthConfig;

  constructor(config: AuthConfig = AUTH_CONFIG) {
    this.config = config;
  }

  /**
   * Get current authentication configuration
   */
  getConfig(): AuthConfig {
    return { ...this.config };
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Store state parameter for validation
   */
  private storeState(state: string, data?: Record<string, unknown>): void {
    const stateData = {
      state,
      timestamp: Date.now(),
      data: data || {},
    };

    try {
      sessionStorage.setItem('auth_state', JSON.stringify(stateData));
    } catch (error) {
      console.warn('Failed to store auth state:', error);
    }
  }

  /**
   * Validate and retrieve state parameter
   */
  private validateState(state: string): Record<string, unknown> | null {
    try {
      const storedData = sessionStorage.getItem('auth_state');
      if (!storedData) return null;

      const parsed = JSON.parse(storedData);
      const isExpired = Date.now() - parsed.timestamp > 10 * 60 * 1000; // 10 minutes

      if (isExpired || parsed.state !== state) {
        sessionStorage.removeItem('auth_state');
        return null;
      }

      sessionStorage.removeItem('auth_state');
      return parsed.data || {};
    } catch (error) {
      console.warn('Failed to validate auth state:', error);
      return null;
    }
  }

  /**
   * Generate login URL for Cognito Hosted UI
   */
  getLoginUrl(options: LoginOptions = {}): string {
    const state = this.generateState();
    const stateData = Object.assign({
      redirectTo: options.redirectTo,
    }, options.state || {});

    this.storeState(state, stateData);

    const params = new URLSearchParams({
      response_type: this.config.responseType,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state,
    });

    if (options.forceLogin) {
      params.append('prompt', 'login');
    }

    return `${COGNITO_URLS.hosted}/login?${params.toString()}`;
  }

  /**
   * Generate logout URL for Cognito Hosted UI
   */
  getLogoutUrl(options: LogoutOptions = {}): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      logout_uri: options.redirectTo || this.config.logoutUri,
    });

    return `${COGNITO_URLS.hosted}/logout?${params.toString()}`;
  }

  /**
   * Parse tokens from URL hash (implicit flow)
   */
  parseTokensFromHash(hash: string): AuthTokens | null {
    try {
      // Remove the # from the hash
      const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;

      if (!cleanHash) return null;

      const params = new URLSearchParams(cleanHash);

      const accessToken = params.get('access_token');
      const idToken = params.get('id_token');
      const expiresIn = params.get('expires_in');
      const tokenType = params.get('token_type');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw createAuthError(
          'OAUTH_ERROR',
          errorDescription || 'Authentication failed',
          error
        );
      }

      // Validate required tokens
      if (!accessToken || !idToken) {
        return null;
      }

      // Validate state parameter
      if (state) {
        const stateData = this.validateState(state);
        if (!stateData) {
          throw createAuthError(
            'OAUTH_ERROR',
            'Invalid or expired state parameter',
            'INVALID_STATE'
          );
        }
      }

      // Calculate expiration time
      const expirationSeconds = parseInt(expiresIn || '3600', 10);
      const expiresAt = Math.floor(Date.now() / 1000) + expirationSeconds;

      return {
        accessToken,
        idToken,
        refreshToken: '', // Implicit flow doesn't provide refresh tokens
        expiresAt,
        tokenType: tokenType || 'Bearer',
      };
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        throw error; // Re-throw AuthError
      }

      throw createAuthError(
        'OAUTH_ERROR',
        'Failed to parse tokens from URL',
        'PARSE_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Check if current URL contains authentication tokens
   */
  hasTokensInUrl(): boolean {
    if (typeof window === 'undefined') return false;

    const hash = window.location.hash;
    return hash.includes('access_token') && hash.includes('id_token');
  }

  /**
   * Clear tokens from URL hash
   */
  clearTokensFromUrl(): void {
    if (typeof window === 'undefined') return;

    // Replace the current history entry to remove tokens from URL
    const url = new URL(window.location.href);
    url.hash = '';

    window.history.replaceState({}, document.title, url.toString());
  }

  /**
   * Refresh access token using refresh token (not available in implicit flow)
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Implicit flow doesn't provide refresh tokens
    // User needs to re-authenticate when tokens expire
    throw createAuthError(
      'TOKEN_EXPIRED',
      'Session has expired. Please sign in again.',
      'NO_REFRESH_TOKEN'
    );
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<JWTClaims> {
    try {
      // Basic JWT format validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw createAuthError(
          'TOKEN_INVALID',
          'Invalid JWT token format',
          'INVALID_FORMAT'
        );
      }

      // Decode payload
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const claims: JWTClaims = JSON.parse(decoded);

      // Validate expiration
      const now = Math.floor(Date.now() / 1000);
      if (claims.exp && claims.exp <= now) {
        throw createAuthError(
          'TOKEN_EXPIRED',
          'JWT token has expired',
          'TOKEN_EXPIRED'
        );
      }

      // Validate issuer
      const expectedIssuer = `https://cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;
      if (claims.iss !== expectedIssuer) {
        throw createAuthError(
          'TOKEN_INVALID',
          'Invalid token issuer',
          'INVALID_ISSUER'
        );
      }

      // Validate audience
      if (claims.aud !== this.config.clientId) {
        throw createAuthError(
          'TOKEN_INVALID',
          'Invalid token audience',
          'INVALID_AUDIENCE'
        );
      }

      return claims;
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        throw error; // Re-throw AuthError
      }

      throw createAuthError(
        'TOKEN_INVALID',
        'Failed to validate JWT token',
        'VALIDATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Get user profile from tokens
   */
  async getUserProfile(tokens: AuthTokens): Promise<UserProfile> {
    try {
      // Validate and decode ID token
      const claims = await this.validateToken(tokens.idToken);

      // Extract user role from custom claim, cognito groups, or default to applicant
      const cognitoGroups = claims['cognito:groups'] as string[] | undefined;
      const customRole = claims['custom:role'] as UserRole | undefined;

      // Priority: custom:role -> first cognito group -> default to applicant
      const role: UserRole = customRole || (cognitoGroups?.[0] as UserRole) || 'applicant';

      // Create user profile
      const profile: UserProfile = {
        id: claims.sub,
        cognitoSub: claims.sub,
        email: claims.email,
        firstName: claims.given_name || '',
        lastName: claims.family_name || '',
        role,
        emailVerified: claims.email_verified || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return profile;
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        throw error; // Re-throw AuthError
      }

      throw createAuthError(
        'TOKEN_INVALID',
        'Failed to extract user profile from tokens',
        'PROFILE_EXTRACTION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        token: refreshToken,
        client_id: this.config.clientId,
      });

      const response = await fetch(COGNITO_URLS.revoke, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok && response.status !== 400) {
        // 400 is acceptable as it might mean token is already invalid
        console.warn('Failed to revoke token:', response.status);
      }
    } catch (error) {
      console.warn('Failed to revoke token:', error);
      // Don't throw error as token revocation is not critical for logout
    }
  }

  /**
   * Get user info from Cognito
   */
  async getUserInfo(accessToken: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(COGNITO_URLS.userInfo, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw createAuthError(
          'UNAUTHORIZED',
          'Failed to get user info',
          'USER_INFO_FAILED'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        throw error;
      }

      throw createAuthError(
        'NETWORK_ERROR',
        'Failed to fetch user info',
        'USER_INFO_NETWORK_ERROR',
        { originalError: error }
      );
    }
  }
}

/**
 * Authentication service instance
 */
export const authService = new CognitoAuthService();

/**
 * Authentication utilities
 */
export const AuthUtils = {
  /**
   * Check if error is retryable
   */
  isRetryableError(error: AuthError): boolean {
    return error.retryable;
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyErrorMessage(error: AuthError): string {
    switch (error.type) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password. Please try again.';
      case 'USER_NOT_FOUND':
        return 'Account not found. Please check your email or sign up.';
      case 'USER_NOT_CONFIRMED':
        return 'Please verify your email address to continue.';
      case 'PASSWORD_RESET_REQUIRED':
        return 'Password reset required. Please check your email.';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please sign in again.';
      case 'TOKEN_INVALID':
        return 'Invalid session. Please sign in again.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'OAUTH_ERROR':
        return 'Authentication failed. Please try again.';
      case 'UNAUTHORIZED':
        return 'You are not authorized to access this resource.';
      case 'FORBIDDEN':
        return 'Access denied. You do not have permission to perform this action.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  },

  /**
   * Extract redirect URL from callback state
   */
  extractRedirectUrl(state?: string): string | null {
    if (!state) return null;

    try {
      const storedData = sessionStorage.getItem('auth_state');
      if (!storedData) return null;

      const parsed = JSON.parse(storedData);
      return parsed.data?.redirectTo || null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user has admin role
   */
  isAdmin(user: UserProfile | null): boolean {
    return user?.role === 'admin';
  },

  /**
   * Check if user has applicant role
   */
  isApplicant(user: UserProfile | null): boolean {
    return user?.role === 'applicant';
  },

  /**
   * Format user display name
   */
  formatUserDisplayName(user: UserProfile): string {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  },

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: UserProfile): string {
    const firstName = user.firstName?.charAt(0)?.toUpperCase() || '';
    const lastName = user.lastName?.charAt(0)?.toUpperCase() || '';

    if (firstName && lastName) {
      return firstName + lastName;
    }

    return firstName || user.email.charAt(0).toUpperCase();
  },
};

export default authService;