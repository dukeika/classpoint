import { useState, useEffect } from "react";
import { useVideoData } from "@/hooks/useVideoData";
import { useCandidateData } from "@/hooks/useCandidateDataReal";
import {
  CandidateApplication,
  VideoTestAttempt,
  VideoRecording,
} from "./types";
import VideoTestStartScreen from "./VideoTestStartScreen";
import VideoTestInterface from "./VideoTestInterface";
import VideoTestResults from "./VideoTestResults";
import { Button } from "@/components/ui/button";
import { Video, Clock, CheckCircle, AlertCircle, Play } from "lucide-react";

interface VideoTestTabProps {
  applicationId?: string;
}

export default function VideoTestTab({ applicationId }: VideoTestTabProps) {
  const { applications } = useCandidateData();
  const {
    videoTests,
    currentAttempt,
    getVideoTestForJob,
    startVideoTest,
    saveRecording,
    moveToNextQuestion,
    submitVideoTest,
    abandonVideoTest,
  } = useVideoData();

  const [selectedApplication, setSelectedApplication] =
    useState<CandidateApplication | null>(null);
  const [testPhase, setTestPhase] = useState<
    "select" | "start" | "taking" | "results"
  >("select");
  const [completedAttempt, setCompletedAttempt] =
    useState<VideoTestAttempt | null>(null);

  // Auto-select application if applicationId is provided
  useEffect(() => {
    if (applicationId) {
      const app = applications.find((a) => a.id === applicationId);
      if (
        app &&
        app.currentStage === 3 &&
        app.stages.video_test.status === "pending"
      ) {
        setSelectedApplication(app);
        setTestPhase("start");
      }
    }
  }, [applicationId, applications]);

  // Filter applications that are ready for video tests
  const availableVideoTests = applications.filter(
    (app) =>
      app.currentStage === 3 && app.stages.video_test.status === "pending"
  );

  const handleStartTest = async () => {
    if (!selectedApplication) return;

    const test = getVideoTestForJob(selectedApplication.jobId);
    if (!test) {
      console.error("No video test found for job:", selectedApplication.jobId);
      return;
    }

    try {
      console.log(
        "Starting video test for application:",
        selectedApplication.id
      );
      await startVideoTest(test.id, selectedApplication.id);
      setTestPhase("taking");
    } catch (error) {
      console.error("Failed to start video test:", error);
    }
  };

  const handleRecordingSaved = (
    questionId: string,
    recording: VideoRecording
  ) => {
    console.log("Recording saved for question:", questionId);
    saveRecording(questionId, recording);
  };

  const handleNext = () => {
    console.log("Moving to next question");
    moveToNextQuestion();
  };

  const handleSubmitTest = async (): Promise<VideoTestAttempt> => {
    try {
      console.log("Submitting video test");
      const result = await submitVideoTest();
      setCompletedAttempt(result);
      setTestPhase("results");
      return result;
    } catch (error) {
      console.error("Failed to submit video test:", error);
      throw error;
    }
  };

  const handleAbandonTest = () => {
    console.log("Abandoning video test");
    abandonVideoTest();
    setTestPhase("start");
  };

  const handleCloseResults = () => {
    setTestPhase("select");
    setSelectedApplication(null);
    setCompletedAttempt(null);
  };

  const handleBackToSelect = () => {
    setTestPhase("select");
    setSelectedApplication(null);
  };

  // Test Selection Phase
  if (testPhase === "select") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Video Tests
          </h2>

          {availableVideoTests.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Video Tests Available
              </h3>
              <p className="text-gray-500">
                You don't have any pending video tests at the moment. Complete
                your written assessments first to unlock video interviews.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableVideoTests.map((application) => {
                const test = getVideoTestForJob(application.jobId);
                return (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-abhh-teal-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.jobTitle}
                        </h3>
                        <p className="text-gray-600">{application.company}</p>

                        {test && (
                          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4 text-gray-400" />
                              <span>{test.questions.length} questions</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>2 min max each</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Play className="w-4 h-4 text-gray-400" />
                              <span>15s prep time</span>
                            </div>
                          </div>
                        )}

                        {application.nextAction && (
                          <div className="mt-3 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded">
                            {application.nextAction}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedApplication(application);
                          setTestPhase("start");
                        }}
                        className="ml-4 bg-abhh-teal-600 hover:bg-abhh-teal-700"
                        disabled={!test}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Start Video Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Video Tests History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Video Test History
          </h3>

          {applications.filter(
            (app) => app.stages.video_test.status === "completed"
          ).length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No completed video tests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {applications
                .filter((app) => app.stages.video_test.status === "completed")
                .map((application) => (
                  <div
                    key={application.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {application.jobTitle}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {application.company}
                      </p>
                      <p className="text-sm text-gray-500">
                        Completed on {application.stages.video_test.completedAt}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Submitted
                      </div>
                      <div className="text-xs text-gray-500">Under review</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Test Setup Phase
  if (testPhase === "start" && selectedApplication) {
    const test = getVideoTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Video Test Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The video test for this application could not be found.
          </p>
          <Button onClick={handleBackToSelect} variant="outline">
            Back to Tests
          </Button>
        </div>
      );
    }

    return (
      <VideoTestStartScreen
        test={test}
        onStart={handleStartTest}
        onCancel={handleBackToSelect}
      />
    );
  }

  // Test Taking Phase
  if (testPhase === "taking" && currentAttempt && selectedApplication) {
    const test = getVideoTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Video Test Error
          </h3>
          <p className="text-gray-500 mb-4">
            The video test data could not be loaded.
          </p>
          <Button onClick={handleBackToSelect} variant="outline">
            Back to Tests
          </Button>
        </div>
      );
    }

    return (
      <VideoTestInterface
        test={test}
        attempt={currentAttempt}
        onRecordingSaved={handleRecordingSaved}
        onNext={handleNext}
        onSubmit={handleSubmitTest}
        onAbandon={handleAbandonTest}
      />
    );
  }

  // Test Results Phase
  if (testPhase === "results" && completedAttempt && selectedApplication) {
    const test = getVideoTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Video Test Submitted
          </h3>
          <p className="text-gray-500 mb-4">
            Your video test has been submitted successfully and is now under
            review.
          </p>
          <Button
            onClick={handleCloseResults}
            className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
          >
            Back to Dashboard
          </Button>
        </div>
      );
    }

    return (
      <VideoTestResults
        test={test}
        attempt={completedAttempt}
        onClose={handleCloseResults}
      />
    );
  }

  // Loading state
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abhh-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading video test...</p>
      </div>
    </div>
  );
}
