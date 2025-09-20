import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '../../../components/shared/Layout';
import Button from '../../../components/shared/Button';
import { Job } from '../../../types/job';
import { jobsService } from '../../../services/jobs';

const applicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),

  // Address
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  country: z.string().min(1, 'Country is required'),

  // Professional Information
  linkedIn: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Work Authorization
  eligibilityToWork: z.boolean().refine(val => val === true, 'You must be eligible to work'),
  requiresSponsorship: z.boolean(),

  // Availability
  availableStartDate: z.string().min(1, 'Available start date is required'),
  expectedSalary: z.string().optional(),
  noticePeriod: z.string().optional(),

  // Application Materials
  resume: z.any().refine(
    (file) => file instanceof File && file.size > 0,
    'Resume file is required'
  ).refine(
    (file) => file instanceof File && file.size <= 5 * 1024 * 1024,
    'Resume file must be less than 5MB'
  ).refine(
    (file) => file instanceof File && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
    'Resume must be a PDF or Word document'
  ),
  coverLetter: z.string().min(100, 'Cover letter must be at least 100 characters'),
  portfolio: z.string().url('Invalid portfolio URL').optional().or(z.literal('')),
  additionalInfo: z.string().optional(),

  // Agreement
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
});

type FormData = z.infer<typeof applicationSchema>;

const JobApplicationPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = 4;

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(applicationSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const jobData = await jobsService.getJobById(id as string);

      // Only allow applications to published jobs
      if (jobData.status !== 'published') {
        setError('This job posting is not currently accepting applications.');
        return;
      }

      setJob(jobData);
    } catch (error) {
      console.error('Error loading job:', error);
      setError('Job not found or no longer available.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Application submitted:', data);

      // Redirect to success page or applicant dashboard
      router.push('/applicant/dashboard?submitted=true');
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'email', 'phone'];
      case 2:
        return ['street', 'city', 'state', 'zipCode', 'country'];
      case 3:
        return ['eligibilityToWork', 'requiresSponsorship', 'availableStartDate'];
      case 4:
        return ['resume', 'coverLetter', 'agreedToTerms'];
      default:
        return [];
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information';
      case 2: return 'Address & Contact';
      case 3: return 'Work Authorization';
      case 4: return 'Application Materials';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application form...</p>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
          <p className="mt-2 text-gray-500">The job you're trying to apply for doesn't exist.</p>
          <div className="mt-6">
            <Link href="/jobs">
              <Button variant="primary">Browse All Jobs</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Apply for {job.title} - Applied Behavioral Holistic Health</title>
        <meta name="description" content={`Apply for ${job.title} position at AB Holistic Health`} />
      </Head>

      <Layout maxWidth="4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex items-center space-x-4 mb-6">
              <Link href={`/jobs/${job.jobId}`}>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div className="text-sm text-gray-500">
                <Link href="/jobs" className="hover:text-blue-600">Careers</Link>
                <span className="mx-2">/</span>
                <Link href={`/jobs/${job.jobId}`} className="hover:text-blue-600">{job.title}</Link>
                <span className="mx-2">/</span>
                <span>Apply</span>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Apply for {job.title}
              </h1>
              <p className="text-gray-600">
                Complete the application form below. All fields marked with * are required.
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
              </h2>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>

            <div className="flex justify-between mt-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className={`flex items-center ${i < totalSteps - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="form-label">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName')}
                      className="form-input"
                      placeholder="Your first name"
                    />
                    {errors.firstName && (
                      <p className="form-error">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="form-label">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName')}
                      className="form-input"
                      placeholder="Your last name"
                    />
                    {errors.lastName && (
                      <p className="form-error">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      className="form-input"
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <p className="form-error">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="form-error">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="linkedIn" className="form-label">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      id="linkedIn"
                      {...register('linkedIn')}
                      className="form-input"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                    {errors.linkedIn && (
                      <p className="form-error">{errors.linkedIn.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="github" className="form-label">
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      id="github"
                      {...register('github')}
                      className="form-input"
                      placeholder="https://github.com/yourusername"
                    />
                    {errors.github && (
                      <p className="form-error">{errors.github.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="website" className="form-label">
                      Personal Website/Portfolio
                    </label>
                    <input
                      type="url"
                      id="website"
                      {...register('website')}
                      className="form-input"
                      placeholder="https://yourwebsite.com"
                    />
                    {errors.website && (
                      <p className="form-error">{errors.website.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address & Contact */}
            {currentStep === 2 && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Address & Contact Information</h3>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="street" className="form-label">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="street"
                      {...register('street')}
                      className="form-input"
                      placeholder="123 Main Street, Apt 4B"
                    />
                    {errors.street && (
                      <p className="form-error">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="city" className="form-label">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        {...register('city')}
                        className="form-input"
                        placeholder="New York"
                      />
                      {errors.city && (
                        <p className="form-error">{errors.city.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className="form-label">
                        State/Province *
                      </label>
                      <input
                        type="text"
                        id="state"
                        {...register('state')}
                        className="form-input"
                        placeholder="NY"
                      />
                      {errors.state && (
                        <p className="form-error">{errors.state.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="form-label">
                        ZIP/Postal Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        {...register('zipCode')}
                        className="form-input"
                        placeholder="10001"
                      />
                      {errors.zipCode && (
                        <p className="form-error">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="form-label">
                      Country *
                    </label>
                    <select
                      id="country"
                      {...register('country')}
                      className="form-input"
                    >
                      <option value="">Select your country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.country && (
                      <p className="form-error">{errors.country.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Work Authorization */}
            {currentStep === 3 && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Work Authorization & Availability</h3>

                <div className="space-y-6">
                  <div>
                    <fieldset>
                      <legend className="form-label">Work Authorization *</legend>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            {...register('eligibilityToWork')}
                            className="form-radio text-blue-600 h-4 w-4"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            I am authorized to work in this location
                          </span>
                        </label>
                        {errors.eligibilityToWork && (
                          <p className="form-error">{errors.eligibilityToWork.message}</p>
                        )}
                      </div>
                    </fieldset>
                  </div>

                  <div>
                    <fieldset>
                      <legend className="form-label">Visa Sponsorship</legend>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            {...register('requiresSponsorship')}
                            value="false"
                            className="form-radio text-blue-600"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            I do not require visa sponsorship
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            {...register('requiresSponsorship')}
                            value="true"
                            className="form-radio text-blue-600"
                          />
                          <span className="ml-3 text-sm text-gray-700">
                            I require visa sponsorship
                          </span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="availableStartDate" className="form-label">
                        Available Start Date *
                      </label>
                      <input
                        type="date"
                        id="availableStartDate"
                        {...register('availableStartDate')}
                        className="form-input"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.availableStartDate && (
                        <p className="form-error">{errors.availableStartDate.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="expectedSalary" className="form-label">
                        Expected Salary
                      </label>
                      <input
                        type="text"
                        id="expectedSalary"
                        {...register('expectedSalary')}
                        className="form-input"
                        placeholder="$80,000 - $120,000"
                      />
                      {errors.expectedSalary && (
                        <p className="form-error">{errors.expectedSalary.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="noticePeriod" className="form-label">
                        Notice Period
                      </label>
                      <select
                        id="noticePeriod"
                        {...register('noticePeriod')}
                        className="form-input"
                      >
                        <option value="">Select notice period</option>
                        <option value="Immediate">Available immediately</option>
                        <option value="1 week">1 week</option>
                        <option value="2 weeks">2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="2 months">2 months</option>
                        <option value="3 months">3 months</option>
                      </select>
                      {errors.noticePeriod && (
                        <p className="form-error">{errors.noticePeriod.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Application Materials */}
            {currentStep === 4 && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Application Materials</h3>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="resume" className="form-label">
                      Resume/CV * (PDF or Word, max 5MB)
                    </label>
                    <input
                      type="file"
                      id="resume"
                      {...register('resume')}
                      accept=".pdf,.doc,.docx"
                      className="form-input"
                    />
                    {errors.resume && (
                      <p className="form-error">{errors.resume.message?.toString()}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Please upload your most recent resume in PDF or Word format.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="coverLetter" className="form-label">
                      Cover Letter *
                    </label>
                    <textarea
                      id="coverLetter"
                      {...register('coverLetter')}
                      rows={8}
                      className="form-input"
                      placeholder="Tell us why you're interested in this position and how your experience makes you a great fit for our team..."
                    />
                    {errors.coverLetter && (
                      <p className="form-error">{errors.coverLetter.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum 100 characters. Share your motivation and relevant experience.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="portfolio" className="form-label">
                      Portfolio/Work Samples
                    </label>
                    <input
                      type="url"
                      id="portfolio"
                      {...register('portfolio')}
                      className="form-input"
                      placeholder="https://yourportfolio.com"
                    />
                    {errors.portfolio && (
                      <p className="form-error">{errors.portfolio.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Link to your portfolio, GitHub, or relevant work samples.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="additionalInfo" className="form-label">
                      Additional Information
                    </label>
                    <textarea
                      id="additionalInfo"
                      {...register('additionalInfo')}
                      rows={4}
                      className="form-input"
                      placeholder="Any additional information you'd like to share (optional)..."
                    />
                    {errors.additionalInfo && (
                      <p className="form-error">{errors.additionalInfo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        {...register('agreedToTerms')}
                        className="form-radio text-blue-600 h-4 w-4 mt-1"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I agree to the{' '}
                        <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500">
                          Privacy Policy
                        </a>
                        . I understand that my application will be reviewed by the hiring team and I may be contacted for further assessment. *
                      </span>
                    </label>
                    {errors.agreedToTerms && (
                      <p className="form-error">{errors.agreedToTerms.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={prevStep}
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex space-x-4">
                <Link href={`/jobs/${job.jobId}`}>
                  <Button variant="ghost" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={nextStep}
                    disabled={isSubmitting}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Layout>
    </>
  );
};

export default JobApplicationPage;