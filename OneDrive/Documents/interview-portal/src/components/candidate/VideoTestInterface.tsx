//src/components/candidate/VideoTestInterface.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { VideoTest, VideoTestAttempt, VideoRecording } from "./types";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Mic,
  Square,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  Video,
} from "lucide-react";

interface VideoTestInterfaceProps {
  test: VideoTest;
  attempt: VideoTestAttempt;
  onRecordingSaved: (questionId: string, recording: VideoRecording) => void;
  onNext: () => void;
  onSubmit: () => Promise<VideoTestAttempt>;
  onAbandon: () => void;
}

type RecordingPhase =
  | "initializing"
  | "ready"
  | "prep"
  | "recording"
  | "completed"
  | "error";

export default function VideoTestInterface({
  test,
  attempt,
  onRecordingSaved,
  onNext,
  onSubmit,
  onAbandon,
}: VideoTestInterfaceProps) {
  const [phase, setPhase] = useState<RecordingPhase>("initializing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepTimeRemaining, setPrepTimeRemaining] = useState(0);
  const [recordTimeRemaining, setRecordTimeRemaining] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = test.questions[attempt.currentQuestionIndex];
  const isLastQuestion =
    attempt.currentQuestionIndex === test.questions.length - 1;
  const hasRecordingForCurrentQuestion =
    !!attempt.recordings[currentQuestion.id];

  // Initialize camera once on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log("Initializing camera...");
        setError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        setMediaStream(stream);
        setPhase("ready");
        console.log("Camera initialized successfully");
      } catch (error: any) {
        console.error("Camera initialization failed:", error);
        setError(error.message || "Failed to access camera");
        setPhase("error");
      }
    };

    initCamera();

    // Cleanup function
    return () => {
      console.log("Cleaning up camera...");
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []); // Empty dependency array - only run once

  // Connect video stream to video element
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Stop recording manually
  const stopRecording = useCallback(() => {
    console.log("Stopping recording");

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!mediaStream) {
      setError("No camera stream available");
      return;
    }

    try {
      console.log("Starting recording");
      chunksRef.current = [];
      setRecordedBlob(null);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating blob");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        setPhase("completed");
        setIsRecording(false);

        // Save recording
        const recording: VideoRecording = {
          questionId: currentQuestion.id,
          blob: blob,
          duration: currentQuestion.recordTime - recordTimeRemaining,
          timestamp: new Date().toISOString(),
        };

        onRecordingSaved(currentQuestion.id, recording);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setPhase("recording");
      setIsRecording(true);
      setRecordTimeRemaining(currentQuestion.recordTime);

      // Start countdown
      let timeLeft = currentQuestion.recordTime;
      recordTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setRecordTimeRemaining(timeLeft);

        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 1000);
    } catch (error: any) {
      console.error("Recording failed:", error);
      setError(error.message || "Recording failed");
      setPhase("error");
    }
  }, [
    mediaStream,
    currentQuestion,
    recordTimeRemaining,
    onRecordingSaved,
    stopRecording,
  ]);

  // Start preparation phase manually (no auto-start)
  const startPreparation = useCallback(() => {
    if (phase !== "ready") return;

    console.log("Starting preparation phase");
    setPhase("prep");
    setPrepTimeRemaining(currentQuestion.prepTime);

    let timeLeft = currentQuestion.prepTime;
    prepTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      setPrepTimeRemaining(timeLeft);

      if (timeLeft <= 0) {
        if (prepTimerRef.current) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
        }
        // Auto-start recording after prep
        startRecording();
      }
    }, 1000);
  }, [phase, currentQuestion.prepTime, startRecording]);

  // Handle next question
  const handleNext = useCallback(() => {
    if (!hasRecordingForCurrentQuestion && !recordedBlob) return;

    // Reset for next question
    setRecordedBlob(null);
    setPhase("ready");
    onNext();
  }, [hasRecordingForCurrentQuestion, recordedBlob, onNext]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!hasRecordingForCurrentQuestion && !recordedBlob) return;

    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error("Failed to submit test:", error);
      setIsSubmitting(false);
    }
  }, [hasRecordingForCurrentQuestion, recordedBlob, onSubmit]);

  // Handle abandon
  const handleAbandon = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    onAbandon();
  }, [mediaStream, onAbandon]);

  const canProceed =
    hasRecordingForCurrentQuestion || (recordedBlob && phase === "completed");

  // Error state
  if (phase === "error" || error) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Camera Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "There was a problem with your camera or microphone."}
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={handleAbandon}>
              Exit Test
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Abandon confirmation
  if (showAbandonConfirm) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Exit Video Test?
          </h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to exit? Your progress will be lost and you'll
            need to restart the entire video test.
          </p>
          <div className="flex-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowAbandonConfirm(false)}
            >
              Continue Test
            </Button>
            <Button
              onClick={handleAbandon}
              className="bg-red-600 hover:bg-red-700"
            >
              Exit Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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

          <div className="flex items-center space-x-4">
            <div className="text-right">
              {phase === "prep" && (
                <div className="flex items-center text-blue-600">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">
                    Prep: {prepTimeRemaining}s
                  </span>
                </div>
              )}
              {phase === "recording" && (
                <div className="flex items-center text-red-600">
                  <Video className="w-5 h-5 mr-2" />
                  <span className="font-mono text-lg">
                    Recording: {recordTimeRemaining}s
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowAbandonConfirm(true)}
              className="text-red-600 border-red-600 hover:bg-red-50"
              disabled={isSubmitting}
            >
              Exit Test
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>
              {Object.keys(attempt.recordings).length + (recordedBlob ? 1 : 0)}/
              {test.questions.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-abhh-teal-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((Object.keys(attempt.recordings).length +
                    (recordedBlob ? 1 : 0)) /
                    test.questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Video Interface */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Feed */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
              {phase === "initializing" ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recording indicator overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  RECORDING
                </div>
              )}
            </div>

            {/* Device Status */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`flex items-center justify-center p-3 rounded-lg ${
                  mediaStream
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Camera className="w-5 h-5 mr-2" />
                <span>Camera {mediaStream ? "Ready" : "Initializing"}</span>
              </div>
              <div
                className={`flex items-center justify-center p-3 rounded-lg ${
                  mediaStream
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Mic className="w-5 h-5 mr-2" />
                <span>Microphone {mediaStream ? "Ready" : "Initializing"}</span>
              </div>
            </div>
          </div>

          {/* Question and Controls */}
          <div className="space-y-6">
            {/* Question Display - Only shown during prep or recording */}
            {(phase === "prep" ||
              phase === "recording" ||
              phase === "completed") && (
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-abhh-teal-100 text-abhh-teal-800 text-sm font-medium rounded-full">
                    {currentQuestion.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentQuestion.points} points
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {currentQuestion.question}
                </h3>

                {currentQuestion.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {currentQuestion.description}
                  </p>
                )}

                {/* Tips */}
                {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Tips:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {currentQuestion.tips.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Phase-specific content */}
            {phase === "initializing" && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abhh-teal-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Setting up your camera and microphone...
                </p>
              </div>
            )}

            {phase === "ready" && (
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Play className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Ready to Start
                </h3>
                <p className="text-blue-700 mb-4">
                  Click the button below to begin the preparation phase for this
                  question.
                </p>
                <Button
                  onClick={startPreparation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Start Question {attempt.currentQuestionIndex + 1}
                </Button>
              </div>
            )}

            {phase === "prep" && (
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Preparation Time
                </h3>
                <p className="text-blue-700 mb-4">
                  Read the question and prepare your answer. Recording will
                  start automatically.
                </p>
                <div className="text-3xl font-mono font-bold text-blue-600">
                  {prepTimeRemaining}s
                </div>
              </div>
            )}

            {phase === "recording" && (
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-4 h-4 bg-red-600 rounded-full mr-3 animate-pulse" />
                  <span className="text-lg font-semibold text-red-900">
                    Recording
                  </span>
                </div>
                <p className="text-red-700 mb-4">
                  Speak clearly and maintain eye contact with the camera.
                </p>
                <div className="text-2xl font-mono font-bold text-red-600 mb-4">
                  {recordTimeRemaining}s remaining
                </div>
                <Button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            )}

            {phase === "completed" && (
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Recording Complete
                </h3>
                <p className="text-green-700">
                  Your response has been recorded successfully.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {test.questions.map((_, index) => {
              const isCompleted =
                !!attempt.recordings[test.questions[index].id];
              const isCurrent = index === attempt.currentQuestionIndex;
              const isCurrentCompleted = isCurrent && recordedBlob;

              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center ${
                    isCompleted || isCurrentCompleted
                      ? "bg-green-600 text-white"
                      : isCurrent
                      ? "bg-abhh-teal-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>

          <div className="flex space-x-4">
            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
