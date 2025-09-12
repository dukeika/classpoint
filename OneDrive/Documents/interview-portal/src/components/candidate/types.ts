// File: src/components/candidate/types.ts
// Complete candidate types file with all interfaces

export interface Job {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  salary?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits?: string[];
  status: "active" | "closed";
  createdAt: string;
  closingDate?: string;
  companyLogo?: string;
}

// Base stage interface
export interface StageBase {
  status: string;
  completedAt?: string;
  score?: number;
  scheduledAt?: string;
}

// Specific stage interfaces
export interface ApplicationStage extends StageBase {
  status: "completed" | "pending";
}

export interface TestStage extends StageBase {
  status: "completed" | "pending" | "not_started";
  score?: number;
}

export interface InterviewStage extends StageBase {
  status: "completed" | "pending" | "not_started" | "scheduled";
  scheduledAt?: string;
}

// Written Test Interfaces
export interface Question {
  id: string;
  question: string;
  type: "multiple_choice" | "text" | "coding";
  options?: string[]; // For multiple choice
  correctAnswer?: string | number; // For scoring
  points: number;
  timeLimit?: number; // Seconds for this question
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

// Keep both TestQuestion and Question for compatibility
export interface TestQuestion extends Question {}

export interface Test {
  id: string;
  jobId: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number; // Total time in minutes
  totalPoints: number;
  passingScore: number; // Percentage needed to pass
  questions: Question[];
  createdAt: string;
  isActive: boolean;
}

export interface TestAttempt {
  id: string;
  testId: string;
  candidateId: string;
  applicationId: string;
  startedAt: string;
  completedAt?: string;
  timeRemaining: number;
  status: "in_progress" | "completed" | "abandoned" | "expired";
  answers: Record<string, any>; // questionId -> answer
  score?: number;
  percentage?: number;
  passed?: boolean;
}

// Video Test Interfaces - FIXED to match components
export interface VideoQuestion {
  id: string;
  question: string;
  description?: string;
  prepTime: number; // seconds for preparation
  recordTime: number; // seconds for recording (max 120 = 2 minutes)
  category: string;
  points: number;
  tips?: string[];
}

export interface VideoTest {
  id: string;
  jobId: string;
  title: string;
  description: string;
  instructions: string;
  questions: VideoQuestion[];
  totalPoints: number;
  createdAt: string;
  isActive: boolean;
}

// FIXED VideoRecording interface to match useWebRTC hook
export interface VideoRecording {
  questionId: string;
  blob: Blob;
  duration: number; // actual duration recorded in seconds
  timestamp: string; // ISO string when recorded
}

export interface VideoTestAttempt {
  id: string;
  testId: string;
  candidateId: string;
  applicationId: string;
  startedAt: string;
  completedAt?: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned";
  currentQuestionIndex: number;
  recordings: Record<string, VideoRecording>; // questionId -> recording
  totalScore?: number;
}

// Application Interface
export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedAt: string;
  currentStage: 1 | 2 | 3 | 4;
  stageStatus: "pending" | "in_progress" | "completed" | "failed";
  overallStatus: "active" | "rejected" | "hired" | "withdrawn";
  stages: {
    application: ApplicationStage;
    written_test: TestStage;
    video_test: TestStage;
    interview: InterviewStage;
  };
  nextAction?: string;
  feedback?: string;
}

// Stats Interface
export interface CandidateStats {
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  interviewsScheduled: number;
  availableJobs: number;
}

// Tab Type - UPDATED to include interview
export type CandidateTabType =
  | "browse"
  | "applications"
  | "profile"
  | "notifications"
  | "test"
  | "video"
  | "interview";

// WebRTC State interface for useWebRTC hook
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
