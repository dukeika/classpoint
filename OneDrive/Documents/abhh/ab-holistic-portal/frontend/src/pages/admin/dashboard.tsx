import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/shared/Layout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import StageManagement from '../../components/admin/StageManagement';
import { useAuth } from '../../contexts/AuthContext';
import { Application } from '../../types/application';

interface DashboardStats {
  jobs: {
    total: number;
    active: number;
    draft: number;
  };
  applications: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  tests: {
    written: number;
    video: number;
    submissions: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    jobs: { total: 0, active: 0, draft: 0 },
    applications: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    tests: { written: 0, video: 0, submissions: 0 }
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stage-management'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // For now, we'll set empty data since these should come from real APIs
      // The APIs for dashboard stats and applications would need to be implemented
      setStats({
        jobs: { total: 0, active: 0, draft: 0 },
        applications: { total: 0, pending: 0, inProgress: 0, completed: 0 },
        tests: { written: 0, video: 0, submissions: 0 }
      });

      // No mock applications - this should come from a real API
      setApplications([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple';
    href?: string;
  }> = ({ title, value, subtitle, color = 'blue', href }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };

    const content = (
      <div className={`card p-6 border-l-4 ${colorClasses[color]} hover:shadow-md transition-shadow`}>
        <div className="flex items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
      </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
  };

  const QuickAction: React.FC<{
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
  }> = ({ title, description, href, icon }) => (
    <Link href={href} className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <Layout user={user} onLogout={logout}>
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="spinner h-12 w-12 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - AB Holistic Interview Portal</title>
      </Head>

      <ProtectedRoute allowedRoles={['admin']}>
        <Layout user={user} onLogout={logout}>
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.name}. Here's what's happening with your recruitment process.
              </p>

              {/* Tab Navigation */}
              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('stage-management')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'stage-management'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Stage Management
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Jobs"
                value={stats.jobs.total}
                subtitle={`${stats.jobs.active} active, ${stats.jobs.draft} draft`}
                color="blue"
                href="/admin/jobs"
              />
              <StatCard
                title="Applications"
                value={stats.applications.total}
                subtitle={`${stats.applications.pending} pending review`}
                color="green"
                href="/admin/applications"
              />
              <StatCard
                title="Test Submissions"
                value={stats.tests.submissions}
                subtitle={`${stats.tests.written} written, ${stats.tests.video} video`}
                color="purple"
                href="/admin/tests"
              />
              <StatCard
                title="In Progress"
                value={stats.applications.inProgress}
                subtitle="Candidates in pipeline"
                color="yellow"
                href="/admin/applications?status=in_progress"
              />
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickAction
                  title="Create New Job"
                  description="Post a new job opening and start receiving applications"
                  href="/admin/jobs/create"
                  icon={
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  }
                />
                <QuickAction
                  title="Review Applications"
                  description="Review and manage pending applications"
                  href="/admin/applications?status=pending"
                  icon={
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
                <QuickAction
                  title="Create Test"
                  description="Design written or video assessments"
                  href="/admin/tests/create"
                  icon={
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="card-body">
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Activity will appear here as users interact with your jobs and applications.
                  </p>
                </div>
              </div>
            </div>
              </>
            ) : (
              /* Stage Management Tab */
              <StageManagement
                applications={applications}
                onRefresh={loadData}
              />
            )}
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default AdminDashboard;