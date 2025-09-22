import React from 'react';
import Head from 'next/head';
import Layout from '../../components/shared/Layout';
import JobListNew from '../../components/jobs/JobListNew';

/**
 * New Public Jobs Page - Clean implementation with zero legacy code
 * Fetches real data from AWS API endpoints
 */
const JobsNewPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Available Jobs - AB Holistic Interview Portal</title>
        <meta
          name="description"
          content="Browse available job opportunities at AB Holistic. Find your next career opportunity with us."
        />
        <meta name="keywords" content="jobs, careers, opportunities, AB Holistic, employment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Find Your Next Opportunity
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Discover exciting career opportunities at AB Holistic. We're always looking for talented individuals to join our growing team.
                </p>
              </div>
            </div>
          </div>

          {/* Jobs Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Openings</h2>
              <p className="text-gray-600">
                Browse all available positions and find the perfect fit for your skills and career goals.
              </p>
            </div>

            {/* Job List Component */}
            <JobListNew
              isAdminView={false}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            />
          </div>

          {/* Call to Action Section */}
          <div className="bg-blue-50 border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Don't See the Right Position?
                </h3>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  We're always interested in connecting with talented professionals.
                  Send us your resume and we'll keep you in mind for future opportunities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:careers@abholistic.com"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Your Resume
                  </a>
                  <a
                    href="/about"
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Learn About Us
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Company Benefits */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Work With Us?</h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We believe in creating an environment where our team can thrive and grow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                <p className="text-gray-600">
                  Continuous learning and development opportunities to advance your career.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Team</h4>
                <p className="text-gray-600">
                  Work with passionate professionals in a supportive, inclusive environment.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Work-Life Balance</h4>
                <p className="text-gray-600">
                  Flexible working arrangements and comprehensive benefits package.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default JobsNewPage;