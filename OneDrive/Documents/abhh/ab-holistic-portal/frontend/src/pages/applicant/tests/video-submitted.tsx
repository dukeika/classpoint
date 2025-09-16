import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/shared/Layout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/shared/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const VideoTestSubmittedPage = () => {
  const router = useRouter();

  return (
    <ProtectedRoute requireRole="applicant">
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="mb-8">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Video Test Submitted Successfully
            </h1>
            <p className="text-lg text-gray-600">
              Your video interview responses have been submitted and are now being reviewed.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What happens next?</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Video Review</h3>
                  <p className="text-gray-600 text-sm">
                    Our hiring team will review your video responses within 3-5 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Evaluation Process</h3>
                  <p className="text-gray-600 text-sm">
                    Your responses will be evaluated based on communication skills, relevant experience, and cultural fit.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CalendarDaysIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Final Interview</h3>
                  <p className="text-gray-600 text-sm">
                    If you advance, you'll be invited to schedule a final interview with the hiring manager.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <PhoneIcon className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Final Decision</h3>
                  <p className="text-gray-600 text-sm">
                    We'll contact you with our final decision and next steps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Interview Process Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
                <p className="font-medium text-gray-900">Application</p>
                <p className="text-gray-500">Complete</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
                <p className="font-medium text-gray-900">Written Test</p>
                <p className="text-gray-500">Complete</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
                <p className="font-medium text-gray-900">Video Test</p>
                <p className="text-gray-500">Complete</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClockIcon className="w-4 h-4 text-gray-600" />
                </div>
                <p className="font-medium text-gray-900">Final Interview</p>
                <p className="text-gray-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Tips for Success</h3>
            <div className="text-left space-y-2 text-sm text-gray-700">
              <p>• <strong>Stay Available:</strong> Keep your email and phone accessible for interview scheduling</p>
              <p>• <strong>Prepare for Final Interview:</strong> Research the company and prepare thoughtful questions</p>
              <p>• <strong>Professional Follow-up:</strong> A thank you email after each stage shows your continued interest</p>
              <p>• <strong>Timeline Awareness:</strong> The entire process typically takes 2-3 weeks from start to finish</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-900 mb-3">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-4">
              If you have any questions about your submission or the hiring process,
              our HR team is here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                Contact HR
              </Button>
              <Button variant="outline" size="sm">
                Interview FAQ
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

export default VideoTestSubmittedPage;