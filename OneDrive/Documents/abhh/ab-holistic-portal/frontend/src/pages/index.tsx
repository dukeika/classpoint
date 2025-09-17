import React, { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect authenticated users to their appropriate dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/applicant/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show home page to unauthenticated users
  return (
    <>
      <Head>
        <title>AB Holistic Interview Portal</title>
        <meta name="description" content="Secure cloud-native recruitment platform for AB Holistic Health" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="AB Holistic Health"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <h1 className="text-xl font-semibold text-gray-900">
                  AB Holistic Interview Portal
                </h1>
              </div>
              <div className="flex space-x-4">
                <Link href="/auth/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Welcome to AB Holistic Interview Portal
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A secure, cloud-native recruitment platform featuring stage-gated interviews,
              written assessments, video tests, and comprehensive candidate management.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">5-Stage Process</h3>
                <p className="text-gray-600">
                  Apply → Written Test → Video Test → Final Interview → Decision
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Compliant</h3>
                <p className="text-gray-600">
                  End-to-end encryption, GDPR compliance, and secure file storage
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Assessment</h3>
                <p className="text-gray-600">
                  Browser-based video recording with real-time validation
                </p>
              </div>
            </div>

            {/* Status Section */}
            <div className="mt-16 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">System Status</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Backend API</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Database</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">File Storage</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Available
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-medium">Notifications</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* API Information */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">API Endpoints</h4>
              <p className="text-sm text-gray-600 font-mono">
                {process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://7llou9r67j.execute-api.us-west-1.amazonaws.com/dev'}
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; 2025 Applied Behavioral Holistic Health. All rights reserved.</p>
              <p className="mt-2 text-sm">Secure cloud-native recruitment platform</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}