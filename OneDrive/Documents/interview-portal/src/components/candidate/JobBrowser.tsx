// src/components/candidate/JobBrowser.tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Calendar,
  ChevronRight,
  Briefcase
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  salary?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  status: "active" | "closed";
  createdAt: string;
  closingDate?: string;
  companyLogo?: string;
}

interface JobBrowserProps {
  jobs: Job[];
  onApply: (jobId: string) => Promise<void>;
  hasApplied: (jobId: string) => boolean;
  loading?: boolean;
}

export default function JobBrowser({ jobs, onApply, hasApplied, loading = false }: JobBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  // Get unique filter options
  const locations = useMemo(() => 
    Array.from(new Set(jobs.map(job => job.location))).sort(), 
    [jobs]
  );
  const types = useMemo(() => 
    Array.from(new Set(jobs.map(job => job.type))).sort(), 
    [jobs]
  );
  const departments = useMemo(() => 
    Array.from(new Set(jobs.map(job => job.department))).sort(), 
    [jobs]
  );

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || job.location === locationFilter;
      const matchesType = !typeFilter || job.type === typeFilter;
      const matchesDepartment = !departmentFilter || job.department === departmentFilter;
      
      return matchesSearch && matchesLocation && matchesType && matchesDepartment;
    });
  }, [jobs, searchTerm, locationFilter, typeFilter, departmentFilter]);

  const handleApply = async (jobId: string) => {
    try {
      setApplying(jobId);
      await onApply(jobId);
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setApplying(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setTypeFilter("");
    setDepartmentFilter("");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Find Your Next Opportunity</h2>
          <div className="text-sm text-gray-500">
            {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search jobs, companies, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {(searchTerm || locationFilter || typeFilter || departmentFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="divide-y">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || locationFilter || typeFilter || departmentFilter
                ? "Try adjusting your filters to see more opportunities"
                : "Check back soon for new opportunities"
              }
            </p>
            {(searchTerm || locationFilter || typeFilter || departmentFilter) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  {/* Company Logo and Header */}
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        {job.title}
                      </h3>
                      <p className="text-gray-600 font-medium">{job.company}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.type}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {job.department}
                        </div>
                        {job.salary && (
                          <div className="flex items-center text-green-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Description */}
                  <p className="text-gray-600 mt-3 line-clamp-3">
                    {job.description}
                  </p>

                  {/* Tags */}
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {req}
                        </span>
                      ))}
                      {job.requirements.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                          +{job.requirements.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Posted Date */}
                  <div className="flex items-center mt-3 text-sm text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="flex flex-col space-y-2">
                  {hasApplied(job.id) ? (
                    <div className="text-center">
                      <span className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-lg font-medium">
                        Applied
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleApply(job.id)}
                      disabled={applying === job.id}
                      className="min-w-[100px]"
                    >
                      {applying === job.id ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Applying...
                        </div>
                      ) : (
                        'Apply Now'
                      )}
                    </Button>
                  )}
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={handleApply}
          hasApplied={hasApplied(selectedJob.id)}
          applying={applying === selectedJob.id}
        />
      )}
    </div>
  );
}

// Job Detail Modal Component
interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onApply: (jobId: string) => Promise<void>;
  hasApplied: boolean;
  applying: boolean;
}

function JobDetailModal({ job, onClose, onApply, hasApplied, applying }: JobDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-gray-600">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Job Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2" />
                {job.location}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2" />
                {job.type}
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-5 h-5 mr-2" />
                {job.department}
              </div>
              {job.salary && (
                <div className="flex items-center text-green-600">
                  <DollarSign className="w-5 h-5 mr-2" />
                  {job.salary}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="text-gray-600 whitespace-pre-line">{job.description}</div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {job.responsibilities.map((resp, index) => (
                  <li key={index}>{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {hasApplied ? (
              <span className="px-4 py-2 bg-green-100 text-green-800 text-sm rounded-lg font-medium">
                Applied
              </span>
            ) : (
              <Button
                onClick={() => onApply(job.id)}
                disabled={applying}
              >
                {applying ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Applying...
                  </div>
                ) : (
                  'Apply Now'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}