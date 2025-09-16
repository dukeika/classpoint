import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../contexts/AuthContext';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { Job } from '../../../types/job';

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().min(1, 'Requirements are required'),
  location: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
  department: z.string().optional(),
  deadline: z.string().optional(),
  salary: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

type JobFormData = z.infer<typeof jobSchema>;

const CreateJobPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: 'draft',
      employmentType: 'full-time',
    },
  });

  const onSubmit = async (data: JobFormData) => {
    setIsLoading(true);
    try {
      // Convert requirements string to array
      const requirementsArray = data.requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);

      const newJob: Omit<Job, 'jobId' | 'createdAt' | 'createdBy'> = {
        title: data.title,
        description: data.description,
        requirements: requirementsArray,
        status: data.status,
        location: data.location,
        employmentType: data.employmentType,
        department: data.department,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        salary: data.salary,
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Creating job:', newJob);

      // Redirect to jobs list
      router.push('/admin/jobs');
    } catch (error) {
      console.error('Failed to create job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/jobs');
  };

  return (
    <>
      <Head>
        <title>Create Job - Admin Dashboard</title>
      </Head>

      <ProtectedRoute requireRole="admin">
        <Layout user={user}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
                <p className="text-gray-600 mt-2">Add a new job opening to your portal</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="title" className="form-label">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      {...register('title')}
                      className="form-input"
                      placeholder="e.g. Senior Software Engineer"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="employmentType" className="form-label">
                      Employment Type *
                    </label>
                    <select
                      id="employmentType"
                      {...register('employmentType')}
                      className="form-input"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                    {errors.employmentType && (
                      <p className="mt-1 text-sm text-red-600">{errors.employmentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="location" className="form-label">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      {...register('location')}
                      className="form-input"
                      placeholder="e.g. Remote, New York, NY"
                    />
                    {errors.location && (
                      <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="department" className="form-label">
                      Department
                    </label>
                    <input
                      type="text"
                      id="department"
                      {...register('department')}
                      className="form-input"
                      placeholder="e.g. Engineering, Marketing"
                    />
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="salary" className="form-label">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      id="salary"
                      {...register('salary')}
                      className="form-input"
                      placeholder="e.g. $80,000 - $120,000"
                    />
                    {errors.salary && (
                      <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="deadline" className="form-label">
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      id="deadline"
                      {...register('deadline')}
                      className="form-input"
                    />
                    {errors.deadline && (
                      <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Description</h2>

                <div>
                  <label htmlFor="description" className="form-label">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={8}
                    className="form-input"
                    placeholder="Provide a detailed job description including responsibilities, what you're looking for, and what makes this role exciting..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Minimum 50 characters required. Be descriptive to attract the right candidates.
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Requirements</h2>

                <div>
                  <label htmlFor="requirements" className="form-label">
                    Requirements *
                  </label>
                  <textarea
                    id="requirements"
                    {...register('requirements')}
                    rows={6}
                    className="form-input"
                    placeholder="Enter each requirement on a new line:
5+ years of software development experience
Proficiency in React and TypeScript
Experience with AWS or cloud platforms
Strong communication skills"
                  />
                  {errors.requirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Enter each requirement on a separate line. These will be displayed as individual tags.
                  </p>
                </div>
              </div>

              {/* Publishing Options */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Publishing Options</h2>

                <div>
                  <label htmlFor="status" className="form-label">
                    Status *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('status')}
                        value="draft"
                        className="form-radio text-blue-600"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Save as Draft</div>
                        <div className="text-sm text-gray-500">
                          Keep this job private and work on it later
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        {...register('status')}
                        value="published"
                        className="form-radio text-blue-600"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Publish Immediately</div>
                        <div className="text-sm text-gray-500">
                          Make this job visible to applicants right away
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {watch('status') === 'published' ? 'Create & Publish Job' : 'Save Draft'}
                </Button>
              </div>
            </form>
          </div>
        </Layout>
      </ProtectedRoute>
    </>
  );
};

export default CreateJobPage;