import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { Application, ApplicationStage } from '../../../types/application';
import { Job } from '../../../types/job';

const ApplicationDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [application, setApplication] = useState<(Application & { job: Job }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id, user]);

  const loadApplication = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For now, this should come from a real API call
      // The API for application details would need to be implemented
      console.log('Would load application details for ID:', id);

      // Set empty state since we don't have real data
      setApplication(null);
      setError('Application details are not yet available.');
    } catch (error) {
      console.error('Error loading application:', error);
      setError('Unable to load application details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStageInfo = (stage: ApplicationStage) => {
    const stageMap = {
      applied: { label: 'Application Submitted', color: 'bg-blue-100 text-blue-800', progress: 20 },
      screening: { label: 'Under Review', color: 'bg-indigo-100 text-indigo-800', progress: 30 },
      'written-test': { label: 'Written Test', color: 'bg-yellow-100 text-yellow-800', progress: 50 },
      'video-test': { label: 'Video Test', color: 'bg-purple-100 text-purple-800', progress: 70 },
      'final-interview': { label: 'Final Interview', color: 'bg-green-100 text-green-800', progress: 85 },
      decision: { label: 'Final Decision', color: 'bg-gray-100 text-gray-800', progress: 95 },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', progress: 100 },
      rejected: { label: 'Not Selected', color: 'bg-red-100 text-red-800', progress: 100 },
      withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800', progress: 100 }
    };

    return stageMap[stage];
  };

  if (isLoading) {
    return (
      <ProtectedRoute requireRole="applicant">
        <Layout user={user}>
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading application details...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!application) {
    return (
      <ProtectedRoute requireRole="applicant">
        <Layout user={user}>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Application not found</h3>
            <p className="mt-2 text-gray-500">The application you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Link href="/applicant/dashboard">
                <Button variant="primary">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const stageInfo = getStageInfo(application.currentStage);

  return (
    <>
      <Head>
        <title>Application Details - {application.job.title}</title>
        <meta name="description" content={`Your application for ${application.job.title} at AB Holistic Health`} />
      </Head>

      <ProtectedRoute requireRole="applicant">
        <Layout user={user} maxWidth="4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center space-x-4 mb-6">
                <Link href="/applicant/dashboard">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </Link>
                <div className="text-sm text-gray-500">
                  <Link href="/applicant/dashboard" className="hover:text-blue-600">Dashboard</Link>
                  <span className="mx-2">/</span>
                  <span>Application Details</span>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{application.job.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageInfo.color}`}>
                    {stageInfo.label}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    Application ID: {application.applicationId}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{stageInfo.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${stageInfo.progress}%` }}
                  ></div>
                </div>
              </div>

              {application.currentStage === 'written-test' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Action Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>Please complete your written assessment to proceed to the next stage.</p>
                      </div>
                      <div className="mt-4">
                        <Link href={`/tests/written/${application.jobId}`}>
                          <Button variant="primary" size="sm">Take Written Test</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {application.currentStage === 'video-test' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-800">Next Step</h3>
                      <div className="mt-2 text-sm text-purple-700">
                        <p>Record your video responses to the interview questions.</p>
                      </div>
                      <div className="mt-4">
                        <Link href={`/tests/video/${application.jobId}`}>
                          <Button variant="primary" size="sm">Record Video Test</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Results */}
            {(application.writtenTestScore || application.videoTestScore) && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Assessment Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {application.writtenTestScore && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-green-800 mb-2">Written Assessment</h3>
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {application.writtenTestScore}%
                      </div>
                      <div className="text-sm text-green-700">
                        Completed on {application.writtenTestCompletedAt && new Date(application.writtenTestCompletedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {application.videoTestScore && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-purple-800 mb-2">Video Assessment</h3>
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {application.videoTestScore}%
                      </div>
                      <div className="text-sm text-purple-700">
                        Completed on {application.videoTestCompletedAt && new Date(application.videoTestCompletedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Timeline */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Timeline</h2>
              <div className="space-y-4">
                {application.stageHistory?.map((stage, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        stage.exitedAt ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getStageInfo(stage.stage).label}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(stage.enteredAt).toLocaleDateString()}
                        </span>
                      </div>
                      {stage.notes && (
                        <p className="text-sm text-gray-600 mt-1">{stage.notes}</p>
                      )}
                      {stage.exitedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed on {new Date(stage.exitedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application Details */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {application.personalInfo?.firstName} {application.personalInfo?.lastName}</div>
                    <div><span className="font-medium">Email:</span> {application.personalInfo?.email}</div>
                    {application.personalInfo?.phone && (
                      <div><span className="font-medium">Phone:</span> {application.personalInfo.phone}</div>
                    )}
                    {application.personalInfo?.address && (
                      <div>
                        <span className="font-medium">Address:</span>
                        <br />
                        {application.personalInfo.address.street}
                        <br />
                        {application.personalInfo.address.city}, {application.personalInfo.address.state} {application.personalInfo.address.zipCode}
                        <br />
                        {application.personalInfo.address.country}
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Links */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Links</h3>
                  <div className="space-y-2 text-sm">
                    {application.personalInfo?.linkedIn && (
                      <div>
                        <span className="font-medium">LinkedIn:</span>
                        <a href={application.personalInfo.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 ml-1">
                          View Profile
                        </a>
                      </div>
                    )}
                    {application.personalInfo?.github && (
                      <div>
                        <span className="font-medium">GitHub:</span>
                        <a href={application.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 ml-1">
                          View Profile
                        </a>
                      </div>
                    )}
                    {application.personalInfo?.website && (
                      <div>
                        <span className="font-medium">Website:</span>
                        <a href={application.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 ml-1">
                          Visit Site
                        </a>
                      </div>
                    )}
                    {application.portfolio && (
                      <div>
                        <span className="font-medium">Portfolio:</span>
                        <a href={application.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 ml-1">
                          View Portfolio
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Authorization */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Work Authorization & Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="font-medium">Work Authorization:</span>
                    <span className={`ml-2 ${application.personalInfo?.eligibilityToWork ? 'text-green-600' : 'text-red-600'}`}>
                      {application.personalInfo?.eligibilityToWork ? 'Authorized' : 'Not Authorized'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Visa Sponsorship:</span>
                    <span className="ml-2">
                      {application.personalInfo?.requiresSponsorship ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Start Date:</span>
                    <span className="ml-2">
                      {application.personalInfo?.availableStartDate && new Date(application.personalInfo.availableStartDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resume */}
              {(application as any).resume && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Resume</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{(application as any).resume.fileName}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round((application as any).resume.fileSize / 1024)} KB • Uploaded {new Date((application as any).resume.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              {(application as any).coverLetter && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Cover Letter</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="whitespace-pre-wrap text-sm text-gray-700">
                      {(application as any).coverLetter}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(application as any).additionalInfo && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-700">
                      {(application as any).additionalInfo}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Link href="/applicant/dashboard">
                <Button variant="secondary">Back to Dashboard</Button>
              </Link>

              <div className="flex space-x-4">
                <Link href={`/jobs/${application.job.jobId}`}>
                  <Button variant="ghost">View Job Details</Button>
                </Link>
                {application.currentStage === 'written-test' && (
                  <Link href={`/tests/written/${application.jobId}`}>
                    <Button variant="primary">Take Written Test</Button>
                  </Link>
                )}
                {application.currentStage === 'video-test' && (
                  <Link href={`/tests/video/${application.jobId}`}>
                    <Button variant="primary">Record Video Test</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default ApplicationDetailsPage;