// TestReviewModal.tsx - Written Test Review Interface for Admin
import React, { useState, useEffect } from 'react';
import { 
  FileText, User, Clock, CheckCircle, XCircle, ThumbsUp, ThumbsDown,
  Award, AlertCircle, Eye, MessageSquare, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { testService } from '@/services/testService';
import { Application, TestAttempt, Test } from '@/API';

interface TestReviewModalProps {
  application: Application & { candidateName: string; jobTitle: string; };
  isOpen: boolean;
  onClose: () => void;
  onApprove: (feedback?: string) => void;
  onReject: (reason: string) => void;
}

interface ReviewQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  candidateAnswer?: any;
  points: number;
  earnedPoints?: number;
  isCorrect?: boolean;
  needsReview?: boolean;
}

export default function TestReviewModal({ 
  application, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: TestReviewModalProps) {
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [manualScores, setManualScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && application) {
      loadTestData();
    }
  }, [isOpen, application]);

  const loadTestData = async () => {
    try {
      setLoading(true);
      
      // Get the test attempt for this application
      const attempts = Array.isArray(application.testAttempts) ? application.testAttempts : 
                      (application.testAttempts?.items || []);
      const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
      
      if (!latestAttempt) {
        console.error('No test attempt found');
        return;
      }

      // Get the test details
      const testDetails = await testService.getTest(latestAttempt.testId);
      
      if (!testDetails) {
        console.error('Test not found');
        return;
      }

      setTestAttempt(latestAttempt);
      setTest(testDetails);

      // Parse questions and answers for review
      const testQuestions = JSON.parse(testDetails.questions || '[]');
      const candidateAnswers = latestAttempt.answers ? JSON.parse(latestAttempt.answers as string) : {};
      
      const reviewQuestions: ReviewQuestion[] = testQuestions.map((q: any) => {
        const candidateAnswer = candidateAnswers[q.id];
        let isCorrect = false;
        let earnedPoints = 0;

        // Auto-grade based on question type
        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          isCorrect = candidateAnswer === q.correctAnswer;
          earnedPoints = isCorrect ? q.points : 0;
        } else {
          // Short answer and essay need manual review
          earnedPoints = manualScores[q.id] || 0;
        }

        return {
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          candidateAnswer,
          points: q.points,
          earnedPoints,
          isCorrect,
          needsReview: q.type === 'short_answer' || q.type === 'essay'
        };
      });

      setQuestions(reviewQuestions);
    } catch (error) {
      console.error('Error loading test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScore = (questionId: string, score: number) => {
    setManualScores(prev => ({ ...prev, [questionId]: score }));
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, earnedPoints: score } : q
    ));
  };

  const calculateTotalScore = () => {
    const total = questions.reduce((sum, q) => sum + (q.earnedPoints || 0), 0);
    const possible = questions.reduce((sum, q) => sum + q.points, 0);
    return { total, possible, percentage: possible > 0 ? Math.round((total / possible) * 100) : 0 };
  };

  const handleApprove = () => {
    onApprove(feedback);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    onReject(rejectionReason);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading test review...</p>
        </div>
      </div>
    );
  }

  if (!testAttempt || !test) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800">Unable to load test data</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  const scoreData = calculateTotalScore();
  const passingScore = test.passingScore || 70;
  const isPassing = scoreData.percentage >= passingScore;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Written Test Review</h2>
                <p className="text-sm text-gray-600">{test.title} - {application.candidateName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Test Summary */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{scoreData.total}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{scoreData.possible}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                {scoreData.percentage}%
              </div>
              <div className="text-sm text-gray-600">Score Percentage</div>
            </div>
            <div className="text-center">
              <div className={`flex items-center justify-center ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                {isPassing ? <CheckCircle className="w-6 h-6 mr-1" /> : <XCircle className="w-6 h-6 mr-1" />}
                <span className="font-medium">{isPassing ? 'PASS' : 'FAIL'}</span>
              </div>
              <div className="text-sm text-gray-600">Required: {passingScore}%</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Started:</span> {new Date(testAttempt.startedAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Completed:</span> {testAttempt.completedAt ? new Date(testAttempt.completedAt).toLocaleString() : 'In Progress'}
            </div>
            <div>
              <span className="font-medium">Time Used:</span> {test.timeLimit - (testAttempt.timeRemaining || 0)} minutes
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Question-by-Question Review</h3>
          
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">Question {index + 1}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                        question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                        question.type === 'short_answer' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {question.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{question.points} pts</span>
                    </div>
                    <p className="text-gray-900 mb-3">{question.question}</p>
                  </div>
                  
                  <div className="ml-4 text-right">
                    {question.needsReview ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={question.points}
                          value={question.earnedPoints || 0}
                          onChange={(e) => handleManualScore(question.id, Math.min(question.points, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <span className="text-xs text-gray-500">/ {question.points}</span>
                      </div>
                    ) : (
                      <div className={`text-lg font-bold ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {question.earnedPoints} / {question.points}
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Options for Multiple Choice */}
                {question.type === 'multiple_choice' && question.options && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Options:</div>
                    <div className="space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className={`text-sm p-2 rounded ${
                          optIndex === question.correctAnswer ? 'bg-green-100 text-green-800' :
                          optIndex === question.candidateAnswer ? 'bg-red-100 text-red-800' :
                          'bg-gray-50 text-gray-700'
                        }`}>
                          {optIndex === question.correctAnswer && <CheckCircle className="w-4 h-4 inline mr-2" />}
                          {optIndex === question.candidateAnswer && optIndex !== question.correctAnswer && <XCircle className="w-4 h-4 inline mr-2" />}
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False Display */}
                {question.type === 'true_false' && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Answer:</div>
                    <div className="flex space-x-4">
                      <span className={`px-3 py-1 rounded text-sm ${
                        question.correctAnswer === 0 ? 'bg-green-100 text-green-800' :
                        question.candidateAnswer === 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        True {question.correctAnswer === 0 && '✓'} {question.candidateAnswer === 0 && question.correctAnswer !== 0 && '✗'}
                      </span>
                      <span className={`px-3 py-1 rounded text-sm ${
                        question.correctAnswer === 1 ? 'bg-green-100 text-green-800' :
                        question.candidateAnswer === 1 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        False {question.correctAnswer === 1 && '✓'} {question.candidateAnswer === 1 && question.correctAnswer !== 1 && '✗'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Text Answers */}
                {(question.type === 'short_answer' || question.type === 'essay') && (
                  <div className="space-y-3">
                    {question.correctAnswer && (
                      <div>
                        <div className="text-sm font-medium text-green-700 mb-1">Expected Answer:</div>
                        <div className="bg-green-50 p-3 rounded border border-green-200 text-sm">
                          {question.correctAnswer}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Candidate's Answer:</div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                        {question.candidateAnswer || <em className="text-gray-500">No answer provided</em>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {/* Feedback Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback for Candidate (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Provide constructive feedback about the candidate's performance..."
            />
          </div>

          {/* Rejection Form */}
          {showRejectionForm && (
            <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <label className="block text-sm font-medium text-red-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={2}
                placeholder="Please provide a clear reason for rejecting this application..."
                required
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {!showRejectionForm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectionForm(false);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Rejection
                  </Button>
                </div>
              )}
            </div>

            {!showRejectionForm && (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Final Score</div>
                  <div className={`text-lg font-bold ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
                    {scoreData.percentage}% ({scoreData.total}/{scoreData.possible})
                  </div>
                </div>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Approve & Progress
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}