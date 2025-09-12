// File: src/components/candidate/TestResults.tsx
import { Test, TestAttempt } from "./types";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface TestResultsProps {
  test: Test;
  attempt: TestAttempt;
  onClose: () => void;
}

export default function TestResults({
  test,
  attempt,
  onClose,
}: TestResultsProps) {
  const { score = 0, percentage = 0, passed = false } = attempt;
  const timeTaken =
    attempt.startedAt && attempt.completedAt
      ? Math.round(
          (new Date(attempt.completedAt).getTime() -
            new Date(attempt.startedAt).getTime()) /
            1000 /
            60
        )
      : 0;

  const getScoreColor = () => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= test.passingScore) return "text-blue-600";
    return "text-red-600";
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return "Excellent performance!";
    if (percentage >= test.passingScore)
      return "Good job! You passed the test.";
    return "Unfortunately, you did not meet the passing score.";
  };

  const getCategoryBreakdown = () => {
    const categories = Array.from(
      new Set(test.questions.map((q) => q.category))
    );
    return categories.map((category) => {
      const categoryQuestions = test.questions.filter(
        (q) => q.category === category
      );
      const categoryScore = categoryQuestions.reduce((total, question) => {
        const answer = attempt.answers[question.id];
        if (
          question.type === "multiple_choice" &&
          answer === question.correctAnswer
        ) {
          return total + question.points;
        } else if (question.type === "text" && answer && answer.trim()) {
          return total + question.points * 0.8; // Partial credit for text answers
        }
        return total;
      }, 0);

      const categoryMax = categoryQuestions.reduce(
        (total, q) => total + q.points,
        0
      );
      const categoryPercentage =
        categoryMax > 0 ? Math.round((categoryScore / categoryMax) * 100) : 0;

      return {
        category,
        score: categoryScore,
        maxScore: categoryMax,
        percentage: categoryPercentage,
        questionsCount: categoryQuestions.length,
      };
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
        <div className="text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              passed ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {passed ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Completed!
          </h1>
          <p className="text-lg text-gray-600 mb-4">{test.title}</p>
          <p
            className={`text-lg font-medium ${
              passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {getPerformanceMessage()}
          </p>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>
            {percentage}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Final Score</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{score}</div>
          <div className="text-sm text-gray-600 mt-1">Points Earned</div>
          <div className="text-xs text-gray-500">out of {test.totalPoints}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-3xl font-bold text-gray-900">{timeTaken}</div>
          <div className="text-sm text-gray-600 mt-1">Minutes Used</div>
          <div className="text-xs text-gray-500">out of {test.timeLimit}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div
            className={`text-3xl font-bold ${
              passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {passed ? "PASS" : "FAIL"}
          </div>
          <div className="text-sm text-gray-600 mt-1">Result</div>
          <div className="text-xs text-gray-500">Need {test.passingScore}%</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Performance by Category
        </h3>

        <div className="space-y-4">
          {getCategoryBreakdown().map((cat) => (
            <div
              key={cat.category}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{cat.category}</h4>
                  <p className="text-sm text-gray-500">
                    {cat.questionsCount} questions
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {cat.percentage}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {cat.score}/{cat.maxScore} points
                  </div>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    cat.percentage >= 80
                      ? "bg-green-500"
                      : cat.percentage >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${cat.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What&apos;s Next?
        </h3>

        {passed ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-green-900">Congratulations!</h4>
                <p className="text-green-700 mt-1">
                  You&apos;ve successfully passed the written assessment. The
                  hiring team will review your results and contact you about the
                  next stage of the interview process.
                </p>
                <div className="mt-3">
                  <p className="text-sm text-green-600 font-medium">
                    Expected timeline:
                  </p>
                  <ul className="text-sm text-green-700 mt-1 ml-4">
                    <li>• Results review: 1-2 business days</li>
                    <li>• Video interview invitation: 3-5 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-medium text-red-900">Test Not Passed</h4>
                <p className="text-red-700 mt-1">
                  Unfortunately, your score did not meet the minimum requirement
                  of {test.passingScore}%. We encourage you to continue
                  developing your skills and apply for future opportunities.
                </p>
                <div className="mt-3">
                  <p className="text-sm text-red-600 font-medium">
                    Recommendations:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 ml-4">
                    <li>• Review the topics you struggled with</li>
                    <li>• Consider additional training or certification</li>
                    <li>• Check back for similar positions in the future</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="text-center">
        <Button onClick={onClose} className="px-8">
          Return to Applications
        </Button>
      </div>
    </div>
  );
}
