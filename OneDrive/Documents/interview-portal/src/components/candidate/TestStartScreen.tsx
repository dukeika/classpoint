// File: src/components/candidate/TestStartScreen.tsx
import { Test } from "./types";
import { Button } from "@/components/ui/button";
import { Clock, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface TestStartScreenProps {
  test: Test;
  onStart: () => void;
  onCancel: () => void;
}

export default function TestStartScreen({
  test,
  onStart,
  onCancel,
}: TestStartScreenProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-abhh-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-abhh-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {test.title}
          </h1>
          <p className="text-lg text-gray-600">{test.description}</p>
        </div>

        {/* Test Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {test.timeLimit}
            </div>
            <div className="text-sm text-blue-700">Minutes</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {test.questions.length}
            </div>
            <div className="text-sm text-green-700">Questions</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {test.passingScore}%
            </div>
            <div className="text-sm text-purple-700">To Pass</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Instructions
          </h3>
          <div className="prose prose-sm text-gray-700">
            <p>{test.instructions}</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  Important Guidelines
                </div>
                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                  <li>• Once started, the timer cannot be paused</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Answer all questions to maximize your score</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• Test will auto-submit when time expires</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Question Categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Question Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(new Set(test.questions.map((q) => q.category))).map(
              (category) => {
                const count = test.questions.filter(
                  (q) => q.category === category
                ).length;
                return (
                  <div
                    key={category}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="font-medium text-gray-900">{category}</div>
                    <div className="text-sm text-gray-500">
                      {count} questions
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onCancel} className="px-8">
            Cancel
          </Button>
          <Button
            onClick={onStart}
            className="px-8 bg-abhh-teal-600 hover:bg-abhh-teal-700"
          >
            Start Test
          </Button>
        </div>
      </div>
    </div>
  );
}
