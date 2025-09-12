//src/hooks/useWebRTC.ts
import { useState, useRef, useCallback, useEffect } from "react";

export interface WebRTCState {
  isRecording: boolean;
  isPreparing: boolean;
  mediaStream: MediaStream | null;
  recordedBlob: Blob | null;
  error: string | null;
  prepTimeRemaining: number;
  recordTimeRemaining: number;
  cameraReady: boolean;
}

export function useWebRTC() {
  const [state, setState] = useState<WebRTCState>({
    isRecording: false,
    isPreparing: false,
    mediaStream: null,
    recordedBlob: null,
    error: null,
    prepTimeRemaining: 0,
    recordTimeRemaining: 0,
    cameraReady: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);

  const initializeCamera = useCallback(async () => {
    try {
      console.log("🎥 Initializing camera...");
      setState((prev) => ({ ...prev, error: null, cameraReady: false }));

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Your browser does not support camera access. Please use Chrome, Firefox, Safari, or Edge."
        );
      }

      if (!window.MediaRecorder) {
        throw new Error(
          "Your browser does not support video recording. Please update your browser."
        );
      }

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

      console.log("✅ Camera stream obtained successfully");

      setState((prev) => ({
        ...prev,
        mediaStream: stream,
        cameraReady: true,
        error: null,
      }));

      return stream;
    } catch (error: any) {
      console.error("❌ Camera initialization error:", error);
      let errorMessage = "Failed to access camera";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access and try again.";
      } else if (error.name === "NotFoundError") {
        errorMessage =
          "No camera found. Please connect a camera and try again.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera does not meet the required specifications.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        cameraReady: false,
        mediaStream: null,
      }));
      throw error;
    }
  }, []);

  const startPreparation = useCallback(
    (prepTime: number, onPrepComplete: () => void) => {
      console.log("⏰ Starting preparation:", prepTime, "seconds");

      // Clear any existing prep timer
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
        prepTimerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isPreparing: true,
        prepTimeRemaining: prepTime,
        error: null,
      }));

      let timeLeft = prepTime;
      prepTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setState((prev) => ({ ...prev, prepTimeRemaining: timeLeft }));

        if (timeLeft <= 0) {
          if (prepTimerRef.current) {
            clearInterval(prepTimerRef.current);
            prepTimerRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            isPreparing: false,
            prepTimeRemaining: 0,
          }));
          console.log("⏰ Preparation complete, starting recording");
          onPrepComplete();
        }
      }, 1000);
    },
    []
  );

  const startRecording = useCallback(
    async (maxDuration: number) => {
      if (!state.mediaStream || !state.cameraReady || isCleaningUpRef.current) {
        throw new Error(
          "Camera not initialized. Please initialize camera first."
        );
      }

      try {
        console.log("🔴 Starting recording for", maxDuration, "seconds");

        // Clear any existing recording state
        chunksRef.current = [];
        setState((prev) => ({ ...prev, recordedBlob: null, error: null }));

        // Check MediaRecorder support with fallback mimeTypes
        let mimeType = "video/webm;codecs=vp9,opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm;codecs=vp8,opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "video/webm";
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = "video/mp4";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "";
              }
            }
          }
        }

        console.log("🎬 Using mimeType:", mimeType || "default");

        const mediaRecorder = new MediaRecorder(
          state.mediaStream,
          mimeType ? { mimeType } : undefined
        );

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            console.log("📦 Chunk received:", event.data.size, "bytes");
          }
        };

        mediaRecorder.onstop = () => {
          console.log(
            "⏹️ Recording stopped, creating blob from",
            chunksRef.current.length,
            "chunks"
          );

          if (chunksRef.current.length > 0) {
            const finalMimeType = mimeType || "video/webm";
            const blob = new Blob(chunksRef.current, { type: finalMimeType });
            console.log(
              "💾 Created blob:",
              blob.size,
              "bytes, type:",
              blob.type
            );

            setState((prev) => ({
              ...prev,
              recordedBlob: blob,
              isRecording: false,
              recordTimeRemaining: 0,
            }));
          } else {
            console.error("❌ No recording data available");
            setState((prev) => ({
              ...prev,
              error: "Recording failed - no data captured",
              isRecording: false,
              recordTimeRemaining: 0,
            }));
          }
        };

        mediaRecorder.onerror = (event: any) => {
          console.error("❌ MediaRecorder error:", event.error);
          setState((prev) => ({
            ...prev,
            error: `Recording failed: ${
              event.error?.message || "Unknown error"
            }`,
            isRecording: false,
            recordTimeRemaining: 0,
          }));
        };

        mediaRecorderRef.current = mediaRecorder;

        // Start recording with data available every second
        mediaRecorder.start(1000);

        setState((prev) => ({
          ...prev,
          isRecording: true,
          recordTimeRemaining: maxDuration,
          recordedBlob: null,
          error: null,
        }));

        // Start countdown timer
        let timeLeft = maxDuration;
        recordTimerRef.current = setInterval(() => {
          timeLeft -= 1;
          setState((prev) => ({ ...prev, recordTimeRemaining: timeLeft }));

          if (timeLeft <= 0) {
            console.log("⏰ Recording time expired, auto-stopping...");
            if (recordTimerRef.current) {
              clearInterval(recordTimerRef.current);
              recordTimerRef.current = null;
            }
            // Auto-stop recording when time expires
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "recording"
            ) {
              mediaRecorderRef.current.stop();
            }
          }
        }, 1000);
      } catch (error: any) {
        console.error("❌ Recording start error:", error);
        const errorMessage = error.message || "Failed to start recording";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isRecording: false,
        }));
        throw error;
      }
    },
    [state.mediaStream, state.cameraReady]
  );

  const stopRecording = useCallback(() => {
    console.log("⏹️ Manual stop recording requested...");

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (mediaRecorderRef.current && state.isRecording) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          console.log("⏹️ MediaRecorder stopped manually");
        } else {
          console.log(
            "⚠️ MediaRecorder not in recording state:",
            mediaRecorderRef.current.state
          );
        }
      } catch (error) {
        console.error("❌ Error stopping recording:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to stop recording properly",
          isRecording: false,
        }));
      }
    }
  }, [state.isRecording]);

  const resetRecording = useCallback(() => {
    console.log("🔄 Resetting recording state...");

    // Clear timers
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    // Stop any active recording
    if (mediaRecorderRef.current && state.isRecording) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("❌ Error stopping recording during reset:", error);
      }
    }

    // Clear recording data
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    setState((prev) => ({
      ...prev,
      recordedBlob: null,
      isRecording: false,
      isPreparing: false,
      recordTimeRemaining: 0,
      prepTimeRemaining: 0,
      error: null,
    }));
  }, [state.isRecording]);

  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up WebRTC resources...");
    isCleaningUpRef.current = true;

    // Clear all timers
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    // Stop recording if active
    if (mediaRecorderRef.current && state.isRecording) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("❌ Error stopping recording during cleanup:", error);
      }
    }

    // Stop media stream
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
    }

    // Reset all state
    setState({
      isRecording: false,
      isPreparing: false,
      mediaStream: null,
      recordedBlob: null,
      error: null,
      prepTimeRemaining: 0,
      recordTimeRemaining: 0,
      cameraReady: false,
    });

    // Clear refs
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    isCleaningUpRef.current = false;
  }, [state.mediaStream, state.isRecording]);

  // Cleanup effect for component unmount only
  useEffect(() => {
    return () => {
      console.log("🎬 WebRTC hook unmounting, cleaning up...");

      // Clear timers
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }

      // Stop recording if active
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error("❌ Error stopping recording on unmount:", error);
        }
      }

      // Only stop media tracks on actual unmount, not on state changes
      // This prevents the video feed from disappearing during normal operation
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    ...state,
    initializeCamera,
    startPreparation,
    startRecording,
    stopRecording,
    resetRecording,
    cleanup,
  };
}
