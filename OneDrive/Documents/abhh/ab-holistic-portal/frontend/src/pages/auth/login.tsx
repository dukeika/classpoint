import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';

const AuthPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/applicant/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSuccess = () => {
    // Redirect will be handled by useEffect
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Sign In' : 'Create Account'} - AB Holistic Interview Portal</title>
        <meta name="description" content="Access your AB Holistic interview portal account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="AB Holistic Health"
              width={80}
              height={80}
              className="mx-auto"
            />
          </div>
          <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
            AB Holistic Interview Portal
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure cloud-native recruitment platform
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToSignup={() => setMode('signup')}
            />
          ) : (
            <SignupForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secure authentication powered by AWS Cognito
          </p>
        </div>
      </div>
    </>
  );
};

export default AuthPage;