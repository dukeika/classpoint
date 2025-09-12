// File: src/components/candidate/TestTab.tsx
import { useState, useEffect } from "react";
import { useTestData } from "@/hooks/useTestData";
import { useCandidateData } from "@/hooks/useCandidateDataReal";
import { CandidateApplication, TestAttempt } from "./types";
import TestStartScreen from "./TestStartScreen";
import WrittenTestInterface from "./WrittenTestInterface";
import TestResults from "./TestResults";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface TestTabProps {
  applicationId?: string; // If accessing from a specific application
}

export default function TestTab({ applicationId }: TestTabProps) {
  const { applications } = useCandidateData();
  const {
    tests,
    currentAttempt,
    getTestForJob,
    startTest,
    saveAnswer,
    submitTest,
    abandonTest,
    setCurrentAttempt,
  } = useTestData();

  const [selectedApplication, setSelectedApplication] =
    useState<CandidateApplication | null>(null);
  const [testPhase, setTestPhase] = useState<
    "select" | "start" | "taking" | "results"
  >("select");
  const [completedAttempt, setCompletedAttempt] = useState<TestAttempt | null>(
    null
  );

  // If applicationId is provided, select that application
  useEffect(() => {
    if (applicationId) {
      const app = applications.find((a) => a.id === applicationId);
      if (app) {
        setSelectedApplication(app);
        setTestPhase("start");
      }
    }
  }, [applicationId, applications]);

  const availableTests = applications.filter(
    (app) =>
      app.currentStage === 2 && app.stages.written_test.status === "pending"
  );

  const handleStartTest = async () => {
    if (!selectedApplication) return;

    const test = getTestForJob(selectedApplication.jobId);
    if (!test) return;

    try {
      await startTest(test.id, selectedApplication.id);
      setTestPhase("taking");
    } catch (error) {
      console.error("Failed to start test:", error);
    }
  };

  const handleSubmitTest = async (): Promise<TestAttempt> => {
    try {
      const result = await submitTest();
      setCompletedAttempt(result);
      setTestPhase("results");
      return result;
    } catch (error) {
      console.error("Failed to submit test:", error);
      throw error;
    }
  };

  const handleAbandonTest = () => {
    abandonTest();
    setTestPhase("start");
  };

  const handleCloseResults = () => {
    setTestPhase("select");
    setSelectedApplication(null);
    setCompletedAttempt(null);
  };

  const handleTimeUpdate = (timeRemaining: number) => {
    if (currentAttempt) {
      setCurrentAttempt({ ...currentAttempt, timeRemaining });
    }
  };

  // Test Selection Phase
  if (testPhase === "select") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Tests
          </h2>

          {availableTests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tests Available
              </h3>
              <p className="text-gray-500">
                You don&apos;t have any pending written tests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTests.map((application) => {
                const test = getTestForJob(application.jobId);
                return (
                  <div
                    key={application.id}
                    className="border border-gray-200 rounded-lg p-6"
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
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{test.timeLimit} minutes</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span>{test.questions.length} questions</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-gray-400" />
                              <span>{test.passingScore}% to pass</span>
                            </div>
                          </div>
                        )}

                        {application.nextAction && (
                          <div className="mt-3 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                            {application.nextAction}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedApplication(application);
                          setTestPhase("start");
                        }}
                        className="ml-4"
                        disabled={!test}
                      >
                        Start Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Tests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Test History
          </h3>

          {applications.filter(
            (app) => app.stages.written_test.status === "completed"
          ).length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No completed tests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {applications
                .filter((app) => app.stages.written_test.status === "completed")
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
                        Completed on{" "}
                        {application.stages.written_test.completedAt}
                      </p>
                    </div>

                    {application.stages.written_test.score && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {application.stages.written_test.score}%
                        </div>
                        <div
                          className={`text-sm ${
                            application.stages.written_test.score >= 70
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {application.stages.written_test.score >= 70
                            ? "Passed"
                            : "Failed"}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Test Start Phase
  if (testPhase === "start" && selectedApplication) {
    const test = getTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Test Not Found
          </h3>
          <p className="text-gray-500">
            The test for this application could not be found.
          </p>
          <Button onClick={() => setTestPhase("select")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      );
    }

    return (
      <TestStartScreen
        test={test}
        onStart={handleStartTest}
        onCancel={() => setTestPhase("select")}
      />
    );
  }

  // Test Taking Phase
  if (testPhase === "taking" && currentAttempt && selectedApplication) {
    const test = getTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Test Not Found
          </h3>
          <p className="text-gray-500">The test data could not be loaded.</p>
          <Button onClick={() => setTestPhase("select")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      );
    }

    return (
      <WrittenTestInterface
        test={test}
        attempt={currentAttempt}
        onAnswerChange={saveAnswer}
        onSubmit={handleSubmitTest}
        onAbandon={handleAbandonTest}
        onTimeUpdate={handleTimeUpdate}
      />
    );
  }

  // Test Results Phase
  if (testPhase === "results" && completedAttempt && selectedApplication) {
    const test = getTestForJob(selectedApplication.jobId);
    if (!test) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Test Not Found
          </h3>
          <p className="text-gray-500">
            The test results could not be displayed.
          </p>
          <Button onClick={() => setTestPhase("select")} className="mt-4">
            Back to Tests
          </Button>
        </div>
      );
    }

    return (
      <TestResults
        test={test}
        attempt={completedAttempt}
        onClose={handleCloseResults}
      />
    );
  }

  // Loading state
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abhh-teal-600"></div>
    </div>
  );
}
