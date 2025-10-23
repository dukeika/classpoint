import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/shared/Layout';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';

export default function Home() {
  const { state, actions } = useAuth();
  const user = state.user;
  const isAdmin = state.user?.role === 'admin';
  const isApplicant = state.user?.role === 'applicant';

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isApplicant) return '/applicant/dashboard';
    return '/jobs';
  };

  return (
    <Layout
      title="AB Holistic Interview Portal"
      description="Secure cloud-native recruitment platform for AB Holistic Health"
      showHeader={true}
      showNavigation={true}
      maxWidth="7xl"
    >
      <div className="py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to AB Holistic Interview Portal
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A secure, cloud-native recruitment platform featuring stage-gated interviews,
            written assessments, video tests, and comprehensive candidate management.
          </p>

          {/* Action Buttons */}
          <div className="mb-16">
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  as={Link}
                  href={getDashboardLink()}
                  variant="primary"
                  size="lg"
                >
                  Go to Dashboard
                </Button>
                <Button
                  as={Link}
                  href="/jobs"
                  variant="outline"
                  size="lg"
                >
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => actions.login()}
                >
                  Sign In
                </Button>
                <Button
                  as={Link}
                  href="/jobs"
                  variant="outline"
                  size="lg"
                >
                  Browse Jobs
                </Button>
              </div>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <div className="text-center">
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
            </Card>

            <Card>
              <div className="text-center">
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
            </Card>

            <Card>
              <div className="text-center">
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
            </Card>
          </div>

          {/* Status Section */}
          <Card>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">System Status</h3>
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
                  <span className="text-green-800 font-medium">Authentication</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}