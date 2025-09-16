import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const TestSubmittedPage = () => {
  const router = useRouter();

  return (
    <ProtectedRoute requireRole="applicant">
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test Submitted Successfully
            </h1>
            <p className="text-lg text-gray-600">
              Your written test has been submitted and is now being reviewed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What happens next?</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Review Period</h3>
                  <p className="text-gray-600 text-sm">
                    Our team will review your test responses within 2-3 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Results Notification</h3>
                  <p className="text-gray-600 text-sm">
                    You'll receive an email notification with your test results and next steps.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Next Stage</h3>
                  <p className="text-gray-600 text-sm">
                    If you pass the written test, you'll be invited to complete the video assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your submission or the hiring process,
              feel free to contact our HR team.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                Contact HR
              </Button>
              <Button variant="outline" size="sm">
                FAQ
              </Button>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              onClick={() => router.push('/applicant/dashboard')}
            >
              Return to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/jobs')}
            >
              Browse Other Jobs
            </Button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default TestSubmittedPage;