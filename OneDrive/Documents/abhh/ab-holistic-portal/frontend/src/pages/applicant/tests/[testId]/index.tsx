import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/shared/Layout';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import Button from '../../../../components/shared/Button';
import { Test } from '../../../../types/test';
import { ClockIcon, DocumentTextIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TestStartPage = () => {
  const router = useRouter();
  const { testId } = router.query;
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!testId || !user) return;

    const loadTest = async () => {
      try {
        // Mock test data - replace with actual API call
        const mockTest: Test = {
          testId: testId as string,
          jobId: 'job-1',
          type: 'written',
          title: 'Software Developer Assessment',
          description: 'Technical assessment for software developer position',
          instructions: `Please read these instructions carefully before starting the test:

• You have 60 minutes to complete all questions
• There are 3 questions in total: multiple choice, short answer, and essay
• Your answers are automatically saved as you type
• You can navigate between questions and flag them for review
• Once you submit the test, you cannot make changes
• Ensure you have a stable internet connection
• Do not refresh the page or close the browser during the test`,
          timeLimit: 60,
          questions: [
            {
              questionId: 'q1',
              type: 'mcq',
              text: 'What is the primary purpose of React hooks?',
              options: [
                'To replace class components entirely',
                'To manage state and side effects in functional components',
                'To improve performance of React applications',
                'To handle routing in React applications'
              ],
              correctAnswer: '1',
              points: 10,
              required: true,
              order: 1
            },
            {
              questionId: 'q2',
              type: 'short_answer',
              text: 'Explain the difference between let, const, and var in JavaScript.',
              points: 15,
              required: true,
              order: 2
            },
            {
              questionId: 'q3',
              type: 'essay',
              text: 'Describe your approach to debugging a complex issue in a production application.',
              points: 25,
              required: true,
              order: 3
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          passingScore: 70,
          maxAttempts: 1,
          showResults: true
        };

        setTest(mockTest);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test');
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user]);

  const handleStartTest = () => {
    if (!test) return;

    setHasStarted(true);
    router.push(`/applicant/tests/${testId}/take`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !test) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Test not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  const totalPoints = test.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <ProtectedRoute requireRole="applicant">
      <Layout>
        <div className="max-w-4xl mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
            {test.description && (
              <p className="text-lg text-gray-600">{test.description}</p>
            )}
          </div>

          {/* Test Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{test.timeLimit}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{test.questions.length}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ExclamationTriangleIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{test.passingScore}%</div>
                  <div className="text-sm text-gray-600">Passing Score</div>
                </div>
              </div>

              {/* Question breakdown */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Question Types</h3>
                <div className="space-y-2">
                  {test.questions.map((question, index) => (
                    <div key={question.questionId} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          question.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                          question.type === 'short_answer' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {question.type === 'mcq' ? 'Multiple Choice' :
                           question.type === 'short_answer' ? 'Short Answer' : 'Essay'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{question.points || 0} points</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    Total: {totalPoints} points
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="prose prose-sm max-w-none text-gray-700">
                {test.instructions.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-2">Important Notes</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Once you start the test, the timer will begin immediately</li>
                  <li>• You cannot pause the test once started</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Do not refresh your browser or navigate away from the test</li>
                  {test.maxAttempts && (
                    <li>• You have {test.maxAttempts} attempt(s) to complete this test</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* System Check */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-green-800 mb-3">System Check</h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Internet connection: Good</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Browser compatibility: Supported</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto-save: Enabled</span>
              </div>
            </div>
          </div>

          {/* Start Test Button */}
          <div className="text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartTest}
              disabled={hasStarted}
              className="px-8 py-3"
            >
              {hasStarted ? 'Starting Test...' : 'Start Test'}
            </Button>
            <p className="mt-3 text-sm text-gray-600">
              By clicking "Start Test", you agree to complete the test in one session
            </p>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default TestStartPage;