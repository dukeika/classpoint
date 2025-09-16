// Core entity types for AB Holistic Interview Portal

export interface Job {
  jobId: string;
  title: string;
  description: string;
  requirements: string[];
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  deadline?: string;
  writtenTestId?: string;
  videoTestId?: string;
  updatedAt?: string;
}

export type JobStatus = 'draft' | 'published' | 'closed';

export interface Applicant {
  applicantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  lastLoginAt?: string;
  cognitoUserId: string;
  profileCompletedAt?: string;
}

export interface Application {
  applicationId: string;
  jobId: string;
  applicantId: string;
  stage: ApplicationStage;
  resumeUrl: string;
  coverLetter: string;
  appliedAt: string;
  stageUpdatedAt: string;
  adminComments?: string;
  writtenTestSubmission?: TestSubmission;
  videoTestSubmission?: TestSubmission;
  finalInterviewUrl?: string;
  finalInterviewScheduledAt?: string;
  rejectionReason?: string;
}

export type ApplicationStage =
  | 'applied'
  | 'written_test'
  | 'video_test'
  | 'final_interview'
  | 'hired'
  | 'rejected';

export interface Test {
  testId: string;
  jobId: string;
  type: TestType;
  title: string;
  instructions: string;
  timeLimit: number; // minutes
  questions: Question[];
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export type TestType = 'written' | 'video';

export interface Question {
  questionId: string;
  type: QuestionType;
  text: string;
  options?: string[]; // for MCQ
  correctAnswer?: string | string[]; // for auto-grading
  points?: number;
  timeLimit?: number; // for video questions in seconds
  required: boolean;
  orderIndex: number;
}

export type QuestionType = 'mcq' | 'short_answer' | 'essay' | 'video_prompt';

export interface TestSubmission {
  submissionId: string;
  testId: string;
  applicationId: string;
  applicantId: string;
  answers: Answer[];
  submittedAt: string;
  timeSpent: number; // total seconds
  score?: number;
  maxScore?: number;
  adminReview?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  isCompleted: boolean;
}

export interface Answer {
  questionId: string;
  response: string | string[]; // text or file URLs
  timeSpent?: number; // seconds
  submittedAt: string;
  metadata?: AnswerMetadata;
}

export interface AnswerMetadata {
  videoUrl?: string;
  videoDuration?: number;
  audioQuality?: number;
  videoQuality?: number;
  deviceInfo?: string;
  browserInfo?: string;
}

// Authentication and User Management
export interface AdminUser {
  adminId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  cognitoUserId: string;
  createdAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
  permissions: Permission[];
}

export type AdminRole = 'super_admin' | 'admin' | 'hr_manager' | 'interviewer';

export type Permission =
  | 'manage_jobs'
  | 'manage_tests'
  | 'review_applications'
  | 'manage_users'
  | 'view_analytics'
  | 'send_notifications';

// Notification System
export interface NotificationTemplate {
  templateId: string;
  name: string;
  type: NotificationType;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export type NotificationType =
  | 'email'
  | 'sms'
  | 'push';

export interface Notification {
  notificationId: string;
  recipientId: string;
  recipientType: 'applicant' | 'admin';
  type: NotificationType;
  subject: string;
  body: string;
  sentAt: string;
  status: NotificationStatus;
  metadata?: Record<string, unknown>;
}

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  totalCount?: number;
  hasMore: boolean;
}

// Form Types
export interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  deadline?: string;
}

export interface ApplicationFormData {
  coverLetter: string;
  resumeFile: File;
}

export interface TestAnswerFormData {
  questionId: string;
  response: string | string[];
}

// File Upload Types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export interface SignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  context: 'resume' | 'video' | 'other';
}

export interface SignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fields?: Record<string, string>;
}

// Video Recording Types
export interface VideoRecordingConfig {
  maxDuration: number; // seconds
  maxFileSize: number; // bytes
  videoConstraints: MediaTrackConstraints;
  audioConstraints: MediaTrackConstraints;
}

export interface VideoRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  recordedTime: number;
  recordedBlob?: Blob;
  error?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingReviews: number;
  completedInterviews: number;
  hiredCandidates: number;
}

export interface ApplicationSummary {
  applicationId: string;
  applicantName: string;
  jobTitle: string;
  stage: ApplicationStage;
  appliedAt: string;
  lastUpdated: string;
  urgentAction?: boolean;
}

// Configuration Types
export interface AppConfig {
  aws: {
    region: string;
    userPoolId: string;
    userPoolWebClientId: string;
    identityPoolId: string;
    apiEndpoint: string;
    s3Bucket: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: FeatureFlags;
  };
  limits: {
    maxResumeSize: number;
    maxVideoSize: number;
    maxVideoDuration: number;
    sessionTimeout: number;
  };
}

export interface FeatureFlags {
  videoTests: boolean;
  notifications: boolean;
  analytics: boolean;
  multipleAdmins: boolean;
  advancedReporting: boolean;
}

// Utility Types
export type Timestamp = string; // ISO 8601 format
export type UUID = string;
export type Base64String = string;
export type EmailAddress = string;
export type PhoneNumber = string;
export type Url = string;

// Error Types
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}