// Application Constants for AB Holistic Interview Portal

// Application Stages
export const APPLICATION_STAGES = {
  APPLIED: 'applied',
  WRITTEN_TEST: 'written_test',
  VIDEO_TEST: 'video_test',
  FINAL_INTERVIEW: 'final_interview',
  HIRED: 'hired',
  REJECTED: 'rejected',
} as const;

export const STAGE_DISPLAY_NAMES = {
  [APPLICATION_STAGES.APPLIED]: 'Application Submitted',
  [APPLICATION_STAGES.WRITTEN_TEST]: 'Written Assessment',
  [APPLICATION_STAGES.VIDEO_TEST]: 'Video Assessment',
  [APPLICATION_STAGES.FINAL_INTERVIEW]: 'Final Interview',
  [APPLICATION_STAGES.HIRED]: 'Hired',
  [APPLICATION_STAGES.REJECTED]: 'Not Selected',
} as const;

export const STAGE_DESCRIPTIONS = {
  [APPLICATION_STAGES.APPLIED]: 'Your application has been received and is under review.',
  [APPLICATION_STAGES.WRITTEN_TEST]: 'Complete the written assessment to proceed.',
  [APPLICATION_STAGES.VIDEO_TEST]: 'Record your video responses to continue.',
  [APPLICATION_STAGES.FINAL_INTERVIEW]: 'Attend your scheduled interview session.',
  [APPLICATION_STAGES.HIRED]: 'Congratulations! You have been selected.',
  [APPLICATION_STAGES.REJECTED]: 'Thank you for your interest. We will keep your profile for future opportunities.',
} as const;

// Job Status
export const JOB_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
} as const;

// Test Types
export const TEST_TYPES = {
  WRITTEN: 'written',
  VIDEO: 'video',
} as const;

// Question Types
export const QUESTION_TYPES = {
  MCQ: 'mcq',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
  VIDEO_PROMPT: 'video_prompt',
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  INTERVIEWER: 'interviewer',
  APPLICANT: 'applicant',
} as const;

// Permissions
export const PERMISSIONS = {
  MANAGE_JOBS: 'manage_jobs',
  MANAGE_TESTS: 'manage_tests',
  REVIEW_APPLICATIONS: 'review_applications',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics',
  SEND_NOTIFICATIONS: 'send_notifications',
} as const;

// File Constraints
export const FILE_CONSTRAINTS = {
  RESUME: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'],
  },
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_DURATION: 300, // 5 minutes in seconds
    ALLOWED_TYPES: ['video/webm', 'video/mp4', 'video/quicktime'],
    ALLOWED_EXTENSIONS: ['.webm', '.mp4', '.mov'],
  },
} as const;

// Video Recording Settings
export const VIDEO_RECORDING = {
  DEFAULT_CONSTRAINTS: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
    },
  },
  PREP_TIME: 30, // seconds
  MAX_DURATION: 300, // 5 minutes
  WARNING_TIME: 30, // warn when 30 seconds left
} as const;

// Time Limits (in minutes)
export const TIME_LIMITS = {
  WRITTEN_TEST: {
    DEFAULT: 60,
    MINIMUM: 15,
    MAXIMUM: 180,
  },
  VIDEO_QUESTION: {
    DEFAULT: 3,
    MINIMUM: 1,
    MAXIMUM: 10,
  },
  SESSION_TIMEOUT: 30, // minutes of inactivity
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
} as const;

// Notification Events
export const NOTIFICATION_EVENTS = {
  WELCOME: 'welcome',
  APPLICATION_RECEIVED: 'application_received',
  STAGE_UPDATED: 'stage_updated',
  TEST_INVITATION: 'test_invitation',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  APPLICATION_REJECTED: 'application_rejected',
  DEADLINE_REMINDER: 'deadline_reminder',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  JOBS: {
    LIST: '/jobs',
    CREATE: '/jobs',
    GET: '/jobs/:id',
    UPDATE: '/jobs/:id',
    DELETE: '/jobs/:id',
    PUBLISH: '/jobs/:id/publish',
  },
  APPLICATIONS: {
    LIST: '/applications',
    CREATE: '/applications',
    GET: '/applications/:id',
    UPDATE: '/applications/:id',
    UPDATE_STAGE: '/applications/:id/stage',
  },
  TESTS: {
    LIST: '/tests',
    CREATE: '/tests',
    GET: '/tests/:id',
    UPDATE: '/tests/:id',
    DELETE: '/tests/:id',
    SUBMIT: '/tests/:id/submit',
  },
  FILES: {
    UPLOAD_URL: '/files/upload-url',
    DOWNLOAD_URL: '/files/download-url',
  },
  NOTIFICATIONS: {
    SEND: '/notifications/send',
    TEMPLATES: '/notifications/templates',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
  },
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s'-]{2,50}$/,
  JOB_TITLE: /^[a-zA-Z0-9\s\-\/,&()]{3,100}$/,
} as const;

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  TEST_ALREADY_SUBMITTED: 'TEST_ALREADY_SUBMITTED',
  TEST_EXPIRED: 'TEST_EXPIRED',
  STAGE_TRANSITION_ERROR: 'STAGE_TRANSITION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  APPLICATION_SUBMITTED: 'Your application has been submitted successfully!',
  TEST_SUBMITTED: 'Your test has been submitted successfully!',
  PROFILE_UPDATED: 'Your profile has been updated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  STAGE_UPDATED: 'Application stage updated successfully!',
  JOB_CREATED: 'Job posting created successfully!',
  TEST_CREATED: 'Test created successfully!',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported file format.',
  TEST_EXPIRED: 'This test has expired. Please contact support for assistance.',
  ALREADY_SUBMITTED: 'You have already submitted this test.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ab_holistic_auth_token',
  REFRESH_TOKEN: 'ab_holistic_refresh_token',
  USER_PROFILE: 'ab_holistic_user_profile',
  DRAFT_APPLICATION: 'ab_holistic_draft_application',
  TEST_PROGRESS: 'ab_holistic_test_progress',
  PREFERENCES: 'ab_holistic_preferences',
} as const;

// Theme Colors (matching logo)
export const THEME_COLORS = {
  PRIMARY: '#2D5A4A',
  SECONDARY: '#F5E942',
  ACCENT: '#000000',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
  BACKGROUND: '#FFFFFF',
  SURFACE: '#F8FAFC',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
  BORDER: '#E5E7EB',
} as const;

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  VIDEO_TESTS: true,
  NOTIFICATIONS: true,
  ANALYTICS: true,
  MULTIPLE_ADMINS: true,
  ADVANCED_REPORTING: false,
  DARK_MODE: false,
  MOBILE_APP: false,
} as const;

// Environment Variables
export const ENV_VARS = {
  AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
  USER_POOL_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID || '',
  IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
  API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
  S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || '',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
} as const;

export default {
  APPLICATION_STAGES,
  STAGE_DISPLAY_NAMES,
  STAGE_DESCRIPTIONS,
  JOB_STATUS,
  TEST_TYPES,
  QUESTION_TYPES,
  USER_ROLES,
  PERMISSIONS,
  FILE_CONSTRAINTS,
  VIDEO_RECORDING,
  TIME_LIMITS,
  NOTIFICATION_TYPES,
  NOTIFICATION_EVENTS,
  API_ENDPOINTS,
  VALIDATION_PATTERNS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  STORAGE_KEYS,
  THEME_COLORS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  FEATURE_FLAGS,
  ENV_VARS,
};