// src/components/candidate/JobBrowseTab.tsx
import { useState } from "react";
import { Job } from "./types";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  Filter,
  Bookmark,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface JobBrowseTabProps {
  jobs: Job[];
  onApply: (jobId: string) => void;
  hasApplied: (jobId: string) => boolean;
}

export default function JobBrowseTab({
  jobs,
  onApply,
  hasApplied,
}: JobBrowseTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    location: "",
    department: "",
  });

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filters.type || job.type === filters.type;
    const matchesLocation =
      !filters.location ||
      job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesDepartment =
      !filters.department || job.department === filters.department;

    return matchesSearch && matchesType && matchesLocation && matchesDepartment;
  });

  const jobTypes = Array.from(new Set(jobs.map((job) => job.type)));
  const departments = Array.from(new Set(jobs.map((job) => job.department)));

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Job List */}
      <div className="w-1/2 flex flex-col">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-abhh-teal-600 focus:border-abhh-teal-600"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600"
            >
              <option value="">All Types</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-abhh-teal-600 focus:border-abhh-teal-600"
            />
          </div>
        </div>

        {/* Job Cards */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedJob?.id === job.id
                  ? "border-abhh-teal-600"
                  : "border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  {job.companyLogo && (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-10 h-10 rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-abhh-teal-600">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>{job.department}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{job.type}</span>
                </div>
              </div>

              {job.salary && (
                <div className="flex items-center space-x-1 text-sm text-abhh-teal-600 font-medium mb-3">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.salary}</span>
                </div>
              )}

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {job.description}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  Posted {formatDate(job.createdAt)}
                </span>

                {hasApplied(job.id) ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Applied
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply(job.id);
                    }}
                    className="px-4 py-1"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Details */}
      <div className="w-1/2">
        {selectedJob ? (
          <div className="bg-white rounded-lg shadow-sm p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                {selectedJob.companyLogo && (
                  <img
                    src={selectedJob.companyLogo}
                    alt={selectedJob.company}
                    className="w-12 h-12 rounded-lg"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedJob.title}
                  </h1>
                  <p className="text-lg text-gray-600">{selectedJob.company}</p>
                </div>
              </div>

              {hasApplied(selectedJob.id) ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 font-medium rounded-lg">
                  Applied
                </span>
              ) : (
                <Button onClick={() => onApply(selectedJob.id)}>
                  Apply Now
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{selectedJob.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Building className="w-4 h-4" />
                <span>{selectedJob.department}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{selectedJob.type}</span>
              </div>
              {selectedJob.salary && (
                <div className="flex items-center space-x-2 text-abhh-teal-600 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>{selectedJob.salary}</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Requirements
                </h3>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-abhh-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Responsibilities
                </h3>
                <ul className="space-y-2">
                  {selectedJob.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-abhh-teal-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Benefits
                  </h3>
                  <ul className="space-y-2">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-abhh-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Posted on {formatDate(selectedJob.createdAt)}</span>
                  {selectedJob.closingDate && (
                    <span>Apply by {formatDate(selectedJob.closingDate)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a job to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
