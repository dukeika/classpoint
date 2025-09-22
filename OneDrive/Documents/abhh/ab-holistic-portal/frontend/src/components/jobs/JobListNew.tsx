import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getApiEndpoint } from '../../config/environment';

// TypeScript interfaces for job data
interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  description: string;
  requirements: string[];
  benefits: string[];
  createdAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdBy: string;
}

interface JobsResponse {
  success: boolean;
  jobs: Job[];
  count: number;
}

interface JobListNewProps {
  isAdminView?: boolean;
  onJobEdit?: (job: Job) => void;
  onJobDelete?: (jobId: string) => void;
  className?: string;
}

const JobListNew: React.FC<JobListNewProps> = ({
  isAdminView = false,
  onJobEdit,
  onJobDelete,
  className = ''
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build API URL
      const baseUrl = 'https://04efp4qnv4.execute-api.us-west-1.amazonaws.com/prod/jobs';
      const url = isAdminView ? `${baseUrl}?my=true` : baseUrl;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add authorization header for admin view
      if (isAdminView && user) {
        const token = localStorage.getItem('accessToken') ||
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('jwt') ||
                     sessionStorage.getItem('accessToken');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      console.log(`Fetching jobs from: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }

      const data: JobsResponse = await response.json();

      console.log('Jobs response:', data);

      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, [isAdminView, user]);

  // Handle job deletion
  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://04efp4qnv4.execute-api.us-west-1.amazonaws.com/prod/jobs/${jobId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('authToken') || localStorage.getItem('jwt') || sessionStorage.getItem('accessToken')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.status}`);
      }

      // Remove job from local state
      setJobs(prev => prev.filter(job => job.id !== jobId));

      // Call parent callback if provided
      if (onJobDelete) {
        onJobDelete(jobId);
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: Job['status']) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'PUBLISHED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'DRAFT':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'CLOSED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get job type badge styling
  const getTypeBadge = (type: Job['type']) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800';
    return baseClasses;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <div className="text-red-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isAdminView ? 'No jobs created yet' : 'No jobs available'}
        </h3>
        <p className="text-gray-600">
          {isAdminView
            ? 'Create your first job posting to get started.'
            : 'Check back later for new opportunities.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Job count */}
      <div className="text-sm text-gray-600">
        Showing {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
      </div>

      {/* Jobs list */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <span className={getStatusBadge(job.status)}>{job.status}</span>
                  <span className={getTypeBadge(job.type)}>
                    {job.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <span>{job.department}</span>
                  <span className="mx-2">•</span>
                  <span>{job.location}</span>
                  <span className="mx-2">•</span>
                  <span>Posted {formatDate(job.createdAt)}</span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">
                  {job.description}
                </p>

                {job.requirements && job.requirements.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Requirements:</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                      {job.requirements.length > 3 && (
                        <li className="text-gray-500">...and {job.requirements.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 ml-4">
                {isAdminView ? (
                  <>
                    <button
                      onClick={() => onJobEdit && onJobEdit(job)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div className="text-center pt-4">
        <button
          onClick={fetchJobs}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default JobListNew;