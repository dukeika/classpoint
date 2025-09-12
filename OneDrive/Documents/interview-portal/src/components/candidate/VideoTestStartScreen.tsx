//src/components/candidate/VideoTestStartScreen.tsx
import { VideoTest } from "./types";
import { Button } from "@/components/ui/button";
import {
  Video,
  Camera,
  Mic,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VideoTestStartScreenProps {
  test: VideoTest;
  onStart: () => void;
  onCancel: () => void;
}

export default function VideoTestStartScreen({
  test,
  onStart,
  onCancel,
}: VideoTestStartScreenProps) {
  const [deviceTestPhase, setDeviceTestPhase] = useState<
    "setup" | "testing" | "complete"
  >("setup");
  const [deviceStatus, setDeviceStatus] = useState({
    camera: false,
    microphone: false,
  });
  const [testStream, setTestStream] = useState<MediaStream | null>(null);
  const testVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (testStream) {
        testStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [testStream]);

  const startDeviceTest = async () => {
    setDeviceTestPhase("testing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      setTestStream(stream);

      if (testVideoRef.current) {
        testVideoRef.current.srcObject = stream;
        await testVideoRef.current.play();
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;

      setDeviceStatus({
        camera: hasVideo,
        microphone: hasAudio,
      });

      if (hasVideo && hasAudio) {
        setDeviceTestPhase("complete");
      }
    } catch (error) {
      console.error("Device test failed:", error);
      setDeviceStatus({ camera: false, microphone: false });
    }
  };

  const handleStartInterview = () => {
    if (testStream) {
      testStream.getTracks().forEach((track) => track.stop());
      setTestStream(null);
    }
    onStart();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-abhh-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-abhh-teal-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {test.title}
          </h1>
          <p className="text-lg text-gray-600">Video Interview Setup</p>
        </div>

        {/* Test Overview - NO QUESTIONS SHOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {test.questions.length}
            </div>
            <div className="text-sm text-blue-700">Questions</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">15s</div>
            <div className="text-sm text-green-700">Prep Time</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">2min</div>
            <div className="text-sm text-purple-700">Max per Question</div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-2">
                Interview Security & Rules
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Questions will only be revealed during the interview</li>
                <li>
                  • 15 seconds to read each question before recording starts
                </li>
                <li>• Maximum 2 minutes recording per question</li>
                <li>• No retakes or going back to previous questions</li>
                <li>• Complete all questions in one continuous session</li>
                <li>• Ensure you're in a quiet, well-lit environment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Before You Begin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Technical Requirements
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Working camera and microphone</li>
                <li>• Stable internet connection</li>
                <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>• Allow camera and microphone permissions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Environment Setup
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Quiet location with minimal background noise</li>
                <li>• Good lighting on your face</li>
                <li>• Stable seating position</li>
                <li>• Remove distractions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Device Test Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Camera & Microphone Test
          </h3>

          {deviceTestPhase === "setup" && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Test your devices before starting the interview. This ensures
                everything works properly during your recording.
              </p>
              <Button
                onClick={startDeviceTest}
                className="bg-abhh-teal-600 hover:bg-abhh-teal-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Test Camera & Microphone
              </Button>
            </div>
          )}

          {deviceTestPhase === "testing" && (
            <div className="text-center">
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 max-w-md mx-auto">
                <video
                  ref={testVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <p className="text-gray-600">
                Testing your camera and microphone...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You should see yourself and hear audio feedback
              </p>
            </div>
          )}

          {deviceTestPhase === "complete" && (
            <div>
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 max-w-md mx-auto">
                <video
                  ref={testVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                  className={`flex items-center space-x-2 p-3 rounded-lg ${
                    deviceStatus.camera
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {deviceStatus.camera ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">
                    Camera {deviceStatus.camera ? "Ready" : "Failed"}
                  </span>
                </div>

                <div
                  className={`flex items-center space-x-2 p-3 rounded-lg ${
                    deviceStatus.microphone
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {deviceStatus.microphone ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">
                    Microphone {deviceStatus.microphone ? "Ready" : "Failed"}
                  </span>
                </div>
              </div>

              {deviceStatus.camera && deviceStatus.microphone ? (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">
                      All devices are working correctly!
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      You're ready to start your video interview.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">
                      Device issues detected
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                      Please fix the issues above before continuing.
                    </p>
                  </div>
                  <Button
                    onClick={startDeviceTest}
                    variant="outline"
                    className="mr-2"
                  >
                    Test Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Final Checklist */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-blue-900 mb-3">Ready to Start?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Camera and microphone tested
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Quiet environment prepared
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Good lighting on face</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Distractions removed</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Stable internet connection
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Ready to complete in one session
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={onCancel} className="px-8">
            Cancel
          </Button>
          <Button
            onClick={handleStartInterview}
            disabled={!(deviceStatus.camera && deviceStatus.microphone)}
            className="px-8 bg-abhh-teal-600 hover:bg-abhh-teal-700"
          >
            Start Video Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
