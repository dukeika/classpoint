// File: src/components/company/JobsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  Play,
  Pause,
  Archive,
  Trash2,
  FileText,
  Video,
  Edit2,
} from "lucide-react";
import { Job } from "./types";
import { testService } from "@/services/testService";

interface JobsTabProps {
  jobs: Job[];
  onCreateJob?: (jobData: any) => Promise<any>;
  onUpdateJob?: (jobId: string, jobData: any) => Promise<any>;
  onDeleteJob?: (jobId: string) => Promise<void>;
}

export default function JobsTab({ jobs, onCreateJob, onUpdateJob, onDeleteJob }: JobsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "paused" | "closed"
  >("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "all" || job.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const departments = Array.from(new Set(jobs.map((job) => job.department)));

  const getStatusBadge = (status: Job["status"]) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: Play },
      paused: { color: "bg-yellow-100 text-yellow-800", icon: Pause },
      closed: { color: "bg-red-100 text-red-800", icon: Archive },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleToggleStatus = async (jobId: string, currentStatus: Job["status"]) => {
    if (!onUpdateJob) return;
    
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      setLoading(true);
      await onUpdateJob(jobId, { status: newStatus.toUpperCase() });
      console.log(`✅ Job ${jobId} status changed from ${currentStatus} to ${newStatus}`);
    } catch (error) {
      console.error("❌ Error updating job status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = () => {
    setShowCreateModal(true);
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setShowEditModal(true);
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleViewApplications = (job: Job) => {
    setSelectedJob(job);
    setShowApplications(true);
  };

  const handleDeleteJob = (job: Job) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const handleManageTests = (job: Job) => {
    setSelectedJob(job);
    setShowTestsModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete || !onDeleteJob) return;

    try {
      setLoading(true);
      await onDeleteJob(jobToDelete.id);
      setShowDeleteConfirm(false);
      setJobToDelete(null);
      console.log(`✅ Job "${jobToDelete.title}" deleted successfully`);
    } catch (error) {
      console.error("❌ Error deleting job:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Postings</h2>
          <p className="text-gray-600">
            Manage your active job postings and applications
          </p>
        </div>
        <Button onClick={handleCreateJob} disabled={loading}>
          <Plus className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {job.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {job.department}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {job.type}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {getStatusBadge(job.status)}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Job Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {job.applicationsCount}
                </div>
                <div className="text-xs text-gray-500">Applications</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(job.applicationsCount * 0.3)}
                </div>
                <div className="text-xs text-gray-500">In Review</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(job.applicationsCount * 0.15)}
                </div>
                <div className="text-xs text-gray-500">Interviews</div>
              </div>
            </div>

            {/* Posted Date */}
            <div className="text-sm text-gray-500 mb-4">
              Posted on {new Date(job.createdAt).toLocaleDateString()}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(job)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewApplications(job)}>
                  <Users className="h-4 w-4 mr-1" />
                  Applications
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditJob(job)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(job.id, job.status)}
                >
                  {job.status === "active" ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteJob(job)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleManageTests(job)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Manage Tests
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No jobs found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== "all" || departmentFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by posting your first job."}
          </p>
          {!searchTerm &&
            statusFilter === "all" &&
            departmentFilter === "all" && (
              <Button onClick={handleCreateJob}>
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Play className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.filter((j) => j.status === "active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Applications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.reduce((sum, j) => sum + j.applicationsCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Briefcase className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Applications
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {jobs.length > 0
                  ? Math.round(
                      jobs.reduce((sum, j) => sum + j.applicationsCount, 0) /
                        jobs.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <CreateJobModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={onCreateJob}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <JobDetailsModal
          isOpen={showJobDetails}
          onClose={() => {
            setShowJobDetails(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}

      {/* Applications Modal */}
      {showApplications && selectedJob && (
        <ApplicationsModal
          isOpen={showApplications}
          onClose={() => {
            setShowApplications(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <EditJobModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onSubmit={onUpdateJob}
          loading={loading}
          setLoading={setLoading}
        />
      )}

      {/* Test Management Modal */}
      {showTestsModal && selectedJob && (
        <TestManagementModal
          isOpen={showTestsModal}
          onClose={() => {
            setShowTestsModal(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && jobToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setJobToDelete(null);
          }}
          job={jobToDelete}
          onConfirm={confirmDeleteJob}
          loading={loading}
        />
      )}

      {/* Test Management Modal */}
      {showTestsModal && (
        <TestManagementModal
          isOpen={showTestsModal}
          job={selectedJob}
          onClose={() => {
            setShowTestsModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}

// Create Job Modal Component
interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (jobData: any) => Promise<any>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

function CreateJobModal({ isOpen, onClose, onSubmit, loading, setLoading }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    type: 'FULL_TIME',
    salary: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    benefits: [''],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    try {
      setLoading(true);
      
      // Clean up empty arrays and ensure they're never empty
      const filteredRequirements = formData.requirements.filter(r => r.trim());
      const filteredResponsibilities = formData.responsibilities.filter(r => r.trim());
      const filteredBenefits = formData.benefits.filter(b => b.trim());
      
      const cleanedData = {
        ...formData,
        requirements: filteredRequirements.length > 0 ? filteredRequirements : ['No specific requirements'],
        responsibilities: filteredResponsibilities.length > 0 ? filteredResponsibilities : ['Responsibilities to be discussed'],
        benefits: filteredBenefits, // Benefits can be empty as it's optional
        status: 'ACTIVE'
      };
      
      console.log('🔍 Cleaned job data being submitted:', cleanedData);

      await onSubmit(cleanedData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        department: '',
        location: '',
        type: 'FULL_TIME',
        salary: '',
        description: '',
        requirements: [''],
        responsibilities: [''],
        benefits: [''],
      });
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Post New Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary (Optional)
            </label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="e.g. $50,000 - $70,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements
            </label>
            {formData.requirements.map((req, index) => (
              <input
                key={index}
                type="text"
                value={req}
                onChange={(e) => handleArrayInput('requirements', index, e.target.value)}
                placeholder={`Requirement ${index + 1}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2 text-gray-900"
                disabled={loading}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('requirements')}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Requirement
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsibilities
            </label>
            {formData.responsibilities.map((resp, index) => (
              <input
                key={index}
                type="text"
                value={resp}
                onChange={(e) => handleArrayInput('responsibilities', index, e.target.value)}
                placeholder={`Responsibility ${index + 1}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2 text-gray-900"
                disabled={loading}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('responsibilities')}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Responsibility
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Job Modal Component
interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onSubmit?: (jobId: string, jobData: any) => Promise<any>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

function EditJobModal({ isOpen, onClose, job, onSubmit, loading, setLoading }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.type,
    salary: job.salary || '',
    description: job.description,
    requirements: job.requirements || [''],
    responsibilities: job.responsibilities || [''],
    benefits: job.benefits || [''],
    status: job.status.toUpperCase(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    try {
      setLoading(true);
      
      // Clean up empty arrays and ensure they're never empty
      const filteredRequirements = formData.requirements.filter(r => r.trim());
      const filteredResponsibilities = formData.responsibilities.filter(r => r.trim());
      const filteredBenefits = formData.benefits.filter(b => b.trim());
      
      const cleanedData = {
        ...formData,
        requirements: filteredRequirements.length > 0 ? filteredRequirements : ['No specific requirements'],
        responsibilities: filteredResponsibilities.length > 0 ? filteredResponsibilities : ['Responsibilities to be discussed'],
        benefits: filteredBenefits,
      };
      
      console.log('🔍 Cleaned edit data being submitted:', cleanedData);

      await onSubmit(job.id, cleanedData);
      onClose();
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field: 'requirements' | 'responsibilities' | 'benefits', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Job</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary (Optional)
              </label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. $50,000 - $70,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requirements
            </label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleArrayInput('requirements', index, e.target.value)}
                  placeholder={`Requirement ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={loading}
                />
                {formData.requirements.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('requirements', index)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('requirements')}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Requirement
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsibilities
            </label>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => handleArrayInput('responsibilities', index, e.target.value)}
                  placeholder={`Responsibility ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={loading}
                />
                {formData.responsibilities.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('responsibilities')}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Responsibility
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Benefits (Optional)
            </label>
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayInput('benefits', index, e.target.value)}
                  placeholder={`Benefit ${index + 1}`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('benefits', index)}
                  disabled={loading}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('benefits')}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Benefit
            </Button>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Job Details Modal Component
interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

function JobDetailsModal({ isOpen, onClose, job }: JobDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1" />
                {job.department}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {job.type}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' :
                    job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </div>
              {job.salary && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary</label>
                  <p className="text-gray-900">{job.salary}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Posted Date</label>
                <p className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
              {job.closingDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Closing Date</label>
                  <p className="text-gray-900">{new Date(job.closingDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{job.applicationsCount}</div>
                <div className="text-xs text-gray-500">Applications</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(job.applicationsCount * 0.3)}
                </div>
                <div className="text-xs text-gray-500">In Review</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(job.applicationsCount * 0.15)}
                </div>
                <div className="text-xs text-gray-500">Interviews</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {job.requirements.map((requirement, index) => (
                <li key={index}>{requirement}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index}>{responsibility}</li>
              ))}
            </ul>
          </div>

          {job.benefits && job.benefits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// Applications Modal Component
interface ApplicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

function ApplicationsModal({ isOpen, onClose, job }: ApplicationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Applications</h2>
            <p className="text-gray-600">{job.title} - {job.applicationsCount} total applications</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {job.applicationsCount === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500">
              Applications will appear here once candidates start applying to this job.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Applications Management</h3>
              <p className="text-gray-500">
                Full applications management functionality will be implemented here, including candidate details, application status, and review tools.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, job, onConfirm, loading }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Job Posting
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete "<strong>{job.title}</strong>" in the {job.department} department? 
            This action cannot be undone and will also remove all associated applications and data.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This job has {job.applicationsCount} application{job.applicationsCount !== 1 ? 's' : ''}. Deleting will permanently remove all application data.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Job'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Test Management Modal Component
interface TestManagementModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

function TestManagementModal({ job, isOpen, onClose }: TestManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'written' | 'video'>('written');
  const [tests, setTests] = useState<any[]>([]);
  const [videoTests, setVideoTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [showCreateVideoTest, setShowCreateVideoTest] = useState(false);

  // Load tests when modal opens
  useEffect(() => {
    if (isOpen && job) {
      loadTests();
    }
  }, [isOpen, job]);

  const loadTests = async () => {
    if (!job) return;
    
    setLoading(true);
    try {
      const [writtenTests, videoTestData] = await Promise.all([
        testService.getTestsByJob(job.id),
        testService.getVideoTestsByJob(job.id)
      ]);
      
      setTests(writtenTests);
      setVideoTests(videoTestData);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string, isVideo: boolean = false) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      if (isVideo) {
        await testService.deleteVideoTest(testId);
        setVideoTests(prev => prev.filter(t => t.id !== testId));
      } else {
        await testService.deleteTest(testId);
        setTests(prev => prev.filter(t => t.id !== testId));
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Manage Tests - {job.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('written')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'written'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="inline w-4 h-4 mr-2" />
            Written Tests
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Video className="inline w-4 h-4 mr-2" />
            Video Tests
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Written Tests Tab */}
            {activeTab === 'written' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Written Tests ({tests.length})</h3>
                  <Button
                    onClick={() => setShowCreateTest(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Written Test
                  </Button>
                </div>
                
                {tests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No written tests created yet</p>
                    <p className="text-sm">Create your first written test to assess candidates</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4 hover:shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{test.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                              <span>⏱️ {test.timeLimit} min</span>
                              <span>📊 {test.totalPoints} points</span>
                              <span>✅ {test.passingScore}% to pass</span>
                              <span className={`px-2 py-1 rounded ${test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {test.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteTest(test.id, false)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Video Tests Tab */}
            {activeTab === 'video' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Video Tests ({videoTests.length})</h3>
                  <Button
                    onClick={() => setShowCreateVideoTest(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Video Test
                  </Button>
                </div>
                
                {videoTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No video tests created yet</p>
                    <p className="text-sm">Create your first video test for candidate interviews</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videoTests.map((test) => (
                      <div key={test.id} className="border rounded-lg p-4 hover:shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{test.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                            <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                              <span>📊 {test.totalPoints} points</span>
                              <span className={`px-2 py-1 rounded ${test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {test.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteTest(test.id, true)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Create Written Test Modal */}
        {showCreateTest && (
          <CreateWrittenTestModal
            isOpen={showCreateTest}
            job={job}
            onClose={() => setShowCreateTest(false)}
            onSubmit={async (testData) => {
              try {
                await testService.createTest({
                  jobId: job.id,
                  ...testData
                });
                loadTests(); // Refresh the tests list
                setShowCreateTest(false);
              } catch (error) {
                console.error('Error creating test:', error);
                alert('Failed to create test');
              }
            }}
          />
        )}

        {/* Create Video Test Modal */}
        {showCreateVideoTest && (
          <CreateVideoTestModal
            isOpen={showCreateVideoTest}
            job={job}
            onClose={() => setShowCreateVideoTest(false)}
            onSubmit={async (testData) => {
              try {
                await testService.createVideoTest({
                  jobId: job.id,
                  ...testData
                });
                loadTests(); // Refresh the tests list
                setShowCreateVideoTest(false);
              } catch (error) {
                console.error('Error creating video test:', error);
                alert('Failed to create video test');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Written Test Modal Component
interface CreateWrittenTestModalProps {
  isOpen: boolean;
  job: Job;
  onClose: () => void;
  onSubmit: (testData: {
    title: string;
    description: string;
    instructions: string;
    timeLimit: number;
    totalPoints: number;
    passingScore: number;
    isActive: boolean;
    questions: any[];
  }) => Promise<void>;
}

function CreateWrittenTestModal({ isOpen, job, onClose, onSubmit }: CreateWrittenTestModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimit: 60,
    totalPoints: 100,
    passingScore: 70,
    isActive: true
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        questions
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        instructions: '',
        timeLimit: 60,
        totalPoints: 100,
        passingScore: 70,
        isActive: true
      });
      setQuestions([]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (questionData: any) => {
    const newQuestion = {
      id: Date.now().toString(),
      ...questionData
    };
    setQuestions(prev => [...prev, newQuestion]);
    
    // Update total points
    const newTotal = questions.reduce((sum, q) => sum + q.points, 0) + questionData.points;
    setFormData(prev => ({ ...prev, totalPoints: newTotal }));
  };

  const removeQuestion = (questionId: string) => {
    const questionToRemove = questions.find(q => q.id === questionId);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    
    // Update total points
    if (questionToRemove) {
      setFormData(prev => ({ 
        ...prev, 
        totalPoints: prev.totalPoints - questionToRemove.points 
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Written Test - {job.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Test Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="e.g., Technical Assessment"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="300"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Describe what this test assesses..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions for Candidates *
            </label>
            <textarea
              required
              rows={4}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Provide clear instructions for taking this test..."
              disabled={loading}
            />
          </div>

          {/* Scoring Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Points
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalPoints}
                onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-gray-100"
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-1">Auto-calculated from questions</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Score (%) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={loading}
              />
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h3>
              <Button
                type="button"
                onClick={() => setShowQuestionModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No questions added yet</p>
                <p className="text-sm">Add questions to create your test</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 hover:shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                            question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                            question.type === 'short_answer' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {question.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">{question.points} pts</span>
                        </div>
                        <p className="text-gray-900 mb-2">{question.question}</p>
                        {question.options && (
                          <ul className="text-sm text-gray-600 ml-4">
                            {question.options.map((option: string, optIndex: number) => (
                              <li key={optIndex} className={optIndex === question.correctAnswer ? 'font-medium text-green-600' : ''}>
                                {optIndex === question.correctAnswer ? '✓ ' : '• '}{option}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Test is active (candidates can take this test)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || questions.length === 0}
            >
              {loading ? 'Creating...' : 'Create Test'}
            </Button>
          </div>
        </form>

        {/* Question Creation Modal */}
        {showQuestionModal && (
          <QuestionBuilderModal
            isOpen={showQuestionModal}
            onClose={() => setShowQuestionModal(false)}
            onSubmit={addQuestion}
          />
        )}
      </div>
    </div>
  );
}

// Question Builder Modal Component
interface QuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: any) => void;
}

function QuestionBuilderModal({ isOpen, onClose, onSubmit }: QuestionBuilderModalProps) {
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer' | 'essay'>('multiple_choice');
  const [formData, setFormData] = useState({
    question: '',
    points: 10,
    timeLimit: undefined as number | undefined
  });
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<number | string>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const questionData = {
      question: formData.question,
      type: questionType,
      points: formData.points,
      timeLimit: formData.timeLimit,
      ...(questionType === 'multiple_choice' && {
        options: options.filter(opt => opt.trim()),
        correctAnswer: correctAnswer as number
      }),
      ...(questionType === 'true_false' && {
        options: ['True', 'False'],
        correctAnswer: correctAnswer as number
      }),
      ...(questionType === 'short_answer' && {
        correctAnswer: correctAnswer as string
      })
    };

    onSubmit(questionData);
    
    // Reset form
    setFormData({ question: '', points: 10, timeLimit: undefined });
    setOptions(['', '']);
    setCorrectAnswer(0);
    onClose();
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      const correctAnswerNum = typeof correctAnswer === 'number' ? correctAnswer : parseInt(correctAnswer.toString(), 10);
      if (correctAnswerNum === index) {
        setCorrectAnswer(0);
      } else if (correctAnswerNum > index) {
        setCorrectAnswer(correctAnswerNum - 1);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Question</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'true_false', label: 'True/False' },
                { value: 'short_answer', label: 'Short Answer' },
                { value: 'essay', label: 'Essay' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setQuestionType(type.value as any)}
                  className={`p-3 rounded-md border text-sm font-medium ${
                    questionType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <textarea
              required
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter your question here..."
            />
          </div>

          {/* Multiple Choice Options */}
          {questionType === 'multiple_choice' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 6}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === index}
                      onChange={() => setCorrectAnswer(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 focus:ring-2"
                    />
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select the correct answer by clicking the radio button</p>
            </div>
          )}

          {/* True/False Options */}
          {questionType === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="tfAnswer"
                    checked={correctAnswer === 0}
                    onChange={() => setCorrectAnswer(0)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 focus:ring-2"
                  />
                  <span className="text-gray-900">True</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="tfAnswer"
                    checked={correctAnswer === 1}
                    onChange={() => setCorrectAnswer(1)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 focus:ring-2"
                  />
                  <span className="text-gray-900">False</span>
                </label>
              </div>
            </div>
          )}

          {/* Short Answer */}
          {questionType === 'short_answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Answer (for reference) *
              </label>
              <input
                type="text"
                required
                value={correctAnswer as string}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Enter the expected answer..."
              />
              <p className="text-xs text-gray-500 mt-1">This will be used for manual grading reference</p>
            </div>
          )}

          {/* Points and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (seconds, optional)
              </label>
              <input
                type="number"
                min="10"
                max="600"
                value={formData.timeLimit || ''}
                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="No limit"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Question
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Video Test Modal Component
interface CreateVideoTestModalProps {
  isOpen: boolean;
  job: Job;
  onClose: () => void;
  onSubmit: (testData: {
    title: string;
    description: string;
    instructions: string;
    totalPoints: number;
    isActive: boolean;
    questions: any[];
  }) => Promise<void>;
}

function CreateVideoTestModal({ isOpen, job, onClose, onSubmit }: CreateVideoTestModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    totalPoints: 100,
    isActive: true
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        questions
      });
      // Reset form
      setFormData({
        title: '',
        description: '',
        instructions: '',
        totalPoints: 100,
        isActive: true
      });
      setQuestions([]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVideoQuestion = (questionData: any) => {
    const newQuestion = {
      id: Date.now().toString(),
      ...questionData
    };
    setQuestions(prev => [...prev, newQuestion]);
    
    // Update total points
    const newTotal = questions.reduce((sum, q) => sum + q.points, 0) + questionData.points;
    setFormData(prev => ({ ...prev, totalPoints: newTotal }));
  };

  const removeQuestion = (questionId: string) => {
    const questionToRemove = questions.find(q => q.id === questionId);
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    
    // Update total points
    if (questionToRemove) {
      setFormData(prev => ({ 
        ...prev, 
        totalPoints: prev.totalPoints - questionToRemove.points 
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Video Test - {job.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Test Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="e.g., Video Interview Assessment"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Describe what this video test assesses..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions for Candidates *
            </label>
            <textarea
              required
              rows={4}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Provide clear instructions for recording video responses..."
              disabled={loading}
            />
          </div>

          {/* Video Questions Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Video Questions ({questions.length})</h3>
              <Button
                type="button"
                onClick={() => setShowQuestionModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No video questions added yet</p>
                <p className="text-sm">Add questions for candidates to record their responses</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 hover:shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">Q{index + 1}</span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                            Video Question
                          </span>
                          <span className="text-xs text-gray-500">{question.points} pts</span>
                          <span className="text-xs text-gray-500">⏱️ {question.timeLimit}s</span>
                          {question.preparationTime && (
                            <span className="text-xs text-gray-500">🔍 {question.preparationTime}s prep</span>
                          )}
                        </div>
                        <p className="text-gray-900 mb-1">{question.question}</p>
                        {question.description && (
                          <p className="text-sm text-gray-600">{question.description}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVideoActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="isVideoActive" className="text-sm font-medium text-gray-700">
              Test is active (candidates can take this video test)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading || questions.length === 0}
            >
              {loading ? 'Creating...' : 'Create Video Test'}
            </Button>
          </div>
        </form>

        {/* Video Question Creation Modal */}
        {showQuestionModal && (
          <VideoQuestionBuilderModal
            isOpen={showQuestionModal}
            onClose={() => setShowQuestionModal(false)}
            onSubmit={addVideoQuestion}
          />
        )}
      </div>
    </div>
  );
}

// Video Question Builder Modal Component
interface VideoQuestionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: any) => void;
}

function VideoQuestionBuilderModal({ isOpen, onClose, onSubmit }: VideoQuestionBuilderModalProps) {
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    timeLimit: 120, // 2 minutes default
    points: 10,
    preparationTime: 30 // 30 seconds default prep time
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const questionData = {
      question: formData.question,
      description: formData.description,
      timeLimit: formData.timeLimit,
      points: formData.points,
      preparationTime: formData.preparationTime
    };

    onSubmit(questionData);
    
    // Reset form
    setFormData({
      question: '',
      description: '',
      timeLimit: 120,
      points: 10,
      preparationTime: 30
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Video Question</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <textarea
              required
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Enter the question for candidates to answer via video..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Context (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Provide any additional context or instructions for this question..."
            />
          </div>

          {/* Time Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recording Time Limit (seconds) *
              </label>
              <input
                type="number"
                required
                min="30"
                max="600"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum recording time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preparation Time (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">Time to read before recording</p>
            </div>
          </div>

          {/* Points */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Video className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Video Question Guidelines</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Candidates will see this question, have preparation time to think, then record their response. 
                  Keep questions clear and open-ended to allow for meaningful video responses.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Video Question
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}