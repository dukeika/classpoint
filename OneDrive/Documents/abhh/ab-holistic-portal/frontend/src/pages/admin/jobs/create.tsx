/**
 * Create Job Page - Admin job creation interface
 */

import React, { useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/shared/Layout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { jobService } from '../../../services/jobService';
import {
  CreateJobRequest,
  JobFormErrors,
  JOB_TYPES,
  REMOTE_POLICIES,
  EXPERIENCE_LEVELS,
  JobType,
  RemotePolicy,
  ExperienceLevel
} from '../../../types/job';

interface FormData extends Omit<CreateJobRequest, 'salaryRange'> {
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  requirementsText: string;
  responsibilitiesText: string;
  qualificationsText: string;
  benefitsText: string;
  skillsText: string;
}

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Human Resources',
  'Finance',
  'Customer Success',
  'Support',
  'Legal',
  'Other'
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
];

const CreateJobComponent: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    requirements: [],
    responsibilities: [],
    qualifications: [],
    department: '',
    location: '',
    remotePolicy: 'On-site' as RemotePolicy,
    type: 'Full-time' as JobType,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    benefits: [],
    skills: [],
    experienceLevel: 'mid' as ExperienceLevel,
    applicationDeadline: '',
    startDate: '',
    tags: [],
    requirementsText: '',
    responsibilitiesText: '',
    qualificationsText: '',
    benefitsText: '',
    skillsText: ''
  });

  const handleInputChange = useCallback((name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Clear field error when user starts typing
    if (errors[name as keyof JobFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: JobFormErrors = {};

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.requirementsText.trim()) {
      newErrors.requirements = 'Job requirements are required';
    }

    // Salary validation
    if (formData.salaryMin && formData.salaryMax) {
      const min = parseFloat(formData.salaryMin);
      const max = parseFloat(formData.salaryMax);
      if (min >= max) {
        newErrors.salaryRange = { min: 'Minimum salary must be less than maximum' };
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertTextToArray = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!isDraft && !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API format
      const jobData: CreateJobRequest = {
        title: formData.title,
        description: formData.description,
        requirements: convertTextToArray(formData.requirementsText),
        responsibilities: formData.responsibilitiesText ? convertTextToArray(formData.responsibilitiesText) : [],
        qualifications: formData.qualificationsText ? convertTextToArray(formData.qualificationsText) : [],
        department: formData.department,
        location: formData.location,
        remotePolicy: formData.remotePolicy,
        type: formData.type,
        benefits: formData.benefitsText ? convertTextToArray(formData.benefitsText) : [],
        skills: formData.skillsText ? convertTextToArray(formData.skillsText) : [],
        experienceLevel: formData.experienceLevel,
        applicationDeadline: formData.applicationDeadline || undefined,
        startDate: formData.startDate || undefined,
        tags: []
      };

      // Add salary range if provided
      if (formData.salaryMin && formData.salaryMax) {
        jobData.salaryRange = {
          min: parseFloat(formData.salaryMin),
          max: parseFloat(formData.salaryMax),
          currency: formData.salaryCurrency
        };
      }

      const createdJob = await jobService.createJob(jobData);

      // If not draft, publish immediately
      if (!isDraft) {
        await jobService.publishJob(createdJob.id);
      }

      // Success - redirect to job management
      router.push('/admin/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      setErrors({
        title: error instanceof Error ? error.message : 'Failed to create job. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    router.push('/admin/jobs');
  };

  return (
    <Layout
      title="Create Job - Admin Dashboard"
      description="Create a new job posting"
      maxWidth="5xl"
    >
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Job</h1>
              <p className="mt-2 text-gray-600">
                Fill out the form below to create a new job posting
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Basic Information */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Job Title"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={errors.title}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Location"
                    required
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    error={errors.location}
                    placeholder="e.g. New York, NY or Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {JOB_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Style
                  </label>
                  <select
                    value={formData.remotePolicy}
                    onChange={(e) => handleInputChange('remotePolicy', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {REMOTE_POLICIES.map(policy => (
                      <option key={policy.value} value={policy.value}>{policy.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Salary Information */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Minimum Salary"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                    error={errors.salaryRange?.min}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Input
                    label="Maximum Salary"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                    error={errors.salaryRange?.max}
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.salaryCurrency}
                    onChange={(e) => handleInputChange('salaryCurrency', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.value} value={currency.value}>{currency.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Job Details */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Provide a detailed description of the role, company culture, and what makes this opportunity unique..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.requirementsText}
                    onChange={(e) => handleInputChange('requirementsText', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter each requirement on a new line:&#10;• Bachelor's degree in Computer Science&#10;• 3+ years of experience with React&#10;• Strong problem-solving skills"
                  />
                  {errors.requirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.requirements}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsibilities
                  </label>
                  <textarea
                    rows={4}
                    value={formData.responsibilitiesText}
                    onChange={(e) => handleInputChange('responsibilitiesText', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter each responsibility on a new line:&#10;• Design and implement new features&#10;• Collaborate with cross-functional teams&#10;• Code reviews and mentoring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualifications
                  </label>
                  <textarea
                    rows={4}
                    value={formData.qualificationsText}
                    onChange={(e) => handleInputChange('qualificationsText', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter each qualification on a new line:&#10;• Experience with modern JavaScript frameworks&#10;• Knowledge of RESTful APIs&#10;• Excellent communication skills"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits
                  </label>
                  <textarea
                    rows={3}
                    value={formData.benefitsText}
                    onChange={(e) => handleInputChange('benefitsText', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter each benefit on a new line:&#10;• Health, dental, and vision insurance&#10;• 401(k) with company matching&#10;• Flexible working hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills
                  </label>
                  <textarea
                    rows={2}
                    value={formData.skillsText}
                    onChange={(e) => handleInputChange('skillsText', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter each skill on a new line:&#10;React&#10;TypeScript&#10;Node.js&#10;AWS"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Application Deadline"
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Expected Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <Card>
            <div className="p-6">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Job...
                    </>
                  ) : (
                    'Create & Publish Job'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

// Wrap the component with ProtectedRoute
const CreateJobPage: NextPage = () => {
  return (
    <ProtectedRoute
      component={CreateJobComponent}
      requiredRole="admin"
    />
  );
};

export default CreateJobPage;