import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import Button from '../shared/Button';
import {
  PlayIcon,
  StopIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface VideoRecorderProps {
  questionId: string;
  timeLimit?: number; // in seconds
  onRecordingComplete: (videoBlob: Blob, duration: number) => void;
  className?: string;
  disabled?: boolean;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  questionId,
  timeLimit = 120, // 2 minutes default
  onRecordingComplete,
  className,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devicePermission, setDevicePermission] = useState<'granted' | 'denied' | 'pending'>('pending');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      setStream(mediaStream);
      setDevicePermission('granted');
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setDevicePermission('denied');
      setError('Unable to access camera and microphone. Please check your permissions and try again.');
    }
  };

  // Initialize permissions on mount
  useEffect(() => {
    requestPermissions();

    return () => {
      // Cleanup media stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = () => {
    if (!stream || disabled) return;

    try {
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const duration = Date.now() - recordingStartTimeRef.current;
        onRecordingComplete(blob, Math.floor(duration / 1000));
        setHasRecording(true);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Capture data every 100ms

      setIsRecording(true);
      setRecordingTime(0);
      recordingStartTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;

          // Auto-stop at time limit
          if (newTime >= timeLimit) {
            stopRecording();
            return timeLimit;
          }

          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Reset recording
  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }

    setHasRecording(false);
    setRecordingTime(0);
    recordedChunksRef.current = [];

    // Restart video stream
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  };

  if (devicePermission === 'denied') {
    return (
      <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="text-center">
          <VideoCameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-4">
            Please allow camera and microphone access to record your video response.
          </p>
          <Button onClick={requestPermissions} variant="primary">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry Permissions
          </Button>
        </div>
      </div>
    );
  }

  if (devicePermission === 'pending') {
    return (
      <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Requesting camera access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 overflow-hidden', className)}>
      {/* Video Display */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-64 object-cover"
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">REC</span>
          </div>
        )}

        {/* Timer Display */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
          <span className="text-sm font-mono">
            {formatTime(recordingTime)} / {formatTime(timeLimit)}
          </span>
        </div>

        {/* Recording Status Overlay */}
        {hasRecording && !isRecording && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <PlayIcon className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Recording Complete</p>
              <p className="text-xs text-gray-300">Duration: {formatTime(recordingTime)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <VideoCameraIcon className="w-4 h-4" />
            <MicrophoneIcon className="w-4 h-4" />
            <span>Camera and microphone ready</span>
          </div>

          <div className="flex items-center space-x-3">
            {hasRecording && !isRecording && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetRecording}
                disabled={disabled}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                Retake
              </Button>
            )}

            {!isRecording ? (
              <Button
                variant="primary"
                onClick={startRecording}
                disabled={disabled}
                className="flex items-center"
              >
                <PlayIcon className="w-4 h-4 mr-2" />
                {hasRecording ? 'Record Again' : 'Start Recording'}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={stopRecording}
                className="flex items-center"
              >
                <StopIcon className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
        </div>

        {/* Recording Guidelines */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Recording Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Ensure good lighting and a quiet environment</li>
            <li>• Look directly at the camera while speaking</li>
            <li>• Speak clearly and at a moderate pace</li>
            <li>• You have {formatTime(timeLimit)} to complete your response</li>
            <li>• You can re-record if needed before submitting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;