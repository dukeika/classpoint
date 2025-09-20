import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/shared/Layout';
import Button from '../../components/shared/Button';
import { Job } from '../../types/job';
import { jobsService } from '../../services/jobs';

const PublicJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPublishedJobs();
  }, []);

  const loadPublishedJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Loading published jobs from API...');

      // Get only published jobs for public view
      const response = await jobsService.getJobs({
        page: 1,
        limit: 50,
        filters: { status: 'published' },
      });

      console.log('✅ Published jobs loaded successfully:', response);
      setJobs(response.jobs);
    } catch (error) {
      console.error('❌ Error loading published jobs:', error);
      setError('Unable to load job listings at this time. Please try again later.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-600';
    if (daysRemaining <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredJobs = jobs.filter(job => {
    if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !job.department?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (locationFilter && job.location?.toLowerCase() !== locationFilter.toLowerCase()) return false;
    if (typeFilter && job.employmentType !== typeFilter) return false;
    return true;
  });

  const uniqueLocations = Array.from(new Set(jobs.map(job => job.location).filter(Boolean)));
  const uniqueTypes = Array.from(new Set(jobs.map(job => job.employmentType).filter(Boolean)));

  return (
    <>
      <Head>
        <title>Careers - Applied Behavioral Holistic Health</title>
        <meta name="description" content="Join our team and help make a difference in behavioral healthcare. Explore open positions and apply today." />
      </Head>

      <Layout maxWidth="7xl" padding={false}>
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#2D5A4A] to-[#1e3a2e] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold sm:text-5xl">
                Build the Future of Healthcare
              </h1>
              <p className="mt-6 text-xl max-w-3xl mx-auto">
                Join our mission to revolutionize behavioral health through innovative technology
                and evidence-based solutions. Make a meaningful impact on lives worldwide.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#F5E942]">{jobs.length}</div>
                  <div className="text-sm">Open Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#F5E942]">100+</div>
                  <div className="text-sm">Team Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#F5E942]">15+</div>
                  <div className="text-sm">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="sr-only">Search jobs</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search jobs by title, department, or keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="sr-only">Location</label>
                <select
                  id="location"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="sr-only">Employment Type</label>
                <select
                  id="type"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type?.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
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
                  <div className="mt-4">
                    <button
                      type="button"
                      className="bg-red-100 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                      onClick={() => {
                        setError(null);
                        loadPublishedJobs();
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="spinner h-12 w-12 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading opportunities...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || locationFilter || typeFilter
                  ? 'Try adjusting your search criteria.'
                  : 'Check back soon for new opportunities.'
                }
              </p>
              {(searchTerm || locationFilter || typeFilter) && (
                <div className="mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setTypeFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredJobs.length} Open Position{filteredJobs.length !== 1 ? 's' : ''}
                </h2>
                {(searchTerm || locationFilter || typeFilter) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setTypeFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid gap-6">
                {filteredJobs.map((job) => {
                  const daysRemaining = job.deadline ? getDaysRemaining(job.deadline) : null;

                  return (
                    <div key={job.jobId} className="card p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {job.title}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                {job.department && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    {job.department}
                                  </span>
                                )}
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
                                {job.salary && (
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    {job.salary}
                                  </span>
                                )}
                              </div>
                            </div>
                            {daysRemaining !== null && (
                              <div className="text-right">
                                <div className={`text-sm font-medium ${getDeadlineColor(daysRemaining)}`}>
                                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Apply by {new Date(job.deadline!).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.requirements.slice(0, 4).map((requirement, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {requirement}
                              </span>
                            ))}
                            {job.requirements.length > 4 && (
                              <span className="text-gray-500 text-xs">
                                +{job.requirements.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ml-6 flex space-x-3">
                          <Link href={`/jobs/${job.jobId}`}>
                            <Button variant="secondary" size="sm">View Details</Button>
                          </Link>
                          <Link href={`/jobs/${job.jobId}/apply`}>
                            <Button variant="primary" size="sm">Apply Now</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Don't see the right role?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                We're always looking for talented individuals who share our passion for healthcare innovation.
              </p>
              <div className="mt-8">
                <Button variant="primary" size="lg">
                  Join Our Talent Network
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PublicJobsPage;