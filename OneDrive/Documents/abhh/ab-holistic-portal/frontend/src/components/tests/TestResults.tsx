import React from 'react';
import { clsx } from 'clsx';
import { CheckCircleIcon, XCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { TestSubmission, Test, Question } from '../../types/test';

interface TestResultsProps {
  submission: TestSubmission;
  test: Test;
  showCorrectAnswers?: boolean;
  className?: string;
}

const TestResults: React.FC<TestResultsProps> = ({
  submission,
  test,
  showCorrectAnswers = false,
  className
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPoints = test.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const percentage = submission.score ? Math.round((submission.score / totalPoints) * 100) : 0;
  const passed = percentage >= (test.passingScore || 0);

  const getQuestionResult = (question: Question) => {
    const answer = submission.answers.find(a => a.questionId === question.questionId);
    if (!answer) return null;

    if (question.type === 'mcq' && question.correctAnswer !== undefined) {
      const isCorrect = answer.response === question.correctAnswer;
      return {
        isCorrect,
        points: isCorrect ? (question.points || 0) : 0,
        maxPoints: question.points || 0
      };
    }

    // For non-MCQ questions, show awarded points if available
    return {
      isCorrect: undefined,
      points: answer.points || 0,
      maxPoints: question.points || 0
    };
  };

  return (
    <div className={clsx('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className={clsx(
        'p-6 border-b border-gray-200',
        passed ? 'bg-green-50' : 'bg-red-50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {passed ? (
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            ) : (
              <XCircleIcon className="w-12 h-12 text-red-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {passed ? 'Test Passed' : 'Test Not Passed'}
              </h2>
              <p className="text-gray-600">
                Score: {submission.score || 0} / {totalPoints} points ({percentage}%)
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{percentage}%</div>
            <div className="text-sm text-gray-600">
              Required: {test.passingScore || 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Test Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <DocumentTextIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <div className="text-lg font-semibold text-gray-900">
              {submission.answers.length} / {test.questions.length}
            </div>
            <div className="text-sm text-gray-600">Questions Answered</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <ClockIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <div className="text-lg font-semibold text-gray-900">
              {formatTime(submission.timeSpent)}
            </div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className={clsx(
              'w-6 h-6 mx-auto mb-2 rounded-full flex items-center justify-center',
              passed ? 'bg-green-500' : 'bg-red-500'
            )}>
              {passed ? (
                <CheckCircleIcon className="w-4 h-4 text-white" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {submission.score || 0}
            </div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-lg font-semibold text-gray-900">
              {new Date(submission.submittedAt!).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
        </div>
      </div>

      {/* Question Results */}
      <div className="p-6">
        <h3 className="font-medium text-gray-900 mb-4">Question Results</h3>
        <div className="space-y-4">
          {test.questions.map((question, index) => {
            const result = getQuestionResult(question);
            const answer = submission.answers.find(a => a.questionId === question.questionId);

            return (
              <div key={question.questionId} className="border border-gray-200 rounded-lg">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          Question {index + 1}
                        </span>
                        <span className={clsx(
                          'px-2 py-1 text-xs font-medium rounded',
                          question.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                          question.type === 'short_answer' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        )}>
                          {question.type === 'mcq' ? 'Multiple Choice' :
                           question.type === 'short_answer' ? 'Short Answer' : 'Essay'}
                        </span>
                        {result?.isCorrect !== undefined && (
                          <span className={clsx(
                            'px-2 py-1 text-xs font-medium rounded',
                            result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {result.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium">{question.text}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {result?.points || 0} / {result?.maxPoints || 0} pts
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Show options for MCQ */}
                  {question.type === 'mcq' && question.options && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = answer?.response === optionIndex.toString();
                          const isCorrect = question.correctAnswer === optionIndex.toString();

                          return (
                            <div
                              key={optionIndex}
                              className={clsx(
                                'p-2 rounded border',
                                isSelected && isCorrect ? 'bg-green-50 border-green-200' :
                                isSelected && !isCorrect ? 'bg-red-50 border-red-200' :
                                !isSelected && isCorrect && showCorrectAnswers ? 'bg-blue-50 border-blue-200' :
                                'bg-gray-50 border-gray-200'
                              )}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{String.fromCharCode(65 + optionIndex)}.</span>
                                <span className="text-sm text-gray-900">{option}</span>
                                {isSelected && (
                                  <span className="text-xs text-gray-500">(Your answer)</span>
                                )}
                                {!isSelected && isCorrect && showCorrectAnswers && (
                                  <span className="text-xs text-blue-600">(Correct answer)</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show answer for non-MCQ */}
                  {question.type !== 'mcq' && answer && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {answer.response as string}
                        </p>
                      </div>
                    </div>
                  )}

                  {!answer && (
                    <div className="text-sm text-gray-500 italic">
                      No answer provided
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Review Section */}
      {submission.adminReview && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Admin Review</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">
            {submission.adminReview}
          </p>
          {submission.gradeBy && submission.gradedAt && (
            <div className="mt-3 text-xs text-gray-500">
              Reviewed by {submission.gradeBy} on {new Date(submission.gradedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestResults;