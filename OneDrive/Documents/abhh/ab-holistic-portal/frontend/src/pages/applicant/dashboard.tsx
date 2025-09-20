import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/shared/Layout';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import Button from '../../components/shared/Button';
import { Application, ApplicationStage } from '../../types/application';
import { Job } from '../../types/job';

const ApplicantDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<(Application & { job: Job })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Check if redirected from successful application submission
    if (router.query.submitted === 'true') {
      setShowSuccessMessage(true);
      // Remove the query parameter
      router.replace('/applicant/dashboard', undefined, { shallow: true });
    }

    // Load user's applications from API
    const loadApplications = async () => {
      try {
        setIsLoading(true);

        // For now, set empty applications since this should come from a real API
        // The API for user's applications would need to be implemented
        setApplications([]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading applications:', error);
        setApplications([]);
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [router, user]);

  const getStageInfo = (stage: ApplicationStage) => {
    const stageMap = {
      applied: {
        label: 'Application Submitted',
        color: 'bg-blue-100 text-blue-800',
        description: 'Your application has been received and is under review.',
        progress: 20
      },
      screening: {
        label: 'Under Review',
        color: 'bg-indigo-100 text-indigo-800',
        description: 'Our team is reviewing your application.',
        progress: 30
      },
      'written-test': {
        label: 'Written Test',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Complete the technical assessment to proceed.',
        progress: 50
      },
      'video-test': {
        label: 'Video Test',
        color: 'bg-purple-100 text-purple-800',
        description: 'Record video responses to interview questions.',
        progress: 70
      },
      'final-interview': {
        label: 'Final Interview',
        color: 'bg-green-100 text-green-800',
        description: 'Schedule your final interview with the hiring team.',
        progress: 85
      },
      decision: {
        label: 'Final Decision',
        color: 'bg-gray-100 text-gray-800',
        description: 'We are making our final decision.',
        progress: 95
      },
      accepted: {
        label: 'Accepted',
        color: 'bg-green-100 text-green-800',
        description: 'Congratulations! You have been selected for this position.',
        progress: 100
      },
      rejected: {
        label: 'Not Selected',
        color: 'bg-red-100 text-red-800',
        description: 'Thank you for your interest. We have decided to move forward with other candidates.',
        progress: 100
      },
      withdrawn: {
        label: 'Withdrawn',
        color: 'bg-gray-100 text-gray-800',
        description: 'Application has been withdrawn.',
        progress: 100
      }
    };

    return stageMap[stage];
  };

  const getNextAction = (application: Application & { job: Job }) => {
    switch (application.currentStage) {
      case 'written-test':
        if (application.writtenTestScore) {
          return {
            label: 'View Test Results',
            href: `/applicant/applications/${application.applicationId}`,
            variant: 'outline' as const
          };
        }
        return {
          label: 'Take Written Test',
          href: `/applicant/tests/test-${application.jobId}`,
          variant: 'primary' as const
        };
      case 'video-test':
        if (application.videoTestScore) {
          return {
            label: 'View Video Results',
            href: `/applicant/applications/${application.applicationId}`,
            variant: 'outline' as const
          };
        }
        return {
          label: 'Record Video Test',
          href: `/applicant/tests/video/video-${application.jobId}`,
          variant: 'primary' as const
        };
      case 'final-interview':
        return {
          label: 'Schedule Interview',
          href: `/applicant/interview/schedule/${application.applicationId}`,
          variant: 'primary' as const
        };
      default:
        return {
          label: 'View Details',
          href: `/applicant/applications/${application.applicationId}`,
          variant: 'secondary' as const
        };
    }
  };

  const stats = {
    total: applications.length,
    active: applications.filter(app => app.status === 'active').length,
    inReview: applications.filter(app => ['applied', 'screening'].includes(app.currentStage)).length,
    testsCompleted: applications.filter(app =>
      ['video-test', 'final-interview', 'decision', 'accepted'].includes(app.currentStage)
    ).length
  };

  return (
    <>
      <Head>
        <title>My Applications - Applied Behavioral Holistic Health</title>
        <meta name="description" content="Track your job applications and take required assessments" />
      </Head>

      <ProtectedRoute requireRole="applicant">
        <Layout user={user} onLogout={logout}>
          <div className="space-y-8">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Application Submitted Successfully!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your application has been received and is being reviewed by our team.
                        You'll receive an email notification once we move to the next stage.
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowSuccessMessage(false)}
                        className="text-sm font-medium text-green-800 hover:text-green-600"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-2">
                Track your application progress and complete required assessments
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Applications</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.inReview}</div>
                <div className="text-sm text-gray-500">Under Review</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{stats.testsCompleted}</div>
                <div className="text-sm text-gray-500">Tests Completed</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link href="/jobs">
                  <Button variant="primary">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Browse Jobs
                  </Button>
                </Link>
                <Button variant="secondary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Update Profile
                </Button>
                <Button variant="secondary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Upload Resume
                </Button>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="spinner h-12 w-12 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 card">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by browsing our open positions and applying to jobs that interest you.
                  </p>
                  <div className="mt-6">
                    <Link href="/jobs">
                      <Button variant="primary">Browse Open Positions</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {applications.map((application) => {
                    const stageInfo = getStageInfo(application.currentStage);
                    const nextAction = getNextAction(application);

                    return (
                      <div key={application.applicationId} className="card p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {application.job.title}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stageInfo.color}`}>
                                {stageInfo.label}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {application.job.department}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {application.job.location}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Applied {new Date(application.appliedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-4">{stageInfo.description}</p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span>{stageInfo.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${stageInfo.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Test Scores */}
                            {(application.writtenTestScore || application.videoTestScore) && (
                              <div className="flex space-x-4 mb-4">
                                {application.writtenTestScore && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    <div className="text-sm font-medium text-green-800">
                                      Written Test: {application.writtenTestScore}%
                                    </div>
                                    <div className="text-xs text-green-600">
                                      Completed {application.writtenTestCompletedAt && new Date(application.writtenTestCompletedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                                {application.videoTestScore && (
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                    <div className="text-sm font-medium text-purple-800">
                                      Video Test: {application.videoTestScore}%
                                    </div>
                                    <div className="text-xs text-purple-600">
                                      Completed {application.videoTestCompletedAt && new Date(application.videoTestCompletedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="ml-6 flex flex-col space-y-2">
                            <Link href={nextAction.href}>
                              <Button variant={nextAction.variant} size="sm">
                                {nextAction.label}
                              </Button>
                            </Link>
                            <Link href={`/jobs/${application.job.jobId}`}>
                              <Button variant="ghost" size="sm">View Job</Button>
                            </Link>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Application Timeline</h4>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                              <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                            </div>
                            {application.writtenTestCompletedAt && (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                                <span>Written test completed {new Date(application.writtenTestCompletedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {application.videoTestCompletedAt && (
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                                <span>Video test completed {new Date(application.videoTestCompletedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 mb-4">
                If you have questions about your application or need technical support, we're here to help.
              </p>
              <div className="flex space-x-4">
                <Button variant="secondary" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </Button>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View FAQ
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default ApplicantDashboard;