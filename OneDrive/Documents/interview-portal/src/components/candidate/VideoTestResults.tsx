// File: src/components/candidate/VideoTestResults.tsx
import { VideoTest, VideoTestAttempt } from "./types";
import { Button } from "@/components/ui/button";
import { CheckCircle, Video, Clock, Trophy } from "lucide-react";

interface VideoTestResultsProps {
  test: VideoTest;
  attempt: VideoTestAttempt;
  onClose: () => void;
}

export default function VideoTestResults({
  test,
  attempt,
  onClose,
}: VideoTestResultsProps) {
  const recordingsCount = Object.keys(attempt.recordings).length;
  const totalQuestions = test.questions.length;
  const completionRate = Math.round((recordingsCount / totalQuestions) * 100);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Video Test Completed!
        </h2>

        <p className="text-lg text-gray-600 mb-8">
          Your video responses have been recorded and submitted successfully.
        </p>

        {/* Test Summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {recordingsCount}
            </div>
            <div className="text-sm text-gray-500">Recordings</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {test.totalPoints}
            </div>
            <div className="text-sm text-gray-500">Max Points</div>
          </div>
        </div>

        {/* Test Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">{test.title}</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Started:</span>
              <span>{new Date(attempt.startedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Completed:</span>
              <span>
                {attempt.completedAt
                  ? new Date(attempt.completedAt).toLocaleString()
                  : "In Progress"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Questions Answered:</span>
              <span>
                {recordingsCount} of {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-blue-900 mb-2">What Happens Next?</h3>
          <p className="text-blue-800 text-sm">
            Your video responses will be reviewed by our hiring team. You'll
            receive an update on your application status within 3-5 business
            days. If selected, you'll be contacted to schedule a final
            interview.
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={onClose}
          className="px-8 py-3 bg-abhh-teal-600 hover:bg-abhh-teal-700"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
