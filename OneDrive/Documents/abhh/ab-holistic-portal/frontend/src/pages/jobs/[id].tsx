import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/shared/Layout';
import Button from '../../components/shared/Button';
import { Job } from '../../types/job';

const JobDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Simulate API call to fetch job details
      setTimeout(() => {
        const mockJob: Job = {
          jobId: id as string,
          title: 'Senior Software Engineer',
          description: `We are looking for an experienced software engineer to join our growing team and help build the next generation of healthcare technology solutions.

## About the Role

As a Senior Software Engineer at Applied Behavioral Holistic Health, you will be responsible for designing, developing, and maintaining high-quality software applications that directly impact patient care and clinical outcomes. You'll work with cutting-edge technologies in a collaborative environment where your contributions make a real difference in people's lives.

## Key Responsibilities

• **Product Development**: Design and develop scalable web applications using modern technologies
• **Architecture**: Contribute to architectural decisions and technical strategy for our platform
• **Code Quality**: Write clean, maintainable, and well-tested code following best practices
• **Collaboration**: Work closely with product managers, designers, and clinical teams
• **Mentorship**: Provide guidance and mentorship to junior developers
• **Innovation**: Stay current with emerging technologies and propose innovative solutions
• **Quality Assurance**: Participate in code reviews and ensure high standards across the team

## What We're Looking For

We seek a passionate engineer who combines technical excellence with a genuine interest in healthcare. You should be comfortable working in a fast-paced environment where your work directly impacts patient outcomes.

## Our Tech Stack

• **Frontend**: React, TypeScript, Next.js, Tailwind CSS
• **Backend**: Node.js, Express, Python
• **Database**: PostgreSQL, DynamoDB
• **Cloud**: AWS (Lambda, API Gateway, S3, CloudFront)
• **DevOps**: Docker, GitHub Actions, Terraform
• **Testing**: Jest, Cypress, Playwright

## Benefits & Perks

• **Competitive Compensation**: $120,000 - $180,000 base salary plus equity
• **Health & Wellness**: Comprehensive medical, dental, and vision insurance
• **Work-Life Balance**: Flexible work arrangements and unlimited PTO
• **Professional Growth**: $3,000 annual learning budget and conference attendance
• **Remote-First**: Work from anywhere with quarterly team retreats
• **Impact**: See your work directly improve patient outcomes and clinical workflows
• **Equipment**: Latest MacBook Pro and home office setup stipend`,
          requirements: [
            '5+ years of software development experience',
            'Proficiency in React, Node.js, and TypeScript',
            'Experience with cloud platforms (AWS preferred)',
            'Strong understanding of database design and optimization',
            'Excellent problem-solving and communication skills',
            'Experience with agile development methodologies',
            'Bachelor\'s degree in Computer Science or related field',
            'Healthcare or regulated industry experience (preferred)',
            'Experience with serverless architectures (preferred)',
            'Knowledge of HIPAA compliance requirements (preferred)'
          ],
          status: 'published',
          createdBy: 'admin@abholistic.com',
          createdAt: '2025-01-10T10:00:00Z',
          deadline: '2025-02-15T23:59:59Z',
          location: 'Remote',
          employmentType: 'full-time',
          department: 'Engineering',
          salary: '$120,000 - $180,000',
        };

        setJob(mockJob);
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-600 bg-red-50 border-red-200';
    if (daysRemaining <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Job not found</h3>
          <p className="mt-2 text-gray-500">The job you're looking for doesn't exist or is no longer available.</p>
          <div className="mt-6">
            <Link href="/jobs">
              <Button variant="primary">Browse All Jobs</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const daysRemaining = job.deadline ? getDaysRemaining(job.deadline) : null;

  return (
    <>
      <Head>
        <title>{job.title} - Applied Behavioral Holistic Health</title>
        <meta name="description" content={job.description.slice(0, 160)} />
      </Head>

      <Layout maxWidth="4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-gray-200 pb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Link href="/jobs">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <div className="text-sm text-gray-500">
                <Link href="/jobs" className="hover:text-blue-600">
                  Careers
                </Link>
                <span className="mx-2">/</span>
                <span>{job.title}</span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {job.department && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.employmentType.replace('-', ' ')}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>

              <div className="lg:ml-8 flex flex-col space-y-4">
                {daysRemaining !== null && (
                  <div className={`border rounded-lg p-4 ${getDeadlineColor(daysRemaining)}`}>
                    <div className="text-sm font-medium">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Application deadline passed'}
                    </div>
                    <div className="text-xs mt-1">
                      Deadline: {new Date(job.deadline!).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-3">
                  <Link href={`/jobs/${job.jobId}/apply`}>
                    <Button variant="primary" size="lg" fullWidth>
                      Apply for this Position
                    </Button>
                  </Link>
                  <Button variant="secondary" size="lg" fullWidth>
                    Share this Job
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.requirements.map((requirement, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-700">{requirement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Application Process */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Application Process</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <div>
                  <h4 className="font-medium text-blue-900">Submit Application</h4>
                  <p className="text-blue-700 text-sm">Complete our application form with your details and upload your resume.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <div>
                  <h4 className="font-medium text-blue-900">Written Assessment</h4>
                  <p className="text-blue-700 text-sm">Complete a technical assessment to demonstrate your skills (60 minutes).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                <div>
                  <h4 className="font-medium text-blue-900">Video Interview</h4>
                  <p className="text-blue-700 text-sm">Record responses to behavioral and technical questions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                <div>
                  <h4 className="font-medium text-blue-900">Final Interview</h4>
                  <p className="text-blue-700 text-sm">Live interview with the hiring team to discuss your experience and our culture.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                <div>
                  <h4 className="font-medium text-blue-900">Decision</h4>
                  <p className="text-blue-700 text-sm">We'll make our decision and extend an offer to the successful candidate.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-8 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to make an impact?
            </h3>
            <p className="text-gray-600 mb-6">
              Join our team and help us revolutionize behavioral healthcare.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href={`/jobs/${job.jobId}/apply`}>
                <Button variant="primary" size="lg">
                  Apply Now
                </Button>
              </Link>
              <Link href="/jobs">
                <Button variant="secondary" size="lg">
                  View Other Positions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default JobDetailsPage;