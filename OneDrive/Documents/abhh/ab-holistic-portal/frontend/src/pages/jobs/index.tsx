/**
 * Public Job Listings Page
 * Accessible to all users - public, applicants, and admins
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/shared/Layout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { JobListErrorBoundary } from '../../components/shared';
import { jobService } from '../../services/jobService';
import { Job, JobFilters, JOB_TYPES, REMOTE_POLICIES, EXPERIENCE_LEVELS } from '../../types/job';
import { PaginatedResponse } from '../../types/common';


const JobListingsPage: NextPage = () => {
  const { state } = useAuth();
  const isAdmin = state.user?.role === 'admin';
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false); // Start false for SSG
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>({
    status: 'published', // Only show published jobs by default
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    hasMore: false,
  });

  const loadJobs = useCallback(async (page = 1, newFilters = filters, resetList = false) => {
    try {
      setLoading(true);
      setError(null);

      // For public listing, only show published jobs
      const jobFilters: JobFilters = {
        ...newFilters,
        status: 'published'
      };

      const response = await jobService.getJobs(jobFilters, page, pagination.limit);

      if (resetList || page === 1) {
        setJobs(response.data || []);
      } else {
        setJobs(prev => [...prev, ...(response.data || [])]);
      }

      setPagination({
        page,
        limit: pagination.limit,
        total: response.pagination?.totalCount || 0,
        hasMore: response.pagination?.hasMore || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    if (typeof window === "undefined") return; // SSG fix
    loadJobs(1, filters, true);
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, search: searchQuery.trim() };
    setFilters(newFilters);
  };

  const handleFilterChange = (key: keyof JobFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({ status: 'published' });
    setSearchQuery('');
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      loadJobs(pagination.page + 1, filters, false);
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salaryRange) return null;
    const { min, max, currency } = job.salaryRange;
    return `${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}`;
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Full-time': 'success',
      'Part-time': 'warning',
      'Contract': 'info',
      'Internship': 'primary',
    };
    return colors[type] || 'default';
  };

  const getRemotePolicyColor = (policy: string) => {
    const colors: Record<string, string> = {
      'Remote': 'success',
      'Hybrid': 'warning',
      'On-site': 'info',
    };
    return colors[policy] || 'default';
  };

  return (
    <Layout
      title="Job Opportunities - AB Holistic Interview Portal"
      description="Browse available job opportunities at AB Holistic Health"
      maxWidth="7xl"
    >
      <JobListErrorBoundary context="Job Opportunities">
        <div className="py-8">
        {/* Header - Always visible for test detection */}
        <div className="mb-8" data-testid="jobs-page-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="jobs-heading">Job Opportunities</h1>
              <p className="mt-2 text-gray-600">
                Discover exciting career opportunities at AB Holistic Health
              </p>
            </div>
            {isAdmin && (
              <div className="mt-4 sm:mt-0">
                <Button as={Link} href="/admin/jobs/create" variant="primary">
                  Post New Job
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search jobs by title, skills, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <Button type="submit" variant="primary">
                Search
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All Types</option>
                {JOB_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Style</label>
              <select
                value={filters.remotePolicy || ''}
                onChange={(e) => handleFilterChange('remotePolicy', e.target.value || undefined)}
                className="w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All Policies</option>
                {REMOTE_POLICIES.map(policy => (
                  <option key={policy.value} value={policy.value}>{policy.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <select
                value={filters.experienceLevel || ''}
                onChange={(e) => handleFilterChange('experienceLevel', e.target.value || undefined)}
                className="w-full rounded-md border-gray-300 text-sm"
              >
                <option value="">All Levels</option>
                {EXPERIENCE_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {loading && jobs.length === 0 ? (
          <div className="flex justify-center py-12" data-testid="loading-state">
            <LoadingSpinner size="lg" />
            <p className="ml-3 text-gray-600">Loading job opportunities...</p>
          </div>
        ) : error ? (
          <Card variant="outlined" className="text-center py-12" data-testid="error-state">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="primary" onClick={() => loadJobs(1, filters, true)}>
              Try Again
            </Button>
          </Card>
        ) : jobs.length === 0 ? (
          <Card variant="outlined" className="text-center py-12" data-testid="empty-state">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h2>
            <p className="text-gray-600">Try adjusting your search or filters to find more opportunities.</p>
          </Card>
        ) : (
          <>
            {/* Job Count */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {jobs.length} of {pagination.total} jobs
              </p>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="jobs-grid">
              {jobs.map((job) => (
                <Card key={job.id} hover className="h-full" data-testid="job-card">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {job.title}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">{job.department}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={getJobTypeColor(job.type) as any} size="sm">
                          {job.type}
                        </Badge>
                        <Badge variant={getRemotePolicyColor(job.remotePolicy) as any} size="sm">
                          {job.remotePolicy}
                        </Badge>
                        <Badge variant="secondary" size="sm">
                          {job.experienceLevel}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </div>
                          {formatSalary(job) && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              {formatSalary(job)}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                        {job.description}
                      </p>

                      {job.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {job.skills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 5 && (
                              <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                                +{job.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {job.applicationCount ? `${job.applicationCount} applications` : 'New'}
                      </div>
                      <Button
                        as={Link}
                        href={`/jobs/${job.id}`}
                        variant="primary"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {pagination.hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  loading={loading}
                  disabled={loading}
                >
                  Load More Jobs
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </JobListErrorBoundary>
    </Layout>
  );
};

export default JobListingsPage;