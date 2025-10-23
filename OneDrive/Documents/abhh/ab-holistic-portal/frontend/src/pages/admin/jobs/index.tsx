/**
 * Admin Jobs Management Page
 * Lists and manages all jobs for administrators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import Layout from '../../../components/shared/Layout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import Badge from '../../../components/shared/Badge';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { JobListErrorBoundary } from '../../../components/shared';
import { jobService } from '../../../services/jobService';
import { Job, JobFilters, JOB_TYPES, REMOTE_POLICIES, EXPERIENCE_LEVELS, JOB_STATUSES } from '../../../types/job';
import { PaginatedResponse } from '../../../types/common';


const AdminJobsComponent: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });

  const loadJobs = useCallback(async (page = 1, newFilters = filters, resetList = false) => {
    try {
      setLoading(true);
      setError(null);

      // For admin, show all jobs regardless of status
      const response = await jobService.getJobs(newFilters, page, pagination.limit);

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

      // Clear selected jobs when filtering
      if (resetList) {
        setSelectedJobs(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
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
    setFilters({});
    setSearchQuery('');
  };

  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const selectAllJobs = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map(job => job.id)));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'close' | 'archive' | 'delete') => {
    if (selectedJobs.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedJobs.size} selected job(s)?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      for (const jobId of Array.from(selectedJobs)) {
        switch (action) {
          case 'publish':
            await jobService.publishJob(jobId);
            break;
          case 'close':
            await jobService.closeJob(jobId);
            break;
          case 'archive':
            await jobService.archiveJob(jobId);
            break;
          case 'delete':
            await jobService.deleteJob(jobId);
            break;
        }
      }

      // Reload jobs and clear selection
      setSelectedJobs(new Set());
      await loadJobs(1, filters, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} jobs`);
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

  const getStatusColor = (status: string) => {
    const statusConfig = JOB_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'gray';
  };

  return (
    <Layout
      title="Manage Jobs - Admin Dashboard"
      description="Manage job postings and recruitment"
      maxWidth="7xl"
    >
      <JobListErrorBoundary context="Admin Job Management">
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
                <p className="mt-2 text-gray-600">
                  Create, edit, and manage your job postings
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button as={Link} href="/admin/jobs/create" variant="primary">
                  Post New Job
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-4">
                <Input
                  type="text"
                  placeholder="Search jobs by title, department, or skills..."
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full rounded-md border-gray-300 text-sm"
                >
                  <option value="">All Statuses</option>
                  {JOB_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

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
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>

          {/* Bulk Actions */}
          {selectedJobs.size > 0 && (
            <Card className="mb-6 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  {selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('publish')}>
                    Publish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('close')}>
                    Close
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                    Archive
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          {loading && jobs.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <Card variant="outlined" className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Jobs</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button variant="primary" onClick={() => loadJobs(1, filters, true)}>
                Try Again
              </Button>
            </Card>
          ) : jobs.length === 0 ? (
            <Card variant="outlined" className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600 mb-4">
                {Object.keys(filters).length > 0 || searchQuery
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first job posting.'
                }
              </p>
              <Button as={Link} href="/admin/jobs/create" variant="primary">
                Create Job
              </Button>
            </Card>
          ) : (
            <>
              {/* Jobs Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                            onChange={selectAllJobs}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedJobs.has(job.id)}
                              onChange={() => toggleJobSelection(job.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <Link
                                href={`/admin/jobs/${job.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {job.title}
                              </Link>
                              <div className="text-sm text-gray-500">
                                {job.department} • {job.location}
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="secondary" size="sm">
                                  {job.type}
                                </Badge>
                                <Badge variant="info" size="sm">
                                  {job.remotePolicy}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusColor(job.status) as any}>
                              {JOB_STATUSES.find(s => s.value === job.status)?.label || job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.applicationCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(job.createdAt || new Date().toISOString())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                as={Link}
                                href={`/admin/jobs/${job.id}/edit`}
                                variant="outline"
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                as={Link}
                                href={`/admin/jobs/${job.id}/applications`}
                                variant="outline"
                                size="sm"
                              >
                                Applications
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              {pagination.hasMore && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => loadJobs(pagination.page + 1, filters, false)}
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

// Wrap the component with ProtectedRoute
const AdminJobsPage: NextPage = () => {
  return (
    <ProtectedRoute
      component={AdminJobsComponent}
      requiredRole="admin"
    />
  );
};

export default AdminJobsPage;