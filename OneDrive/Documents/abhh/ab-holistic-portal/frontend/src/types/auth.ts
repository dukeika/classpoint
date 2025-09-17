/**
 * User role types
 */
export type UserRole = 'admin' | 'applicant' | 'superadmin';

/**
 * User attribute values that can be stored
 */
export type UserAttributeValue = string | number | boolean | Date;

/**
 * User interface representing authenticated users
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User email address */
  email: string;
  /** Full display name */
  name: string;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
  /** User role determining permissions */
  role: UserRole;
  /** Avatar URL or base64 image */
  avatar?: string;
  /** User groups for permissions */
  groups?: string[];
  /** Additional user attributes */
  attributes?: Record<string, UserAttributeValue>;
  /** User profile status */
  profileStatus?: 'incomplete' | 'pending' | 'verified' | 'suspended';
  /** Last login timestamp */
  lastLogin?: string;
  /** Account creation timestamp */
  createdAt?: string;
  /** Profile update timestamp */
  updatedAt?: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Current authentication error */
  error: string | null;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** Remember me option */
  rememberMe?: boolean;
}

/**
 * Signup data interface
 */
export interface SignupData {
  /** User email address */
  email: string;
  /** User password */
  password: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** User role - defaults to applicant for self-registration */
  role?: UserRole;
  /** Terms acceptance */
  acceptTerms?: boolean;
  /** Marketing consent */
  marketingConsent?: boolean;
}

/**
 * Password reset data interface
 */
export interface PasswordResetData {
  /** User email */
  email: string;
  /** Reset code */
  code: string;
  /** New password */
  newPassword: string;
  /** Confirm new password */
  confirmPassword: string;
}

/**
 * Authentication error types
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'account_not_confirmed'
  | 'account_disabled'
  | 'password_expired'
  | 'too_many_attempts'
  | 'network_error'
  | 'server_error'
  | 'unknown_error';

/**
 * Authentication error interface
 */
export interface AuthError {
  /** Error type */
  type: AuthErrorType;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Authentication context type with all auth operations
 */
export interface AuthContextType extends AuthState {
  /** Login with credentials */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Sign up new user */
  signup: (data: SignupData) => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
  /** Confirm signup with verification code */
  confirmSignup: (email: string, code: string) => Promise<void>;
  /** Resend confirmation code */
  resendConfirmation: (email: string) => Promise<void>;
  /** Request password reset */
  forgotPassword: (email: string) => Promise<void>;
  /** Reset password with code */
  resetPassword: (data: PasswordResetData) => Promise<void>;
  /** Refresh authentication state */
  refreshAuth: () => Promise<void>;
  /** Update user profile */
  updateProfile: (updates: Partial<User>) => Promise<void>;
  /** Change password */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}