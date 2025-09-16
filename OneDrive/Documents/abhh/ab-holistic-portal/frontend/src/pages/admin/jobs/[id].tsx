import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { Job } from '../../../types/job';

const JobDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate API call to fetch job details
      setTimeout(() => {
        // Mock job data based on ID
        const mockJob: Job = {
          jobId: id as string,
          title: 'Senior Software Engineer',
          description: `We are looking for an experienced software engineer to join our growing team. In this role, you will be responsible for designing, developing, and maintaining high-quality software applications.

Key Responsibilities:
• Design and develop scalable web applications
• Collaborate with cross-functional teams to define requirements
• Write clean, maintainable, and well-tested code
• Participate in code reviews and provide constructive feedback
• Mentor junior developers and contribute to team growth
• Stay up-to-date with latest technologies and industry trends

What We Offer:
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible work arrangements and remote-friendly culture
• Professional development opportunities
• Modern tech stack and cutting-edge projects`,
          requirements: [
            '5+ years of software development experience',
            'Proficiency in React, Node.js, and TypeScript',
            'Experience with cloud platforms (AWS preferred)',
            'Strong understanding of database design and optimization',
            'Excellent problem-solving and communication skills',
            'Experience with agile development methodologies',
            'Bachelor\'s degree in Computer Science or related field'
          ],
          status: 'published',
          createdBy: 'admin@abholistic.com',
          createdAt: '2025-01-10T10:00:00Z',
          deadline: '2025-02-15T23:59:59Z',
          location: 'Remote',
          employmentType: 'full-time',
          department: 'Engineering',
          salary: '$120,000 - $180,000',
          writtenTestId: 'test-1',
          videoTestId: 'video-1'
        };
        setJob(mockJob);
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/admin/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!job) return;

    const newStatus = job.status === 'published' ? 'draft' : 'published';
    setJob({ ...job, status: newStatus });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

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

  if (isLoading) {
    return (
      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="text-center py-12">
            <div className="spinner h-12 w-12 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading job details...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!job) {
    return (
      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
            <p className="mt-2 text-gray-500">The job you're looking for doesn't exist.</p>
            <div className="mt-6">
              <Link href="/admin/jobs">
                <Button variant="primary">Back to Jobs</Button>
              </Link>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <>
      <Head>
        <title>{job.title} - Job Details</title>
      </Head>

      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin/jobs">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </Link>
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                    {getStatusBadge(job.status)}
                  </div>
                  <p className="text-gray-600 mt-2">Job ID: {job.jobId}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleStatusToggle}
                  size="sm"
                >
                  {job.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Link href={`/admin/jobs/${job.jobId}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
                <Link href={`/admin/jobs/${job.jobId}/applications`}>
                  <Button variant="primary" size="sm">View Applications</Button>
                </Link>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={isDeleting}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Job Overview */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="mt-1 text-sm text-gray-900">{job.department || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Employment Type</h3>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {job.employmentType?.replace('-', ' ') || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-1 text-sm text-gray-900">{job.location || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Salary Range</h3>
                  <p className="mt-1 text-sm text-gray-900">{job.salary || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Application Deadline</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{job.description}</div>
              </div>
            </div>

            {/* Requirements */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p className="text-gray-700">{requirement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Configuration */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Written Test</h3>
                    {job.writtenTestId ? (
                      <span className="text-green-600 text-sm font-medium">Configured</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Not configured</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {job.writtenTestId
                      ? 'Written test has been set up for this position.'
                      : 'No written test configured for this position.'
                    }
                  </p>
                  <div className="mt-4">
                    {job.writtenTestId ? (
                      <Link href={`/admin/tests/written/${job.writtenTestId}`}>
                        <Button variant="secondary" size="sm">View Test</Button>
                      </Link>
                    ) : (
                      <Link href={`/admin/tests/written/create?jobId=${job.jobId}`}>
                        <Button variant="primary" size="sm">Create Test</Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Video Test</h3>
                    {job.videoTestId ? (
                      <span className="text-green-600 text-sm font-medium">Configured</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Not configured</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {job.videoTestId
                      ? 'Video test questions have been set up for this position.'
                      : 'No video test configured for this position.'
                    }
                  </p>
                  <div className="mt-4">
                    {job.videoTestId ? (
                      <Link href={`/admin/tests/video/${job.videoTestId}`}>
                        <Button variant="secondary" size="sm">View Test</Button>
                      </Link>
                    ) : (
                      <Link href={`/admin/tests/video/create?jobId=${job.jobId}`}>
                        <Button variant="primary" size="sm">Create Test</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Application Statistics */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">24</div>
                  <div className="text-sm text-gray-500">Total Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-gray-500">Pending Review</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">12</div>
                  <div className="text-sm text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">4</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/admin/jobs/${job.jobId}/applications`}>
                  <Button variant="primary" fullWidth>View All Applications</Button>
                </Link>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default JobDetailsPage;