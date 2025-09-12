// src/components/admin/JobsTab.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit3, Trash2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jobService } from '@/services/jobService';
import { Job, JobType, JobStatus } from '@/API';
import { useAuth } from '@/contexts/AuthContext';

interface JobsTabProps {
  companyId?: string; // If provided, only show jobs for this company
  onRefresh?: () => void;
}

export default function JobsTab({ companyId, onRefresh }: JobsTabProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadJobs();
  }, [companyId]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      let jobsData: Job[];
      
      if (companyId) {
        jobsData = await jobService.getJobsByCompany(companyId);
      } else {
        // For super admin, get all jobs
        jobsData = await jobService.getAllJobs();
      }
      
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case JobStatus.PAUSED:
        return 'bg-yellow-100 text-yellow-800';
      case JobStatus.CLOSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: JobType) => {
    switch (type) {
      case JobType.FULL_TIME:
        return 'bg-blue-100 text-blue-800';
      case JobType.PART_TIME:
        return 'bg-purple-100 text-purple-800';
      case JobType.CONTRACT:
        return 'bg-orange-100 text-orange-800';
      case JobType.INTERNSHIP:
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage job postings for your interview process
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(j => j.status === JobStatus.ACTIVE).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Filter className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paused</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(j => j.status === JobStatus.PAUSED).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter(j => j.status === JobStatus.CLOSED).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-abhh-teal-600 focus:border-abhh-teal-600 text-gray-900"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600 text-gray-900"
          >
            <option value="">All Statuses</option>
            <option value={JobStatus.ACTIVE}>Active</option>
            <option value={JobStatus.PAUSED}>Paused</option>
            <option value={JobStatus.CLOSED}>Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-2">{job.department}</p>
                <p className="text-sm text-gray-500">{job.location}</p>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                  {job.type.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {job.description}
            </p>

            {job.salary && (
              <p className="text-abhh-teal-600 font-medium mb-4">{job.salary}</p>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Created {new Date(job.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedJob(job)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedJob(job);
                    setShowCreateModal(true);
                  }}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter 
              ? "Try adjusting your search criteria" 
              : "Create your first job posting to get started"}
          </p>
          {!searchTerm && !statusFilter && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          )}
        </div>
      )}

      {/* TODO: Add CreateJobModal and JobDetailsModal components */}
    </div>
  );
}