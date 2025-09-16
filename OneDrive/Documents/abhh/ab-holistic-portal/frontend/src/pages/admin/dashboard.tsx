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
  const { user } = useAuth();
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

  const loadData = () => {
    // Simulate loading stats and applications
    setTimeout(() => {
      setStats({
        jobs: { total: 12, active: 8, draft: 4 },
        applications: { total: 156, pending: 23, inProgress: 45, completed: 88 },
        tests: { written: 15, video: 12, submissions: 342 }
      });

      // Mock applications data
      const mockApplications: any[] = [
        {
          applicationId: '1',
          jobId: '1',
          applicantId: 'user1',
          applicantEmail: 'john.doe@example.com',
          applicantName: 'John Doe',
          currentStage: 'written-test',
          appliedAt: '2025-01-10T09:00:00Z',
          lastActivityAt: '2025-01-11T10:15:00Z',
          status: 'active',
          writtenTestScore: 85,
          writtenTestCompletedAt: '2025-01-11T10:15:00Z',
          job: {
            jobId: '1',
            title: 'Senior Software Engineer',
            description: 'We are looking for an experienced software engineer...',
            requirements: ['5+ years experience', 'React/Node.js', 'TypeScript'],
            status: 'published',
            createdBy: 'admin@abholistic.com',
            createdAt: '2025-01-08T09:00:00Z',
            deadline: '2025-02-15T23:59:59Z',
            location: 'Remote',
            employmentType: 'full-time',
            department: 'Engineering',
            salary: '$120,000 - $160,000'
          }
        },
        {
          applicationId: '2',
          jobId: '1',
          applicantId: 'user2',
          applicantEmail: 'jane.smith@example.com',
          applicantName: 'Jane Smith',
          currentStage: 'video-test',
          appliedAt: '2025-01-09T14:30:00Z',
          lastActivityAt: '2025-01-12T16:20:00Z',
          status: 'active',
          writtenTestScore: 92,
          writtenTestCompletedAt: '2025-01-11T14:30:00Z',
          videoTestScore: 88,
          videoTestCompletedAt: '2025-01-12T16:20:00Z',
          job: {
            jobId: '1',
            title: 'Senior Software Engineer',
            description: 'We are looking for an experienced software engineer...',
            requirements: ['5+ years experience', 'React/Node.js', 'TypeScript'],
            status: 'published',
            createdBy: 'admin@abholistic.com',
            createdAt: '2025-01-08T09:00:00Z',
            deadline: '2025-02-15T23:59:59Z',
            location: 'Remote',
            employmentType: 'full-time',
            department: 'Engineering',
            salary: '$120,000 - $160,000'
          }
        },
        {
          applicationId: '3',
          jobId: '1',
          applicantId: 'user3',
          applicantEmail: 'mike.johnson@example.com',
          applicantName: 'Mike Johnson',
          currentStage: 'final-interview',
          appliedAt: '2025-01-08T11:00:00Z',
          lastActivityAt: '2025-01-13T09:45:00Z',
          status: 'active',
          writtenTestScore: 78,
          writtenTestCompletedAt: '2025-01-09T11:00:00Z',
          videoTestScore: 85,
          videoTestCompletedAt: '2025-01-10T15:30:00Z',
          job: {
            jobId: '1',
            title: 'Senior Software Engineer',
            description: 'We are looking for an experienced software engineer...',
            requirements: ['5+ years experience', 'React/Node.js', 'TypeScript'],
            status: 'published',
            createdBy: 'admin@abholistic.com',
            createdAt: '2025-01-08T09:00:00Z',
            deadline: '2025-02-15T23:59:59Z',
            location: 'Remote',
            employmentType: 'full-time',
            department: 'Engineering',
            salary: '$120,000 - $160,000'
          }
        }
      ];

      setApplications(mockApplications);
      setIsLoading(false);
    }, 1000);
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
      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
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

      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
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
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New application received</p>
                      <p className="text-sm text-gray-600">John Doe applied for Software Engineer position</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Test submitted</p>
                      <p className="text-sm text-gray-600">Sarah Smith completed written assessment</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Video interview scheduled</p>
                      <p className="text-sm text-gray-600">Final interview with Mike Johnson for Marketing Manager</p>
                      <p className="text-xs text-gray-500">6 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Link href="/admin/activity" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                    View all activity →
                  </Link>
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