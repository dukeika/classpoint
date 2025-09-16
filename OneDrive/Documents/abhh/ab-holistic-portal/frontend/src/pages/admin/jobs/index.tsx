import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { Job, JobFilters } from '../../../types/job';

const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate loading jobs
    setTimeout(() => {
      setJobs([
        {
          jobId: '1',
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
        },
        {
          jobId: '2',
          title: 'UX Designer',
          description: 'Join our design team to create amazing user experiences...',
          requirements: ['3+ years UX design', 'Figma expertise', 'Portfolio required'],
          status: 'published',
          createdBy: 'admin@abholistic.com',
          createdAt: '2025-01-08T14:30:00Z',
          deadline: '2025-02-20T23:59:59Z',
          location: 'New York, NY',
          employmentType: 'full-time',
          department: 'Design'
        },
        {
          jobId: '3',
          title: 'Marketing Manager',
          description: 'Lead our marketing initiatives and drive growth...',
          requirements: ['Marketing degree', 'Digital marketing experience', 'Analytics skills'],
          status: 'draft',
          createdBy: 'admin@abholistic.com',
          createdAt: '2025-01-12T09:15:00Z',
          location: 'Los Angeles, CA',
          employmentType: 'full-time',
          department: 'Marketing'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: Job['status']) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredJobs = jobs.filter(job => {
    if (filters.status && job.status !== filters.status) return false;
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Head>
        <title>Jobs - Admin Dashboard</title>
      </Head>

      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Openings</h1>
                <p className="text-gray-600 mt-2">Manage your job postings and requirements</p>
              </div>
              <Link href="/admin/jobs/create">
                <Button variant="primary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Job
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="card p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as Job['status'] || undefined })}
                  >
                    <option value="">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilters({});
                      setSearchTerm('');
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
                <div className="spinner h-12 w-12 mx-auto"></div>
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
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first job opening.</p>
                    <div className="mt-6">
                      <Link href="/admin/jobs/create">
                        <Button variant="primary">Create Job</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div key={job.jobId} className="card p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                          </div>
                          <p className="text-gray-600 mt-2 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                            )}
                            {job.employmentType && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {job.employmentType.replace('-', ' ')}
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
                            {job.deadline && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Deadline: {new Date(job.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
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

export default JobsPage;