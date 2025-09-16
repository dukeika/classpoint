import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/shared/Layout';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import Button from '../../../../components/shared/Button';
import VideoRecorder from '../../../../components/tests/VideoRecorder';
import { Test, TestSubmission } from '../../../../types/test';
import { clsx } from 'clsx';
import {
  ClockIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const VideoTestPage = () => {
  const router = useRouter();
  const { testId } = router.query;
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [videoResponses, setVideoResponses] = useState<Record<string, { blob: Blob; duration: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    if (!testId || !user) return;

    const loadTest = async () => {
      try {
        // Mock video test data - replace with actual API call
        const mockTest: Test = {
          testId: testId as string,
          jobId: 'job-1',
          type: 'video',
          title: 'Video Interview Assessment',
          description: 'Record video responses to interview questions',
          instructions: `Welcome to the video interview assessment. Please follow these guidelines:

• Record a clear video response for each question
• You have 2 minutes per question to record your answer
• Speak clearly and maintain eye contact with the camera
• Ensure you're in a well-lit, quiet environment
• You can re-record each answer if needed
• Review all your responses before final submission`,
          timeLimit: 20, // 20 minutes total
          questions: [
            {
              questionId: 'vq1',
              type: 'video_prompt',
              text: 'Tell us about yourself and why you\'re interested in this position.',
              timeLimit: 120, // 2 minutes
              points: 20,
              required: true,
              order: 1
            },
            {
              questionId: 'vq2',
              type: 'video_prompt',
              text: 'Describe a challenging project you worked on and how you overcame obstacles.',
              timeLimit: 180, // 3 minutes
              points: 25,
              required: true,
              order: 2
            },
            {
              questionId: 'vq3',
              type: 'video_prompt',
              text: 'How do you handle working in a team environment? Give us a specific example.',
              timeLimit: 120, // 2 minutes
              points: 20,
              required: true,
              order: 3
            },
            {
              questionId: 'vq4',
              type: 'video_prompt',
              text: 'Where do you see yourself in 5 years, and how does this role fit into your career goals?',
              timeLimit: 120, // 2 minutes
              points: 15,
              required: true,
              order: 4
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          passingScore: 70,
          maxAttempts: 1,
          showResults: false
        };

        setTest(mockTest);
        setLoading(false);
      } catch (err) {
        setError('Failed to load video test');
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user]);

  const handleRecordingComplete = (questionId: string, videoBlob: Blob, duration: number) => {
    setVideoResponses(prev => ({
      ...prev,
      [questionId]: { blob: videoBlob, duration }
    }));
  };

  const handleNextQuestion = () => {
    if (!test || currentQuestionIndex >= test.questions.length - 1) return;
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex <= 0) return;
    setCurrentQuestionIndex(prev => prev - 1);
  };

  const handleSubmitTest = async () => {
    if (!test || !user) return;

    setSubmitting(true);
    try {
      // Upload video responses and submit test
      const submission: Partial<TestSubmission> = {
        testId: test.testId,
        applicantId: user.id,
        answers: [],
        submittedAt: new Date().toISOString(),
        timeSpent: 0, // Calculate actual time spent
        status: 'submitted'
      };

      // In a real implementation, you would:
      // 1. Upload video files to cloud storage (S3, etc.)
      // 2. Save file URLs in the submission
      // 3. Submit to backend API

      // Mock submission
      console.log('Submitting video test:', submission);
      console.log('Video responses:', videoResponses);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      router.push('/applicant/tests/video-submitted');
    } catch (err) {
      setError('Failed to submit video test');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading video test...</p>
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

  // Show instructions first
  if (showInstructions) {
    return (
      <ProtectedRoute requireRole="applicant">
        <Layout>
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-8">
              <VideoCameraIcon className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
              <p className="text-lg text-gray-600">{test.description}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
              <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                {test.instructions.split('\n').map((line, index) => (
                  <p key={index} className="mb-2">{line}</p>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Test Overview</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span className="font-medium">{test.questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Time:</span>
                      <span className="font-medium">{test.timeLimit} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-medium">Video Responses</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Questions Preview</h3>
                  <div className="space-y-2 text-sm">
                    {test.questions.map((q, index) => (
                      <div key={q.questionId} className="flex justify-between items-center">
                        <span className="text-gray-600">Q{index + 1}</span>
                        <span className="text-xs text-gray-500">{q.timeLimit}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-1">Technical Requirements</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Camera and microphone access required</li>
                      <li>• Stable internet connection recommended</li>
                      <li>• Use Chrome, Firefox, or Safari for best experience</li>
                      <li>• Ensure adequate lighting and minimal background noise</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowInstructions(false)}
                  className="px-8"
                >
                  Start Video Test
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const hasResponse = videoResponses[currentQuestion.questionId];
  const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
  const completedQuestions = Object.keys(videoResponses).length;

  return (
    <ProtectedRoute requireRole="applicant">
      <Layout maxWidth="full" className="bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">
                    Question {currentQuestionIndex + 1} of {test.questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {completedQuestions} recorded
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    {currentQuestion.timeLimit}s per question
                  </div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
                <h3 className="font-medium text-gray-900 mb-4">Questions</h3>
                <div className="space-y-2">
                  {test.questions.map((q, index) => {
                    const hasVideoResponse = videoResponses[q.questionId];
                    const isCurrent = index === currentQuestionIndex;

                    return (
                      <button
                        key={q.questionId}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={clsx(
                          'w-full p-3 text-left rounded-lg border-2 transition-all',
                          isCurrent
                            ? 'border-primary-500 bg-primary-50'
                            : hasVideoResponse
                            ? 'border-green-200 bg-green-50 hover:border-green-300'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={clsx(
                            'font-medium',
                            isCurrent ? 'text-primary-700' : hasVideoResponse ? 'text-green-700' : 'text-gray-600'
                          )}>
                            Q{index + 1}
                          </span>
                          {hasVideoResponse && (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {q.timeLimit}s limit
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-2">
                      <span>Completed:</span>
                      <span className="font-medium">{completedQuestions}/{test.questions.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Question Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          Video Response
                        </span>
                        <span className="text-sm text-gray-500">
                          {currentQuestion.points} points
                        </span>
                        <span className="text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 inline mr-1" />
                          {currentQuestion.timeLimit}s limit
                        </span>
                      </div>
                      <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.text}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Video Recorder */}
                <div className="p-6">
                  <VideoRecorder
                    questionId={currentQuestion.questionId}
                    timeLimit={currentQuestion.timeLimit}
                    onRecordingComplete={(blob, duration) =>
                      handleRecordingComplete(currentQuestion.questionId, blob, duration)
                    }
                    disabled={submitting}
                  />
                </div>

                {/* Navigation */}
                <div className="p-6 border-t border-gray-200 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <div className="flex space-x-3">
                    {isLastQuestion ? (
                      <Button
                        variant="primary"
                        onClick={handleSubmitTest}
                        disabled={!hasResponse || submitting}
                      >
                        {submitting ? 'Submitting...' : 'Submit Video Test'}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleNextQuestion}
                        disabled={!hasResponse}
                      >
                        Next Question
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default VideoTestPage;