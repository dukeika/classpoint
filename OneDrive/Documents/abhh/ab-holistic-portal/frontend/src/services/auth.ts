/**
 * AWS COGNITO AUTHENTICATION SERVICE WITH OAUTH HOSTED UI SUPPORT
 * Provides secure authentication using AWS Cognito with OAuth2/OIDC flows
 */

import {
  signIn,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  updateUserAttributes,
  getCurrentUser,
  signOut,
  updatePassword,
  deleteUser,
  fetchAuthSession,
  signInWithRedirect
  // AuthProvider - temporarily commented out due to import issue
} from 'aws-amplify/auth';
import {
  User,
  LoginCredentials,
  SignupData,
  PasswordResetData,
  AuthError,
  AuthErrorType,
} from '../types/auth';
import { TokenManager } from './api';
import '../config/aws';
import { awsConfig } from '../config/environment';

/**
 * AWS Cognito Authentication service class
 * Supports both traditional login and OAuth/Hosted UI flows for secure authentication
 */
export class AuthService {
  private static instance: AuthService;
  private readonly COGNITO_DOMAIN: string;
  private readonly FRONTEND_URL: string;

  private constructor() {
    // Get configuration from environment
    this.COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'ab-holistic-portal-auth.auth.us-west-1.amazoncognito.com';
    this.FRONTEND_URL = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI?.replace('/auth/callback', '') || 'http://ab-holistic-portal-frontend-prod.s3-website-us-west-1.amazonaws.com';

    console.log('🔐 AuthService: Initialized - ONLY real AWS Cognito authentication with OAuth support');
    console.log('🔐 AuthService: OAuth Domain:', this.COGNITO_DOMAIN);
    console.log('🔐 AuthService: Frontend URL:', this.FRONTEND_URL);
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Convert Cognito user to application User type
   */
  private async cognitoUserToUser(cognitoUser: any): Promise<User> {
    try {
      // Get auth session to access tokens
      const session = await fetchAuthSession();
      const accessToken = session.tokens?.accessToken;

      const attributes = cognitoUser.attributes || {};

      // Debug logging
      console.log('Cognito user attributes:', attributes);
      console.log('Access token payload:', accessToken?.payload);

      const groups = Array.isArray(accessToken?.payload['cognito:groups'])
        ? accessToken.payload['cognito:groups'] as string[]
        : [];

      console.log('User groups found:', groups);

      // Determine role from groups or attributes with fallback
      let role: 'admin' | 'applicant' = 'applicant';

      if (groups.includes('admin')) {
        role = 'admin';
        console.log('Role determined: admin');
      } else if (attributes['custom:role']) {
        role = attributes['custom:role'];
        console.log('Role from custom attribute:', role);
      } else {
        console.log('Role defaulted to: applicant');
      }

      return {
        id: cognitoUser.username || attributes.sub,
        email: attributes.email,
        name: attributes.name || `${attributes.given_name || ''} ${attributes.family_name || ''}`.trim(),
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        role,
        groups,
        profileStatus: attributes.email_verified === 'true' ? 'verified' : 'pending',
        createdAt: attributes.created_at,
        updatedAt: attributes.updated_at,
        lastLogin: new Date().toISOString(),
        attributes: {
          email_verified: attributes.email_verified === 'true',
          phone_verified: attributes.phone_number_verified === 'true',
          ...attributes,
        },
      };
    } catch (error) {
      console.error('Error converting Cognito user:', error);
      throw error;
    }
  }

  /**
   * Handle Cognito errors and convert to AuthError
   */
  private handleCognitoError(error: any): AuthError {
    console.error('Cognito error:', error);

    let type: AuthErrorType = 'unknown_error';
    let message = 'An unknown error occurred';

    if (error.name || error.code) {
      const errorCode = error.name || error.code;
      switch (errorCode) {
        case 'NotAuthorizedException':
        case 'UserNotFoundException':
          type = 'invalid_credentials';
          message = 'Invalid email or password';
          break;
        case 'UserNotConfirmedException':
          type = 'account_not_confirmed';
          message = 'Account not confirmed. Please check your email for verification link.';
          break;
        case 'PasswordResetRequiredException':
          type = 'password_expired';
          message = 'Password reset required';
          break;
        case 'TooManyRequestsException':
        case 'LimitExceededException':
          type = 'too_many_attempts';
          message = 'Too many attempts. Please try again later.';
          break;
        case 'InvalidParameterException':
        case 'InvalidPasswordException':
          type = 'invalid_credentials';
          message = error.message || 'Invalid parameters provided';
          break;
        case 'NetworkError':
          type = 'network_error';
          message = 'Network error. Please check your connection.';
          break;
        case 'UsernameExistsException':
          message = 'An account with this email already exists';
          break;
        default:
          message = error.message || 'Authentication failed';
      }
    } else if (error.message) {
      message = error.message;
    }

    return {
      type,
      message,
      details: {
        code: error.name || error.code,
        originalError: error,
      },
    };
  }

  /**
   * Build OAuth sign-in URL for Cognito Hosted UI
   */
  buildOAuthSignInUrl(responseType: 'code' | 'token' = 'code'): string {
    const params = new URLSearchParams({
      client_id: awsConfig.userPoolClientId,
      response_type: responseType,
      scope: 'openid email profile aws.cognito.signin.user.admin',
      redirect_uri: `${this.FRONTEND_URL}/auth/callback`,
      state: this.generateState(),
    });

    return `https://${this.COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Build OAuth sign-out URL for Cognito Hosted UI
   */
  buildOAuthSignOutUrl(): string {
    const params = new URLSearchParams({
      client_id: awsConfig.userPoolClientId,
      logout_uri: `${this.FRONTEND_URL}/auth/login`,
    });

    return `https://${this.COGNITO_DOMAIN}/logout?${params.toString()}`;
  }

  /**
   * Generate a secure random state parameter for OAuth flow
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store OAuth state in session storage for verification
   */
  storeOAuthState(state: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
    }
  }

  /**
   * Verify OAuth state parameter
   */
  verifyOAuthState(state: string): boolean {
    if (typeof window === 'undefined') return false;

    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state'); // Clean up

    return storedState === state;
  }

  /**
   * Redirect to Cognito Hosted UI for sign-in
   */
  async signInWithHostedUI(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('OAuth sign-in is only available in browser environment');
    }

    console.log('🔐 AuthService: Redirecting to Cognito Hosted UI');

    const signInUrl = this.buildOAuthSignInUrl();
    const urlParams = new URLSearchParams(signInUrl.split('?')[1]);
    const state = urlParams.get('state');

    if (state) {
      this.storeOAuthState(state);
    }

    window.location.href = signInUrl;
  }

  /**
   * Handle OAuth callback from Cognito Hosted UI
   */
  async handleOAuthCallback(code?: string, state?: string, error?: string): Promise<User> {
    if (error) {
      throw this.handleCognitoError(new Error(`OAuth error: ${error}`));
    }

    if (!code) {
      throw this.handleCognitoError(new Error('No authorization code received from OAuth callback'));
    }

    if (state && !this.verifyOAuthState(state)) {
      throw this.handleCognitoError(new Error('Invalid OAuth state parameter'));
    }

    try {
      console.log('🔐 AuthService: Processing OAuth callback with authorization code');

      // Exchange authorization code for tokens
      await this.exchangeCodeForTokens(code);

      // Get current user after successful token exchange
      const cognitoUser = await getCurrentUser();
      const user = await this.cognitoUserToUser(cognitoUser);

      console.log('🔐 AuthService: OAuth callback successful, user:', user);
      return user;
    } catch (error) {
      console.error('🔐 AuthService: OAuth callback failed:', error);
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Exchange authorization code for tokens using Cognito token endpoint
   */
  private async exchangeCodeForTokens(code: string): Promise<void> {
    const tokenEndpoint = `https://${this.COGNITO_DOMAIN}/oauth2/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: awsConfig.userPoolClientId,
      code: code,
      redirect_uri: `${this.FRONTEND_URL}/auth/callback`,
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokens = await response.json();

      // Store tokens in TokenManager
      if (tokens.access_token) {
        TokenManager.setTokens(tokens.access_token, tokens.refresh_token, tokens.id_token);
      }

      console.log('🔐 AuthService: Token exchange successful');
    } catch (error) {
      console.error('🔐 AuthService: Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Sign in user with email and password (traditional login)
   */
  async signIn(credentials: LoginCredentials): Promise<User> {
    // FORCE REAL AWS COGNITO AUTHENTICATION - Mock auth completely disabled
    console.log('🔐 AuthService: Using REAL AWS Cognito authentication ONLY');
    console.log('🔐 AuthService: Mock authentication has been COMPLETELY REMOVED');
    console.log('🔐 AuthService: Attempting real sign-in for:', credentials.email);

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: credentials.email,
        password: credentials.password,
      });

      console.log('🔐 AuthService: AWS Cognito response:', { isSignedIn, nextStep });

      // Handle different sign-in states
      if (nextStep && nextStep.signInStep !== 'DONE') {
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_UP':
            throw new Error('Account not confirmed. Please check your email for verification code.');
          case 'RESET_PASSWORD':
            throw new Error('Password reset required. Please reset your password.');
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            throw new Error('MFA token required');
          default:
            throw new Error(`Authentication challenge: ${nextStep.signInStep}`);
        }
      }

      if (!isSignedIn) {
        throw new Error('Sign in failed');
      }

      // Get tokens and store them
      const session = await fetchAuthSession();
      if (session.tokens) {
        const accessToken = session.tokens.accessToken?.toString();
        const idToken = session.tokens.idToken?.toString();

        if (accessToken) {
          TokenManager.setTokens(accessToken, undefined, idToken);
        }
      }

      // Get current user after successful sign-in
      const cognitoUser = await getCurrentUser();

      // Convert to application user format
      const user = await this.cognitoUserToUser(cognitoUser);

      return user;
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Sign up new user
   */
  async signUp(data: SignupData): Promise<{ userId?: string; isSignUpComplete: boolean }> {
    try {
      const result = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            'custom:role': data.role || 'applicant',
          },
        },
      });

      return result;
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await resendSignUpCode({
        username: email,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await resetPassword({
        username: email,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Submit new password with reset code
   */
  async forgotPasswordSubmit(data: PasswordResetData): Promise<void> {
    try {
      await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Change current user's password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await updatePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Sign out current user with optional global sign-out
   */
  async signOut(globalSignOut: boolean = false): Promise<void> {
    // FORCE REAL AWS COGNITO AUTHENTICATION - Mock auth completely disabled
    console.log('AuthService: Signing out using REAL AWS Cognito');

    try {
      if (globalSignOut) {
        // Redirect to Cognito Hosted UI logout
        const signOutUrl = this.buildOAuthSignOutUrl();
        if (typeof window !== 'undefined') {
          window.location.href = signOutUrl;
          return;
        }
      }

      await signOut();
      TokenManager.clearTokens();
    } catch (error) {
      // Even if Cognito sign out fails, clear local tokens
      TokenManager.clearTokens();
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    // FORCE REAL AWS COGNITO AUTHENTICATION - Mock auth completely disabled
    console.log('AuthService: Getting current user from REAL AWS Cognito');

    try {
      const cognitoUser = await getCurrentUser();
      if (!cognitoUser) return null;

      const user = await this.cognitoUserToUser(cognitoUser);
      return user;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      TokenManager.clearTokens();
      return null;
    }
  }

  /**
   * Refresh authentication session
   */
  async refreshSession(): Promise<void> {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      if (session.tokens) {
        const accessToken = session.tokens.accessToken?.toString();
        const idToken = session.tokens.idToken?.toString();

        if (accessToken) {
          TokenManager.setTokens(accessToken, undefined, idToken);
        }
      }
    } catch (error) {
      TokenManager.clearTokens();
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Update user attributes
   */
  async updateUserAttributes(attributes: Record<string, string>): Promise<void> {
    try {
      await updateUserAttributes({
        userAttributes: attributes,
      });
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch {
      return false;
    }
  }

  /**
   * Get current session tokens
   */
  async getTokens(): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken: string;
  } | null> {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        return {
          accessToken: session.tokens.accessToken?.toString() || '',
          refreshToken: '',
          idToken: session.tokens.idToken?.toString() || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(): Promise<void> {
    try {
      await deleteUser();
      TokenManager.clearTokens();
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();