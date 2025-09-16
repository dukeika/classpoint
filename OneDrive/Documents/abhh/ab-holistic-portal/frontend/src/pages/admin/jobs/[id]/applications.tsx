import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/shared/Layout';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import Button from '../../../../components/shared/Button';
import { Job } from '../../../../types/job';
import { Application } from '../../../../types/application';

const JobApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (id) {
      // Simulate API calls to fetch job and applications
      setTimeout(() => {
        const mockJob: Job = {
          jobId: id as string,
          title: 'Senior Software Engineer',
          description: 'We are looking for an experienced software engineer...',
          requirements: ['5+ years experience', 'React/Node.js', 'TypeScript'],
          status: 'published',
          createdBy: 'admin@abholistic.com',
          createdAt: '2025-01-10T10:00:00Z',
          deadline: '2025-02-15T23:59:59Z',
          location: 'Remote',
          employmentType: 'full-time',
          department: 'Engineering'
        };

        const mockApplications: Application[] = [
          {
            applicationId: '1',
            jobId: id as string,
            applicantId: 'user1',
            applicantEmail: 'john.doe@email.com',
            applicantName: 'John Doe',
            currentStage: 'applied',
            appliedAt: '2025-01-11T09:00:00Z',
            lastActivityAt: '2025-01-11T09:00:00Z',
            status: 'active',
            score: 85,
            notes: 'Strong technical background'
          },
          {
            applicationId: '2',
            jobId: id as string,
            applicantId: 'user2',
            applicantEmail: 'jane.smith@email.com',
            applicantName: 'Jane Smith',
            currentStage: 'written-test',
            appliedAt: '2025-01-12T14:30:00Z',
            lastActivityAt: '2025-01-13T10:15:00Z',
            status: 'active',
            score: 92,
            notes: 'Excellent problem-solving skills',
            writtenTestScore: 92,
            writtenTestCompletedAt: '2025-01-13T10:15:00Z'
          },
          {
            applicationId: '3',
            jobId: id as string,
            applicantId: 'user3',
            applicantEmail: 'mike.johnson@email.com',
            applicantName: 'Mike Johnson',
            currentStage: 'video-test',
            appliedAt: '2025-01-09T16:45:00Z',
            lastActivityAt: '2025-01-14T11:30:00Z',
            status: 'active',
            score: 78,
            notes: 'Good communication skills',
            writtenTestScore: 78,
            writtenTestCompletedAt: '2025-01-12T15:20:00Z'
          },
          {
            applicationId: '4',
            jobId: id as string,
            applicantId: 'user4',
            applicantEmail: 'sarah.wilson@email.com',
            applicantName: 'Sarah Wilson',
            currentStage: 'final-interview',
            appliedAt: '2025-01-08T11:20:00Z',
            lastActivityAt: '2025-01-15T09:45:00Z',
            status: 'active',
            score: 95,
            notes: 'Outstanding candidate',
            writtenTestScore: 95,
            writtenTestCompletedAt: '2025-01-10T14:30:00Z',
            videoTestScore: 90,
            videoTestCompletedAt: '2025-01-12T16:15:00Z'
          },
          {
            applicationId: '5',
            jobId: id as string,
            applicantId: 'user5',
            applicantEmail: 'david.brown@email.com',
            applicantName: 'David Brown',
            currentStage: 'rejected',
            appliedAt: '2025-01-07T13:10:00Z',
            lastActivityAt: '2025-01-11T12:00:00Z',
            status: 'rejected',
            score: 45,
            notes: 'Did not meet minimum requirements',
            writtenTestScore: 45,
            writtenTestCompletedAt: '2025-01-09T10:30:00Z'
          }
        ];

        setJob(mockJob);
        setApplications(mockApplications);
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const getStageDisplay = (stage: Application['currentStage']) => {
    const stages: Record<Application['currentStage'], { label: string; color: string }> = {
      applied: { label: 'Application Submitted', color: 'bg-blue-100 text-blue-800' },
      screening: { label: 'Screening', color: 'bg-indigo-100 text-indigo-800' },
      'written-test': { label: 'Written Test', color: 'bg-yellow-100 text-yellow-800' },
      'video-test': { label: 'Video Test', color: 'bg-purple-100 text-purple-800' },
      'final-interview': { label: 'Final Interview', color: 'bg-green-100 text-green-800' },
      'decision': { label: 'Decision', color: 'bg-gray-100 text-gray-800' },
      'accepted': { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      'withdrawn': { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
    };

    const stageInfo = stages[stage];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageInfo.color}`}>
        {stageInfo.label}
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'active') return app.status === 'active';
    if (filter === 'rejected') return app.status === 'rejected';
    return app.currentStage === filter;
  });

  const applicationStats = {
    total: applications.length,
    active: applications.filter(app => app.status === 'active').length,
    pending: applications.filter(app => app.currentStage === 'applied').length,
    inProgress: applications.filter(app => ['written-test', 'video-test', 'final-interview'].includes(app.currentStage)).length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
            <p className="mt-2 text-gray-500">The job you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Link href="/admin/jobs">
                <Button variant="primary">Back to Jobs</Button>
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <>
      <Head>
        <title>Applications for {job.title} - Admin Dashboard</title>
      </Head>

      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href={`/admin/jobs/${job.jobId}`}>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                  <p className="text-gray-600 mt-2">
                    Applications for <span className="font-medium">{job.title}</span>
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Link href={`/admin/jobs/${job.jobId}`}>
                  <Button variant="secondary" size="sm">View Job</Button>
                </Link>
                <Button variant="primary" size="sm">
                  Export Applications
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{applicationStats.total}</div>
                <div className="text-sm text-gray-500">Total Applications</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{applicationStats.active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600">{applicationStats.pending}</div>
                <div className="text-sm text-gray-500">Pending Review</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{applicationStats.inProgress}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-red-600">{applicationStats.rejected}</div>
                <div className="text-sm text-gray-500">Rejected</div>
              </div>
            </div>

            {/* Filters */}
            <div className="card p-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({applications.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active ({applicationStats.active})
                </button>
                <button
                  onClick={() => setFilter('applied')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'applied'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Applied ({applicationStats.pending})
                </button>
                <button
                  onClick={() => setFilter('written-test')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'written-test'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Written Test
                </button>
                <button
                  onClick={() => setFilter('video-test')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'video-test'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Video Test
                </button>
                <button
                  onClick={() => setFilter('final-interview')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'final-interview'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Final Interview
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'rejected'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected ({applicationStats.rejected})
                </button>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12 card">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'all'
                      ? 'No applications have been submitted for this job yet.'
                      : `No applications match the current filter.`
                    }
                  </p>
                </div>
              ) : (
                filteredApplications.map((application) => (
                  <div key={application.applicationId} className="card p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.applicantName}
                          </h3>
                          {getStageDisplay(application.currentStage)}
                        </div>

                        <p className="text-gray-600 mt-1">{application.applicantEmail}</p>

                        <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Applied: {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Last activity: {new Date(application.lastActivityAt).toLocaleDateString()}
                          </span>
                          {application.score && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Score: <span className={`font-medium ${getScoreColor(application.score)}`}>{application.score}%</span>
                            </span>
                          )}
                        </div>

                        {/* Test Scores */}
                        {(application.writtenTestScore || application.videoTestScore) && (
                          <div className="flex space-x-4 mt-3">
                            {application.writtenTestScore && (
                              <div className="bg-gray-50 px-3 py-1 rounded text-sm">
                                Written Test: <span className={`font-medium ${getScoreColor(application.writtenTestScore)}`}>
                                  {application.writtenTestScore}%
                                </span>
                              </div>
                            )}
                            {application.videoTestScore && (
                              <div className="bg-gray-50 px-3 py-1 rounded text-sm">
                                Video Test: <span className={`font-medium ${getScoreColor(application.videoTestScore)}`}>
                                  {application.videoTestScore}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {application.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {application.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-6">
                        <Link href={`/admin/applications/${application.applicationId}`}>
                          <Button variant="primary" size="sm">View Details</Button>
                        </Link>
                        {application.status === 'active' && (
                          <Button variant="secondary" size="sm">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default JobApplicationsPage;