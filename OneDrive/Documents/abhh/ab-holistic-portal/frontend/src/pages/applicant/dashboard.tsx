/**
 * Applicant Dashboard
 * Overview page for job applicants
 */

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Layout from '../../components/shared/Layout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';
import { jobService } from '../../services/jobService';
import { Job, Application, APPLICATION_STAGES } from '../../types/job';

interface ApplicantDashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  recentJobs: Job[];
  myApplications: Application[];
}

const ApplicantDashboardComponent: React.FC = () => {
  const { state } = useAuth();
  const user = state.user;
  const [stats, setStats] = useState<ApplicantDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load my applications
      let myApplications: Application[] = [];
      try {
        const applicationsResponse = await jobService.getMyApplications(1, 10);
        myApplications = applicationsResponse.data || [];
      } catch (appErr) {
        console.warn('Failed to load applications, user may not have any:', appErr);
      }

      // Load recent published jobs
      const jobsResponse = await jobService.getJobs({ status: 'published' }, 1, 6);
      const recentJobs = jobsResponse.data || [];

      // Calculate stats from applications
      const totalApplications = myApplications.length;
      const activeApplications = myApplications.filter(app =>
        !['hired', 'rejected', 'withdrawn'].includes(app.stage)
      ).length;

      const interviewsScheduled = myApplications.filter(app =>
        ['first_interview', 'second_interview', 'final_interview'].includes(app.stage)
      ).length;

      const offersReceived = myApplications.filter(app =>
        app.stage === 'offer_extended'
      ).length;

      setStats({
        totalApplications,
        activeApplications,
        interviewsScheduled,
        offersReceived,
        recentJobs,
        myApplications: myApplications.slice(0, 5), // Show only first 5 for dashboard
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStageColor = (stage: string) => {
    const stageConfig = APPLICATION_STAGES.find(s => s.value === stage);
    return stageConfig?.color || 'gray';
  };

  const getStageLabel = (stage: string) => {
    const stageConfig = APPLICATION_STAGES.find(s => s.value === stage);
    return stageConfig?.label || stage;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <Layout title="Applicant Dashboard" maxWidth="7xl">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout title="Applicant Dashboard" maxWidth="7xl">
        <div className="py-12">
          <Card variant="outlined" className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={loadDashboardData}>
              Try Again
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard - AB Holistic Interview Portal"
      description="Your personal dashboard for job applications and opportunities"
      maxWidth="7xl"
    >
        <div className="py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getGreeting()}, {user?.firstName}!
                </h1>
                <p className="mt-2 text-gray-600">
                  Track your applications and discover new opportunities
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button as={Link} href="/jobs" variant="primary">
                  Browse Jobs
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Total Applications</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Active Applications</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeApplications}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Interviews</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.interviewsScheduled}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-500">Offers</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.offersReceived}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Applications */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">My Applications</h2>
                  <Button as={Link} href="/applicant/applications" variant="ghost" size="sm">
                    View All
                  </Button>
                </div>

                {stats.myApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No applications yet. Start by browsing available jobs!</p>
                    <Button as={Link} href="/jobs" variant="primary" size="sm" className="mt-3">
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.myApplications.map((application) => (
                      <div key={application.applicationId} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/applicant/applications/${application.applicationId}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {application.job?.title || 'Job Title'}
                            </Link>
                            <div className="text-sm text-gray-500 mt-1">
                              Applied {formatDate(application.appliedAt)}
                            </div>
                          </div>
                          <Badge variant={getStageColor(application.stage) as any} size="sm">
                            {getStageLabel(application.stage)}
                          </Badge>
                        </div>

                        {application.nextActionDate && (
                          <div className="mt-2 text-sm text-blue-600">
                            Next action: {formatDate(application.nextActionDate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Recommended Jobs */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Latest Opportunities</h2>
                  <Button as={Link} href="/jobs" variant="ghost" size="sm">
                    Browse All
                  </Button>
                </div>

                {stats.recentJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    <p>No job opportunities available at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                            <div className="text-sm text-gray-500 mt-1">
                              {job.department} • {job.location}
                            </div>
                            <div className="flex gap-1 mt-2">
                              {job.skills.slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {job.skills.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  +{job.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(job.createdAt || new Date().toISOString())}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button as={Link} href="/jobs" variant="outline" className="justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Jobs
                </Button>

                <Button as={Link} href="/applicant/applications" variant="outline" className="justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  My Applications
                </Button>

                <Button as={Link} href="/applicant/profile" variant="outline" className="justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Edit Profile
                </Button>

                <Button as={Link} href="/applicant/tests" variant="outline" className="justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Tests & Assessments
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
  );
};

// Wrap the component with ProtectedRoute
const ApplicantDashboard: NextPage = () => {
  return (
    <ProtectedRoute
      component={ApplicantDashboardComponent}
      requiredRole="applicant"
    />
  );
};

export default ApplicantDashboard;