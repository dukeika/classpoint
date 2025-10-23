/**
 * Comprehensive TypeScript Type Definitions for AB Holistic Interview Portal
 *
 * This module provides:
 * - Strict type definitions for all data models
 * - API request/response interfaces
 * - Database entity types
 * - Authentication and authorization types
 * - Utility types for enhanced type safety
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// ========================================
// Base Types and Utilities
// ========================================

export type UUID = string;
export type ISODateTime = string;
export type EmailAddress = string;
export type PhoneNumber = string;
export type URL = string;

// Utility types for enhanced type safety
export type NonEmptyString = string & { readonly __brand: unique symbol };
export type PositiveNumber = number & { readonly __brand: unique symbol };
export type NonNullable<T> = T extends null | undefined ? never : T;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorDetails;
  message?: string;
  timestamp: ISODateTime;
  requestId?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination types
export interface PaginationRequest {
  limit?: number;
  offset?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse {
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationResponse;
}

// ========================================
// User and Authentication Types
// ========================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  APPLICANT = 'applicant'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export interface BaseUser {
  userId: UUID;
  email: EmailAddress;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  lastLoginAt?: ISODateTime;
  emailVerified: boolean;
  phone?: PhoneNumber;
  profilePictureUrl?: URL;
}

export interface Applicant extends BaseUser {
  role: UserRole.APPLICANT;
  resumeUrl?: URL;
  linkedInProfile?: URL;
  githubProfile?: URL;
  portfolioUrl?: URL;
  preferredJobTypes?: string[];
  availabilityDate?: ISODateTime;
  salaryExpectation?: {
    min: number;
    max: number;
    currency: string;
  };
  skills?: string[];
  experience?: {
    years: number;
    level: 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
  };
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
  department?: string;
  permissions: Permission[];
}

export enum Permission {
  // Job management
  CREATE_JOB = 'create_job',
  UPDATE_JOB = 'update_job',
  DELETE_JOB = 'delete_job',
  VIEW_ALL_JOBS = 'view_all_jobs',

  // Application management
  VIEW_ALL_APPLICATIONS = 'view_all_applications',
  UPDATE_APPLICATION_STAGE = 'update_application_stage',
  ASSIGN_INTERVIEWER = 'assign_interviewer',

  // Test management
  CREATE_TEST = 'create_test',
  UPDATE_TEST = 'update_test',
  DELETE_TEST = 'delete_test',
  VIEW_TEST_SUBMISSIONS = 'view_test_submissions',
  GRADE_TESTS = 'grade_tests',

  // User management
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  VIEW_ALL_USERS = 'view_all_users',

  // System administration
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM_SETTINGS = 'manage_system_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs'
}

// Authentication types
export interface LoginRequest {
  email: EmailAddress;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: EmailAddress;
  password: string;
  firstName: string;
  lastName: string;
  phone?: PhoneNumber;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthenticatedUser {
  user: BaseUser | Applicant | Admin;
  tokens: AuthTokens;
}

export interface JWTPayload {
  sub: UUID;
  email: EmailAddress;
  role: UserRole;
  permissions?: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// ========================================
// Job-Related Types
// ========================================

export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}\n\n// Legacy enum values for backward compatibility\nexport const JobStatusAliases = {\n  'DRAFT': JobStatus.DRAFT,\n  'PUBLISHED': JobStatus.PUBLISHED,\n  'CLOSED': JobStatus.CLOSED,\n  'ARCHIVED': JobStatus.ARCHIVED,\n  'active': JobStatus.PUBLISHED,\n  'Active': JobStatus.PUBLISHED,\n  'ACTIVE': JobStatus.PUBLISHED\n};"

export enum JobType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  FREELANCE = 'freelance'
}

// Legacy enum values for backward compatibility\nexport const JobTypeAliases = {\n  'FULL_TIME': JobType.FULL_TIME,\n  'PART_TIME': JobType.PART_TIME,\n  'CONTRACT': JobType.CONTRACT,\n  'INTERNSHIP': JobType.INTERNSHIP,\n  'FREELANCE': JobType.FREELANCE,\n  'Full-time': JobType.FULL_TIME,\n  'Part-time': JobType.PART_TIME,\n  'Contract': JobType.CONTRACT,\n  'Internship': JobType.INTERNSHIP,\n  'Freelance': JobType.FREELANCE\n};\n\nexport enum RemotePolicy {\n  REMOTE = 'remote',\n  HYBRID = 'hybrid',\n  ON_SITE = 'on_site'\n}\n\n// Legacy enum values for backward compatibility\nexport const RemotePolicyAliases = {\n  'REMOTE': RemotePolicy.REMOTE,\n  'HYBRID': RemotePolicy.HYBRID,\n  'ON_SITE': RemotePolicy.ON_SITE,\n  'Remote': RemotePolicy.REMOTE,\n  'Hybrid': RemotePolicy.HYBRID,\n  'On-site': RemotePolicy.ON_SITE\n};"

export interface Job {
  jobId: UUID;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  department: string;
  location: string;
  remotePolicy: RemotePolicy;
  jobType: JobType;
  status: JobStatus;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
  applicationDeadline?: ISODateTime;
  startDate?: ISODateTime;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  publishedAt?: ISODateTime;
  closedAt?: ISODateTime;
  applicationCount?: number;
  viewCount?: number;
  tags?: string[];
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  department: string;
  location: string;
  remotePolicy: RemotePolicy;
  jobType: JobType;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
  skills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
  applicationDeadline?: ISODateTime;
  startDate?: ISODateTime;
  tags?: string[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
}

export interface JobFilters {
  status?: JobStatus;
  jobType?: JobType;
  remotePolicy?: RemotePolicy;
  department?: string;
  location?: string;
  experienceLevel?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  createdAfter?: ISODateTime;
  createdBefore?: ISODateTime;
}

// ========================================
// Application-Related Types
// ========================================

export enum ApplicationStage {
  APPLIED = 'applied',
  SCREENING = 'screening',
  WRITTEN_TEST = 'written_test',
  VIDEO_TEST = 'video_test',
  FIRST_INTERVIEW = 'first_interview',
  SECOND_INTERVIEW = 'second_interview',
  FINAL_INTERVIEW = 'final_interview',
  REFERENCE_CHECK = 'reference_check',
  OFFER_EXTENDED = 'offer_extended',
  HIRED = 'hired',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}

export enum ApplicationStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed'
}

export interface Application {
  applicationId: UUID;
  jobId: UUID;
  applicantId: UUID;
  stage: ApplicationStage;
  status: ApplicationStatus;
  coverLetter: string;
  resumeUrl: URL;
  customAnswers?: Record<string, string>;
  appliedAt: ISODateTime;
  updatedAt: ISODateTime;
  stageHistory: StageHistoryEntry[];
  assignedRecruiterId?: UUID;
  assignedInterviewerIds?: UUID[];
  nextActionDate?: ISODateTime;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: ApplicationNote[];
  scores?: ApplicationScore[];
}

export interface StageHistoryEntry {
  stage: ApplicationStage;
  changedBy: UUID;
  changedAt: ISODateTime;
  comments?: string;
  automaticTransition: boolean;
}

export interface ApplicationNote {
  noteId: UUID;
  authorId: UUID;
  content: string;
  isPrivate: boolean;
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
}

export interface ApplicationScore {
  scoreId: UUID;
  evaluatorId: UUID;
  category: string;
  score: number;
  maxScore: number;
  comments?: string;
  createdAt: ISODateTime;
}

export interface CreateApplicationRequest {
  jobId: UUID;
  coverLetter: string;
  resumeUrl: URL;
  customAnswers?: Record<string, string>;
}

export interface UpdateApplicationStageRequest {
  stage: ApplicationStage;
  comments?: string;
  assignedRecruiterId?: UUID;
  assignedInterviewerIds?: UUID[];
  nextActionDate?: ISODateTime;
  rejectionReason?: string;
}

// ========================================
// Test-Related Types
// ========================================

export enum TestType {
  WRITTEN = 'written',
  VIDEO = 'video',
  CODING = 'coding',
  PRESENTATION = 'presentation'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  CODE = 'code',
  VIDEO_RESPONSE = 'video_response'
}

export interface TestQuestion {
  questionId: UUID;
  type: QuestionType;
  text: string;
  instructions?: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[]; // For auto-graded questions
  points: PositiveNumber;
  timeLimit?: number; // In seconds
  required: boolean;
  orderIndex: number;
  metadata?: {
    programmingLanguage?: string;
    starterCode?: string;
    testCases?: Array<{
      input: string;
      expectedOutput: string;
      isPublic: boolean;
    }>;
  };
}

export interface Test {
  testId: UUID;
  jobId: UUID;
  title: string;
  description: string;
  instructions: string;
  type: TestType;
  timeLimit: number; // In minutes
  passingScore?: number;
  questions: TestQuestion[];
  isActive: boolean;
  allowRetakes: boolean;
  maxAttempts: number;
  createdBy: UUID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  settings: TestSettings;
}

export interface TestSettings {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultsImmediately: boolean;
  allowReviewAnswers: boolean;
  preventCheating: boolean;
  requireWebcam: boolean;
  fullScreenMode: boolean;
  disableCopyPaste: boolean;
}

export interface CreateTestRequest {
  jobId: UUID;
  title: string;
  description: string;
  instructions: string;
  type: TestType;
  timeLimit: number;
  passingScore?: number;
  questions: Omit<TestQuestion, 'questionId'>[];
  settings: TestSettings;
  allowRetakes?: boolean;
  maxAttempts?: number;
}

// Test submission types
export interface TestSubmission {
  submissionId: UUID;
  testId: UUID;
  applicantId: UUID;
  applicationId: UUID;
  startedAt: ISODateTime;
  submittedAt?: ISODateTime;
  timeSpent: number; // In seconds
  answers: TestAnswer[];
  score?: number;
  maxScore: number;
  passed?: boolean;
  graded: boolean;
  gradedBy?: UUID;
  gradedAt?: ISODateTime;
  feedback?: string;
  attemptNumber: number;
  browserInfo?: string;
  ipAddress?: string;
  suspiciousActivity?: SuspiciousActivity[];
}

export interface TestAnswer {
  questionId: UUID;
  response: string | string[];
  timeSpent?: number;
  submittedAt: ISODateTime;
  score?: number;
  maxScore: number;
  feedback?: string;
  metadata?: {
    videoUrl?: URL;
    videoDuration?: number;
    codeExecutionResults?: CodeExecutionResult[];
  };
}

export interface CodeExecutionResult {
  testCaseIndex: number;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

export interface SuspiciousActivity {
  type: 'tab_switch' | 'copy_paste' | 'right_click' | 'dev_tools' | 'screen_share' | 'multiple_users';
  timestamp: ISODateTime;
  details?: Record<string, unknown>;
}

export interface SubmitTestRequest {
  answers: Omit<TestAnswer, 'score' | 'maxScore' | 'feedback'>[];
  timeSpent: number;
  browserInfo?: string;
}

// ========================================
// File Management Types
// ========================================

export enum FileType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  VIDEO_RESPONSE = 'video_response',
  CODE_SAMPLE = 'code_sample',
  PORTFOLIO = 'portfolio',
  OTHER = 'other'
}

export interface FileMetadata {
  fileId: UUID;
  originalName: string;
  fileName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  uploadedBy: UUID;
  uploadedAt: ISODateTime;
  url: URL;
  expiresAt?: ISODateTime;
  isPublic: boolean;
  associatedEntityId?: UUID;
  associatedEntityType?: 'application' | 'test_submission' | 'user_profile';
  virusScanStatus?: 'pending' | 'clean' | 'infected' | 'error';
  virusScanDetails?: string;
}

export interface FileUploadRequest {
  fileName: string;
  fileType: FileType;
  mimeType: string;
  size: number;
  associatedEntityId?: UUID;
  associatedEntityType?: 'application' | 'test_submission' | 'user_profile';
}

export interface FileUploadResponse {
  uploadUrl: URL;
  fileId: UUID;
  expiresIn: number;
}

// ========================================
// Notification Types
// ========================================

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationTemplate {
  WELCOME = 'welcome',
  APPLICATION_RECEIVED = 'application_received',
  APPLICATION_STATUS_UPDATE = 'application_status_update',
  TEST_INVITATION = 'test_invitation',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  OFFER_EXTENDED = 'offer_extended',
  REJECTION = 'rejection',
  REMINDER = 'reminder'
}

export interface Notification {
  notificationId: UUID;
  recipientId: UUID;
  recipientType: 'applicant' | 'admin';
  type: NotificationType;
  template: NotificationTemplate;
  subject: string;
  content: string;
  data?: Record<string, unknown>;
  sentAt?: ISODateTime;
  deliveredAt?: ISODateTime;
  readAt?: ISODateTime;
  failed: boolean;
  failureReason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: ISODateTime;
  expiresAt?: ISODateTime;
  createdAt: ISODateTime;
}

export interface SendNotificationRequest {
  recipientId: UUID;
  recipientType: 'applicant' | 'admin';
  type: NotificationType;
  template: NotificationTemplate;
  data?: Record<string, unknown>;
  scheduledFor?: ISODateTime;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

// ========================================
// Analytics and Reporting Types
// ========================================

export interface AnalyticsMetric {
  metricId: UUID;
  name: string;
  value: number;
  unit: string;
  dimensions: Record<string, string>;
  timestamp: ISODateTime;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface JobAnalytics {
  jobId: UUID;
  views: number;
  applications: number;
  conversionRate: number;
  averageTimeToHire: number;
  stageMetrics: Record<ApplicationStage, {
    count: number;
    averageTimeInStage: number;
    conversionToNext: number;
  }>;
  sourceMetrics: Record<string, number>;
  locationMetrics: Record<string, number>;
}

export interface ApplicantAnalytics {
  totalApplicants: number;
  newApplicants: number;
  activeApplications: number;
  completedApplications: number;
  averageApplicationTime: number;
  skillsDistribution: Record<string, number>;
  experienceDistribution: Record<string, number>;
  locationDistribution: Record<string, number>;
}

// ========================================
// Lambda Handler Types
// ========================================

export interface LambdaEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayProxyEvent['requestContext'] & {
    authorizer?: {
      userId: UUID;
      role: UserRole;
      permissions: Permission[];
    };
  };
}

export interface LambdaContext extends Context {
  // Additional context properties if needed
}

export type LambdaHandler<TRequest = unknown, TResponse = unknown> = (
  event: LambdaEvent,
  context: LambdaContext
) => Promise<APIGatewayProxyResult>;

// ========================================
// Database Entity Types
// ========================================

export interface DynamoDBEntity {
  PK: string; // Partition Key
  SK: string; // Sort Key
  GSI1PK?: string; // Global Secondary Index 1 Partition Key
  GSI1SK?: string; // Global Secondary Index 1 Sort Key
  GSI2PK?: string; // Global Secondary Index 2 Partition Key
  GSI2SK?: string; // Global Secondary Index 2 Sort Key
  EntityType: string;
  CreatedAt: ISODateTime;
  UpdatedAt: ISODateTime;
  TTL?: number; // For automatic expiration
}

// Entity-specific DynamoDB types
export interface JobEntity extends DynamoDBEntity, Omit<Job, 'jobId'> {
  PK: `JOB#${UUID}`;
  SK: `JOB#${UUID}`;
  GSI1PK: `JOB_STATUS#${JobStatus}`;
  GSI1SK: ISODateTime;
  EntityType: 'Job';
}

export interface ApplicationEntity extends DynamoDBEntity, Omit<Application, 'applicationId'> {
  PK: `APPLICATION#${UUID}`;
  SK: `APPLICATION#${UUID}`;
  GSI1PK: `JOB#${UUID}`;
  GSI1SK: `STAGE#${ApplicationStage}#${ISODateTime}`;
  GSI2PK: `APPLICANT#${UUID}`;
  GSI2SK: ISODateTime;
  EntityType: 'Application';
}

export interface UserEntity extends DynamoDBEntity, Omit<BaseUser, 'userId'> {
  PK: `USER#${UUID}`;
  SK: `USER#${UUID}`;
  GSI1PK: `EMAIL#${EmailAddress}`;
  GSI1SK: `USER#${UUID}`;
  EntityType: 'User';
}

// ========================================
// API Request/Response Types
// ========================================

export interface AuthenticatedRequest<T = unknown> extends Omit<LambdaEvent, 'body'> {
  user: BaseUser | Applicant | Admin;
  body: T;
}

export interface ListRequest extends PaginationRequest {
  filters?: Record<string, unknown>;
}

export interface ListResponse<T> extends PaginatedResponse<T> {
  filters?: Record<string, unknown>;
}

// ========================================
// Configuration Types
// ========================================

export interface DatabaseConfig {
  tableName: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface S3Config {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export interface AppConfig {
  stage: 'dev' | 'staging' | 'prod';
  region: string;
  database: DatabaseConfig;
  s3: S3Config;
  cognito: CognitoConfig;
  jwtSecret: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
}

// ========================================
// Utility Type Guards
// ========================================

export function isApplicant(user: BaseUser): user is Applicant {
  return user.role === UserRole.APPLICANT;
}

export function isAdmin(user: BaseUser): user is Admin {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(user: BaseUser): user is Admin {
  return user.role === UserRole.SUPER_ADMIN;
}

export function hasPermission(user: BaseUser, permission: Permission): boolean {
  if (!isAdmin(user)) return false;
  return user.permissions.includes(permission);
}

// ========================================
// Type Validation Helpers
// ========================================

export function isValidUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function isValidEmail(value: string): value is EmailAddress {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isValidISODateTime(value: string): value is ISODateTime {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
}

// ========================================
// Error Types
// ========================================

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

export interface BusinessRuleViolation {
  rule: string;
  message: string;
  context?: Record<string, unknown>;
}

// ========================================
// Event Types for Internal Communication
// ========================================

export interface DomainEvent {
  eventId: UUID;
  eventType: string;
  aggregateId: UUID;
  aggregateType: string;
  eventData: Record<string, unknown>;
  eventVersion: number;
  occurredAt: ISODateTime;
  userId?: UUID;
}

export interface ApplicationCreatedEvent extends DomainEvent {
  eventType: 'ApplicationCreated';
  aggregateType: 'Application';
  eventData: {
    applicationId: UUID;
    jobId: UUID;
    applicantId: UUID;
  };
}

export interface ApplicationStageChangedEvent extends DomainEvent {
  eventType: 'ApplicationStageChanged';
  aggregateType: 'Application';
  eventData: {
    applicationId: UUID;
    previousStage: ApplicationStage;
    newStage: ApplicationStage;
    changedBy: UUID;
  };
}

// Export all types for easy importing
// Note: Utility modules exported separately to avoid circular dependencies