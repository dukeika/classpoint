/**
 * Login Page for AB Holistic Interview Portal
 * Redirects to AWS Cognito Hosted UI for authentication
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth, useIsAuthenticated } from '../../contexts/AuthContext';
import { AuthUtils } from '../../services/auth';

/**
 * AB Holistic logo component
 */
const Logo: React.FC = () => (
  <div className="flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">AB</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">AB Holistic</h1>
        <p className="text-sm text-gray-600">Interview Portal</p>
      </div>
    </div>
  </div>
);

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
);

/**
 * Feature highlight component
 */
const FeatureHighlight: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex items-start space-x-3">
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

/**
 * Login page component
 */
const LoginPage: NextPage = () => {
  const router = useRouter();
  const { actions, state } = useAuth();
  const isAuthenticated = useIsAuthenticated();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = (router.query.redirect as string) || '/';
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router]);

  /**
   * Handle login button click
   * Uses direct redirect for reliability in static exports
   */
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);

      // Build Cognito URL directly for reliability
      const cognitoDomain = 'ab-holistic-portal.auth.us-west-1.amazoncognito.com';
      const clientId = '3npp9udv9uarhb2ob18sj7jgvl';
      // Use trailing slash to match Next.js trailingSlash: true config
      const redirectUri = `${window.location.protocol}//${window.location.host}/auth/callback/`;
      const responseType = 'code';
      const scope = 'openid email profile aws.cognito.signin.user.admin';

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('oauth_state', state);

      const loginUrl = `https://${cognitoDomain}/login?` +
        `response_type=${responseType}&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}`;

      console.log('[Login] Redirecting to:', loginUrl);

      // Force redirect
      window.location.href = loginUrl;
    } catch (error) {
      console.error('[Login] Error:', error);
      setIsLoggingIn(false);
      alert('Login failed. Please try again.');
    }
  };

  /**
   * Don't render if already authenticated (prevents flash)
   */
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Sign In | AB Holistic Interview Portal</title>
        <meta name="description" content="Sign in to access the AB Holistic Interview Portal. Manage your applications, schedule interviews, and track your progress." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <Logo />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Error display */}
            {state.error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Authentication Error
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {AuthUtils.getUserFriendlyErrorMessage(state.error)}
                    </p>
                    {AuthUtils.isRetryableError(state.error) && (
                      <button
                        onClick={actions.clearError}
                        className="mt-2 text-sm text-red-800 underline hover:text-red-900"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login button */}
            <div className="space-y-6">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || state.status === 'loading'}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Redirecting to sign in...</span>
                  </>
                ) : (
                  'Continue with AWS Cognito'
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Secure authentication</span>
                </div>
              </div>

              {/* Security features */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Why use Cognito?</h3>
                <div className="space-y-3">
                  <FeatureHighlight
                    icon={
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    }
                    title="Enterprise Security"
                    description="Multi-factor authentication and secure token management"
                  />
                  <FeatureHighlight
                    icon={
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    title="Data Protection"
                    description="Your credentials are never stored on our servers"
                  />
                  <FeatureHighlight
                    icon={
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                    title="Single Sign-On"
                    description="One account for all AB Holistic services"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <div className="space-x-6 text-sm">
              <a
                href="/"
                className="text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to Home
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For assistance, please contact support@abholistic.com');
                }}
                className="text-gray-600 hover:text-gray-500 transition-colors"
              >
                Need Help?
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Background pattern */}
        <div className="hidden lg:block absolute inset-0 z-0">
          <svg className="absolute inset-0 h-full w-full text-gray-200" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,0 60,40 100,50 60,60 50,100 40,60 0,50 40,40" opacity="0.1" />
          </svg>
        </div>
      </div>
    </>
  );
};

export default LoginPage;