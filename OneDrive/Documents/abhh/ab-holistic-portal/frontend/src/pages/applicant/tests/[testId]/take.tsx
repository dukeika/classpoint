import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../contexts/AuthContext';
import Layout from '../../../../components/shared/Layout';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import Button from '../../../../components/shared/Button';
import { Test, TestSession, Answer } from '../../../../types/test';
import { clsx } from 'clsx';

const TakeTestPage = () => {
  const router = useRouter();
  const { testId } = router.query;
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Timer formatting
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Load test and initialize session
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
          instructions: 'Answer all questions to the best of your ability. You may flag questions to review later.',
          timeLimit: 60, // 60 minutes
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
              text: 'Describe your approach to debugging a complex issue in a production application. Include specific tools and methodologies you would use.',
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

        // Initialize test session
        const newSession: TestSession = {
          attemptId: `attempt-${Date.now()}`,
          test: mockTest,
          answers: {},
          currentQuestionIndex: 0,
          timeRemaining: mockTest.timeLimit * 60, // Convert to seconds
          isSubmitted: false,
          startTime: Date.now(),
          flaggedQuestions: new Set()
        };

        setSession(newSession);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test');
        setLoading(false);
      }
    };

    loadTest();
  }, [testId, user]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.isSubmitted) return;

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.timeRemaining <= 0) {
          // Auto-submit when time runs out
          handleSubmitTest();
          return prev;
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Auto-save answers
  useEffect(() => {
    if (!session || !currentAnswer) return;

    const autoSaveTimer = setTimeout(() => {
      saveAnswer();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [currentAnswer, session?.currentQuestionIndex]);

  const saveAnswer = useCallback(async () => {
    if (!session || !currentAnswer.trim()) return;

    setAutoSaveStatus('saving');
    try {
      const currentQuestion = session.test.questions[session.currentQuestionIndex];
      const newAnswer: Answer = {
        questionId: currentQuestion.questionId,
        response: currentAnswer,
        timeSpent: Math.floor((Date.now() - session.startTime) / 1000)
      };

      setSession(prev => ({
        ...prev!,
        answers: {
          ...prev!.answers,
          [currentQuestion.questionId]: newAnswer
        }
      }));

      // Here you would save to backend
      // await saveTestAnswer(session.attemptId, newAnswer);

      setAutoSaveStatus('saved');
    } catch (err) {
      setAutoSaveStatus('error');
    }
  }, [session, currentAnswer]);

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
  };

  const handleNavigateQuestion = (index: number) => {
    if (!session) return;

    // Save current answer before navigating
    if (currentAnswer.trim()) {
      saveAnswer();
    }

    const targetQuestion = session.test.questions[index];
    const existingAnswer = session.answers[targetQuestion.questionId];

    setSession(prev => ({
      ...prev!,
      currentQuestionIndex: index
    }));

    setCurrentAnswer(existingAnswer?.response as string || '');
  };

  const handleFlagQuestion = () => {
    if (!session) return;

    const currentQuestion = session.test.questions[session.currentQuestionIndex];
    const newFlagged = new Set(session.flaggedQuestions);

    if (newFlagged.has(currentQuestion.questionId)) {
      newFlagged.delete(currentQuestion.questionId);
    } else {
      newFlagged.add(currentQuestion.questionId);
    }

    setSession(prev => ({
      ...prev!,
      flaggedQuestions: newFlagged
    }));
  };

  const handleSubmitTest = async () => {
    if (!session) return;

    try {
      // Save final answer
      if (currentAnswer.trim()) {
        await saveAnswer();
      }

      // Mark as submitted
      setSession(prev => ({
        ...prev!,
        isSubmitted: true
      }));

      // Submit to backend
      // await submitTest(session.attemptId, session.answers);

      // Redirect to results or confirmation page
      router.push('/applicant/tests/submitted');
    } catch (err) {
      setError('Failed to submit test');
    }
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

  if (error || !test || !session) {
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

  const currentQuestion = session.test.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / session.test.questions.length) * 100;
  const isLastQuestion = session.currentQuestionIndex === session.test.questions.length - 1;
  const answeredQuestions = Object.keys(session.answers).length;
  const isFlagged = session.flaggedQuestions.has(currentQuestion.questionId);

  return (
    <ProtectedRoute requireRole="applicant">
      <Layout maxWidth="full" className="bg-gray-50">
        {/* Header with timer and progress */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">
                    Question {session.currentQuestionIndex + 1} of {test.questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {answeredQuestions} answered
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className={clsx(
                    'text-lg font-mono font-bold',
                    session.timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {formatTime(session.timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-500">Time Remaining</div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={clsx(
                    'w-2 h-2 rounded-full',
                    autoSaveStatus === 'saved' ? 'bg-green-500' :
                    autoSaveStatus === 'saving' ? 'bg-yellow-500' : 'bg-red-500'
                  )}></div>
                  <span className="text-xs text-gray-500">
                    {autoSaveStatus === 'saved' ? 'Saved' :
                     autoSaveStatus === 'saving' ? 'Saving...' : 'Save Error'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question navigation sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
                <h3 className="font-medium text-gray-900 mb-4">Questions</h3>
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {test.questions.map((q, index) => {
                    const isAnswered = session.answers[q.questionId];
                    const isCurrent = index === session.currentQuestionIndex;
                    const isFlaggedQ = session.flaggedQuestions.has(q.questionId);

                    return (
                      <button
                        key={q.questionId}
                        onClick={() => handleNavigateQuestion(index)}
                        className={clsx(
                          'w-full p-2 text-sm rounded-lg border-2 transition-all relative',
                          isCurrent
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : isAnswered
                            ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-300'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        )}
                      >
                        {index + 1}
                        {isFlaggedQ && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Answered:</span>
                      <span className="font-medium">{answeredQuestions}/{test.questions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Flagged:</span>
                      <span className="font-medium">{session.flaggedQuestions.size}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main question area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          currentQuestion.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                          currentQuestion.type === 'short_answer' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        )}>
                          {currentQuestion.type === 'mcq' ? 'Multiple Choice' :
                           currentQuestion.type === 'short_answer' ? 'Short Answer' : 'Essay'}
                        </span>
                        {currentQuestion.points && (
                          <span className="text-sm text-gray-500">
                            {currentQuestion.points} points
                          </span>
                        )}
                        {currentQuestion.required && (
                          <span className="text-xs text-red-500">Required</span>
                        )}
                      </div>
                      <h2 className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.text}
                      </h2>
                    </div>

                    <Button
                      variant={isFlagged ? "primary" : "outline"}
                      size="sm"
                      onClick={handleFlagQuestion}
                      className="ml-4"
                    >
                      {isFlagged ? 'Unflag' : 'Flag'}
                    </Button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Answer input based on question type */}
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={index}
                          className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={currentQuestion.questionId}
                            value={index.toString()}
                            checked={currentAnswer === index.toString()}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            className="mt-1 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'short_answer' && (
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Enter your answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={4}
                    />
                  )}

                  {currentQuestion.type === 'essay' && (
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Enter your detailed answer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      rows={12}
                    />
                  )}
                </div>

                {/* Navigation buttons */}
                <div className="p-6 border-t border-gray-200 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleNavigateQuestion(session.currentQuestionIndex - 1)}
                    disabled={session.currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <div className="flex space-x-3">
                    {isLastQuestion ? (
                      <Button
                        variant="primary"
                        onClick={() => setShowConfirmSubmit(true)}
                      >
                        Submit Test
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => handleNavigateQuestion(session.currentQuestionIndex + 1)}
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

        {/* Submit confirmation modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Test</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to submit your test? You have answered {answeredQuestions} out of {test.questions.length} questions.
                {session.flaggedQuestions.size > 0 && ` You have ${session.flaggedQuestions.size} flagged questions.`}
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitTest}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default TakeTestPage;