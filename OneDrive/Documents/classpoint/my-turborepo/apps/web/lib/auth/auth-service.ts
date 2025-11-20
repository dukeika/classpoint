import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  type SignInInput,
  type SignUpInput,
} from 'aws-amplify/auth'

export interface AuthUser {
  username: string
  userId: string
  signInDetails?: {
    loginId?: string
  }
}

export interface AuthSession {
  tokens?: {
    accessToken?: {
      toString(): string
    }
    idToken?: {
      toString(): string
      payload?: Record<string, any>
    }
  }
  credentials?: Record<string, any>
  identityId?: string
  userSub?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantId?: string
  roles?: string
}

export interface ConfirmSignupData {
  username: string
  confirmationCode: string
}

export interface ResetPasswordData {
  username: string
}

export interface ConfirmResetPasswordData {
  username: string
  confirmationCode: string
  newPassword: string
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async login({ email, password }: LoginCredentials) {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password,
      })

      if (isSignedIn) {
        const user = await this.getCurrentUser()
        const session = await this.getSession()
        return { user, session, nextStep }
      }

      return { user: null, session: null, nextStep }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Sign up new user (Admin creates staff accounts)
   */
  async signup({
    email,
    password,
    firstName,
    lastName,
    tenantId,
    roles,
  }: SignupData) {
    try {
      const signUpInput: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            ...(tenantId && { 'custom:tenant_id': tenantId }),
            ...(roles && { 'custom:roles': roles }),
          },
          autoSignIn: true,
        },
      }

      const { isSignUpComplete, userId, nextStep } = await signUp(signUpInput)

      return { isSignUpComplete, userId, nextStep }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  /**
   * Confirm signup with verification code
   */
  async confirmSignup({ username, confirmationCode }: ConfirmSignupData) {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode,
      })

      return { isSignUpComplete, nextStep }
    } catch (error) {
      console.error('Confirm signup error:', error)
      throw error
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(username: string) {
    try {
      await resendSignUpCode({ username })
      return { success: true }
    } catch (error) {
      console.error('Resend code error:', error)
      throw error
    }
  }

  /**
   * Sign out current user
   */
  async logout() {
    try {
      await signOut()
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await getCurrentUser()
      return user as AuthUser
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  /**
   * Get current auth session (includes tokens)
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const session = await fetchAuthSession()
      return session as AuthSession
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  /**
   * Get ID token from session
   */
  async getIdToken(): Promise<string | null> {
    try {
      const session = await this.getSession()
      return session?.tokens?.idToken?.toString() || null
    } catch (error) {
      console.error('Get ID token error:', error)
      return null
    }
  }

  /**
   * Get access token from session
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.getSession()
      return session?.tokens?.accessToken?.toString() || null
    } catch (error) {
      console.error('Get access token error:', error)
      return null
    }
  }

  /**
   * Get user attributes from ID token
   */
  async getUserAttributes(): Promise<Record<string, any> | null> {
    try {
      const session = await this.getSession()
      return session?.tokens?.idToken?.payload || null
    } catch (error) {
      console.error('Get user attributes error:', error)
      return null
    }
  }

  /**
   * Initialize password reset
   */
  async resetPassword({ username }: ResetPasswordData) {
    try {
      const output = await resetPassword({ username })
      return { success: true, nextStep: output.nextStep }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Confirm password reset with code and new password
   */
  async confirmResetPassword({
    username,
    confirmationCode,
    newPassword,
  }: ConfirmResetPasswordData) {
    try {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword,
      })
      return { success: true }
    } catch (error) {
      console.error('Confirm reset password error:', error)
      throw error
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch (error) {
      return false
    }
  }
}

export const authService = new AuthService()
