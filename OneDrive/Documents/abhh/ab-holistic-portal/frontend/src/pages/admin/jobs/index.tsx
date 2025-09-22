import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { Job } from '../../../types/job';

// Direct API integration without existing problematic services
const API_BASE_URL = 'https://04efp4qnv4.execute-api.us-west-1.amazonaws.com/prod';

interface ApiResponse {
  jobs: Job[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

const NewAdminJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAdminJobs();
    }
  }, [user]);

  const getAuthToken = (): string | null => {
    // Try multiple token storage locations
    return localStorage.getItem('accessToken') ||
           localStorage.getItem('authToken') ||
           localStorage.getItem('jwt') ||
           sessionStorage.getItem('accessToken');
  };

  const loadAdminJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading admin jobs from API...');
      console.log('User:', user);

      const token = getAuthToken();
      console.log('Auth token available:', !!token);

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Use the my=true parameter to get only jobs created by this admin
      const url = `${API_BASE_URL}/jobs?my=true`;
      console.log('API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);

        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to load jobs'}`);
        }
      }

      const data: ApiResponse = await response.json();
      console.log('✅ Admin jobs loaded successfully:', data);

      // Set jobs directly from response
      const jobsArray = data.jobs || [];
      console.log('📋 Jobs count:', jobsArray.length);

      setJobs(jobsArray);
    } catch (error) {
      console.error('❌ Error loading admin jobs:', error);

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          setError('Network error: Please check your internet connection and try again.');
        } else if (error.message.includes('Authentication failed') || error.message.includes('401')) {
          setError('Authentication failed. Please log in again.');
        } else if (error.message.includes('Access denied') || error.message.includes('403')) {
          setError('Access denied. Admin permissions required.');
        } else if (error.message.includes('404')) {
          setError('API endpoint not found. Please contact support.');
        } else if (error.message.includes('500')) {
          setError('Server error: The service is temporarily unavailable. Please try again later.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Job['status']) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    if (statusFilter && job.status !== statusFilter) return false;
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.department?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const jobStats = {
    total: jobs.length,
    published: jobs.filter(job => job.status === 'published').length,
    draft: jobs.filter(job => job.status === 'draft').length,
    closed: jobs.filter(job => job.status === 'closed').length,
    archived: jobs.filter(job => job.status === 'archived').length,
  };

  return (
    <>
      <Head>
        <title>Jobs - Admin Dashboard</title>
        <meta name="description" content="Manage job postings and requirements" />
      </Head>

      <ProtectedRoute allowedRoles={['admin']}>
        <Layout user={user}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
                <p className="text-gray-600 mt-2">Manage your job postings and requirements</p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={loadAdminJobs}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
                <Link href="/admin/jobs/create">
                  <Button variant="primary">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Job
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{jobStats.total}</h3>
                    <p className="text-sm text-gray-500">Total Jobs</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{jobStats.published}</h3>
                    <p className="text-sm text-gray-500">Published</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{jobStats.draft}</h3>
                    <p className="text-sm text-gray-500">Draft</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{jobStats.closed}</h3>
                    <p className="text-sm text-gray-500">Closed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{jobStats.archived}</h3>
                    <p className="text-sm text-gray-500">Archived</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error Loading Jobs
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button
                        type="button"
                        className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                        onClick={() => {
                          setError(null);
                          loadAdminJobs();
                        }}
                      >
                        Try Again
                      </button>
                      {error.includes('Authentication') && (
                        <Link href="/auth/login">
                          <button
                            type="button"
                            className="bg-blue-100 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200"
                          >
                            Log In
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {error ? 'There was an error loading jobs. Please try again.' :
                       (searchTerm || statusFilter
                        ? 'Try adjusting your search criteria.'
                        : 'Get started by creating your first job opening.'
                       )}
                    </p>
                    <div className="mt-6">
                      <Link href="/admin/jobs/create">
                        <Button variant="primary">Create Job</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.jobId} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                            )}
                            {(job.jobType || job.employmentType) && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {(job.jobType || job.employmentType)?.replace(/[-_]/g, ' ')}
                              </span>
                            )}
                            {job.department && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {job.department}
                              </span>
                            )}
                            {(job.applicationDeadline || job.deadline) && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Deadline: {new Date(job.applicationDeadline || job.deadline!).toLocaleDateString()}
                              </span>
                            )}
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Created: {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {job.requirements && job.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.requirements.slice(0, 3).map((req, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {req}
                                </span>
                              ))}
                              {job.requirements.length > 3 && (
                                <span className="text-gray-500 text-xs">
                                  +{job.requirements.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-6">
                          <Link href={`/admin/jobs/${job.jobId}`}>
                            <Button variant="secondary" size="sm">View</Button>
                          </Link>
                          <Link href={`/admin/jobs/${job.jobId}/edit`}>
                            <Button variant="secondary" size="sm">Edit</Button>
                          </Link>
                          <Link href={`/admin/jobs/${job.jobId}/applications`}>
                            <Button variant="primary" size="sm">Applications</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default NewAdminJobsPage;