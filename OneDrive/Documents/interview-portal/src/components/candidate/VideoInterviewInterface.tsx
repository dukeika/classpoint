// File: src/components/candidate/VideoInterviewInterface.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { VideoTest, VideoTestAttempt, VideoRecording } from "./types";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Square,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface VideoInterviewInterfaceProps {
  test: VideoTest;
  attempt: VideoTestAttempt;
  onRecordingSaved: (questionId: string, recording: VideoRecording) => void;
  onNext: () => void;
  onSubmit: () => Promise<VideoTestAttempt>;
  onAbandon: () => void;
}

export default function VideoInterviewInterface({
  test,
  attempt,
  onRecordingSaved,
  onNext,
  onSubmit,
  onAbandon,
}: VideoInterviewInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"prep" | "recording" | "completed">(
    "prep"
  );
  const [prepTimeRemaining, setPrepTimeRemaining] = useState(0);
  const [recordTimeRemaining, setRecordTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordingCompleted, setRecordingCompleted] = useState(false);

  const {
    isRecording,
    mediaStream,
    recordedBlob,
    error,
    cameraReady,
    initializeCamera,
    startRecording,
    stopRecording,
    resetRecording,
  } = useWebRTC();

  const currentQuestion = test.questions[attempt.currentQuestionIndex];
  const isLastQuestion =
    attempt.currentQuestionIndex === test.questions.length - 1;

  // Initialize camera when component mounts
  useEffect(() => {
    const setup = async () => {
      try {
        await initializeCamera();
        startPrepTimer();
      } catch (error) {
        console.error("Failed to initialize camera:", error);
      }
    };
    setup();
  }, [initializeCamera]);

  // Set up video stream
  useEffect(() => {
    if (mediaStream && videoRef.current && cameraReady) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((e) => console.log("Video play error:", e));
    }
  }, [mediaStream, cameraReady]);

  // Handle recording completion
  useEffect(() => {
    if (recordedBlob && phase === "recording") {
      const recording: VideoRecording = {
        questionId: currentQuestion.id,
        blob: recordedBlob,
        duration: currentQuestion.recordTime - recordTimeRemaining,
        timestamp: new Date().toISOString(),
      };

      onRecordingSaved(currentQuestion.id, recording);
      setPhase("completed");
      setRecordingCompleted(true);
      resetRecording();
    }
  }, [
    recordedBlob,
    phase,
    currentQuestion,
    recordTimeRemaining,
    onRecordingSaved,
    resetRecording,
  ]);

  const startPrepTimer = useCallback(() => {
    setPhase("prep");
    setRecordingCompleted(false);
    setPrepTimeRemaining(currentQuestion.prepTime);

    const timer = setInterval(() => {
      setPrepTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("recording");
          startRecording(currentQuestion.recordTime);
          setRecordTimeRemaining(currentQuestion.recordTime);

          const recordTimer = setInterval(() => {
            setRecordTimeRemaining((recordPrev) => {
              if (recordPrev <= 1) {
                clearInterval(recordTimer);
                stopRecording();
                return 0;
              }
              return recordPrev - 1;
            });
          }, 1000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentQuestion, startRecording, stopRecording]);

  const handleStopRecording = () => {
    if (phase === "recording") {
      stopRecording();
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      onNext();
      // Reset for next question
      setPhase("prep");
      setRecordingCompleted(false);
      startPrepTimer();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Failed to submit:", error);
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "prep":
        return "text-yellow-600";
      case "recording":
        return "text-red-600";
      case "completed":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case "prep":
        return "Preparation Time - Read the question";
      case "recording":
        return "Recording - Answer the question";
      case "completed":
        return "Recording completed";
      default:
        return "";
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Camera Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={onAbandon} variant="outline">
            Exit Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600">
              Question {attempt.currentQuestionIndex + 1} of{" "}
              {test.questions.length}
            </p>
          </div>

          <div className="flex items-center space-x-6">
            <div className={`flex items-center space-x-2 ${getPhaseColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-semibold">
                {phase === "prep"
                  ? formatTime(prepTimeRemaining)
                  : phase === "recording"
                  ? formatTime(recordTimeRemaining)
                  : "0:00"}
              </span>
            </div>

            <Button
              variant="outline"
              onClick={onAbandon}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={isSubmitting}
            >
              Exit Interview
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {attempt.currentQuestionIndex + 1}/{test.questions.length}{" "}
              questions
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-abhh-teal-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((attempt.currentQuestionIndex +
                    (phase === "completed" ? 1 : 0)) /
                    test.questions.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Phase Status */}
        <div className="mt-4">
          <div
            className={`text-center p-3 rounded-lg ${
              phase === "prep"
                ? "bg-yellow-50 border border-yellow-200"
                : phase === "recording"
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <p className={`font-medium ${getPhaseColor()}`}>
              {getPhaseMessage()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-abhh-teal-100 text-abhh-teal-800 text-sm font-medium rounded-full">
                {currentQuestion.category}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} points
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>

            {currentQuestion.description && (
              <p className="text-gray-600 mb-4">
                {currentQuestion.description}
              </p>
            )}
          </div>

          {/* Phase Instructions */}
          {phase === "prep" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">
                Preparation Time
              </h3>
              <p className="text-sm text-yellow-800">
                Use this time to read and understand the question. Recording
                will start automatically in {prepTimeRemaining} seconds.
              </p>
            </div>
          )}

          {phase === "recording" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">
                Recording Active
              </h3>
              <p className="text-sm text-red-800">
                Speak clearly and look at the camera. You have{" "}
                {formatTime(recordTimeRemaining)} remaining.
              </p>
              <Button
                onClick={handleStopRecording}
                size="sm"
                className="mt-3 bg-orange-600 hover:bg-orange-700"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            </div>
          )}

          {phase === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">
                Recording Completed
              </h3>
              <p className="text-sm text-green-800">
                Your response has been saved successfully.
              </p>
            </div>
          )}
        </div>

        {/* Video Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="aspect-video bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Recording Indicator */}
            {phase === "recording" && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">REC</span>
              </div>
            )}

            {/* Prep Overlay */}
            {phase === "prep" && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Clock className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-3xl font-bold">{prepTimeRemaining}</p>
                  <p className="text-lg">Get ready...</p>
                </div>
              </div>
            )}
          </div>

          {/* Next Button */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              disabled={!recordingCompleted || isSubmitting}
              className={`w-full ${
                isLastQuestion
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-abhh-teal-600 hover:bg-abhh-teal-700"
              }`}
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Interview"}
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="mt-6 flex justify-center">
        <div className="flex space-x-2">
          {test.questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < attempt.currentQuestionIndex
                  ? "bg-green-500"
                  : index === attempt.currentQuestionIndex &&
                    phase === "completed"
                  ? "bg-green-500"
                  : index === attempt.currentQuestionIndex
                  ? "bg-abhh-teal-600"
                  : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
