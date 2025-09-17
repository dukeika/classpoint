import React, { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import { useErrorHandler } from '../../hooks/useErrorHandler';

/**
 * Enhanced login form validation schema
 */
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Props for LoginForm component
 */
interface LoginFormProps {
  /** Callback when login is successful */
  onSuccess?: () => void;
  /** Callback to switch to signup form */
  onSwitchToSignup?: () => void;
  /** Whether to show the signup switch option */
  showSignupSwitch?: boolean;
  /** Whether to show the remember me option */
  showRememberMe?: boolean;
  /** Whether to show the forgot password link */
  showForgotPassword?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether form is disabled */
  disabled?: boolean;
}

/**
 * Enhanced LoginForm component with improved validation, loading states, and accessibility
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  showSignupSwitch = true,
  showRememberMe = true,
  showForgotPassword = true,
  className,
  disabled = false,
}) => {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const { errorState, handleError, clearError } = useErrorHandler({
    context: 'LoginForm',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Watch form values for better UX feedback - removed unused variable

  /**
   * Check if form has too many failed attempts
   */
  const tooManyAttempts = useMemo(() => loginAttempts >= 5, [loginAttempts]);

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Clear all errors
   */
  const handleClearErrors = useCallback(() => {
    clearError();
  }, [clearError]);

  /**
   * Handle form submission with enhanced error handling
   */
  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      // Clear any previous errors
      handleClearErrors();

      // Check for too many attempts
      if (tooManyAttempts) {
        handleError(new Error('Too many login attempts. Please wait before trying again.'));
        return;
      }

      // Attempt login
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      // Reset attempts on successful login
      setLoginAttempts(0);

      // Call success callback
      onSuccess?.();
    } catch (error) {
      // Increment failed attempts
      setLoginAttempts(prev => prev + 1);

      // Handle the error
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error('Login failed. Please try again.'));
      }
    }
  }, [handleClearErrors, tooManyAttempts, login, onSuccess, handleError]);

  /**
   * Handle form reset
   */
  const handleReset = useCallback(() => {
    reset();
    setLoginAttempts(0);
    handleClearErrors();
  }, [reset, handleClearErrors]);

  /**
   * Get the current error to display
   */
  const displayError = useMemo(() => {
    return error || errorState.error?.message || null;
  }, [error, errorState.error]);

  /**
   * Check if form should be disabled
   */
  const isFormDisabled = useMemo(() => {
    return disabled || isLoading || isSubmitting || tooManyAttempts;
  }, [disabled, isLoading, isSubmitting, tooManyAttempts]);

  return (
    <div className={`w-full max-w-md mx-auto ${className || ''}`}>
      <div className="bg-white shadow-lg rounded-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
          <p className="text-gray-600 mt-2">Welcome back to AB Holistic Interview Portal</p>
        </div>

        {/* Loading overlay for better UX */}
        {(isLoading || isSubmitting) && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-700">Signing in...</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {displayError && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-red-800 text-sm font-medium">Login Failed</p>
                <p className="text-red-700 text-sm mt-1">{displayError}</p>
                {loginAttempts > 1 && (
                  <p className="text-red-600 text-xs mt-2">
                    Attempt {loginAttempts} of 5
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Too many attempts warning */}
        {tooManyAttempts && (
          <div
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-yellow-800 text-sm font-medium">Account Temporarily Locked</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Too many failed login attempts. Please wait a few minutes before trying again.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
              disabled={isFormDisabled}
              {...register('email')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p
                id="email-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : 'password-help'}
                aria-invalid={!!errors.password}
                disabled={isFormDisabled}
                {...register('password')}
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors duration-200 ${
                  errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } ${isFormDisabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isFormDisabled}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:cursor-not-allowed"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {errors.password.message}
              </p>
            )}
            {!errors.password && (
              <p
                id="password-help"
                className="mt-1 text-xs text-gray-500"
              >
                Minimum 8 characters required
              </p>
            )}
          </div>

          {/* Remember me and forgot password */}
          <div className="flex items-center justify-between">
            {showRememberMe && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  disabled={isFormDisabled}
                  {...register('rememberMe')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
            )}

            {showForgotPassword && (
              <button
                type="button"
                disabled={isFormDisabled}
                className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Forgot password?
              </button>
            )}
          </div>

          {/* Form validation summary */}
          {Object.keys(errors).length > 0 && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-red-800 font-medium">Please fix the following errors:</p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading || isSubmitting}
            disabled={isFormDisabled || !isDirty}
            aria-describedby="submit-help"
          >
            {isLoading || isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Submit help text */}
          <p id="submit-help" className="text-xs text-gray-500 text-center">
            {!isDirty
              ? 'Please fill in your credentials to continue'
              : isFormDisabled
              ? 'Please wait...'
              : 'Click to sign in to your account'
            }
          </p>

          {/* Development reset button */}
          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
            >
              Reset Form (Dev)
            </button>
          )}
        </form>

        {/* Signup switch */}
        {showSignupSwitch && onSwitchToSignup && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                disabled={isFormDisabled}
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:underline disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Create Account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LoginForm);