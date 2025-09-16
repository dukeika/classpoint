export interface Application {
  applicationId: string;
  jobId: string;
  applicantId: string;
  applicantEmail: string;
  applicantName: string;
  appliedAt: string;
  lastActivityAt: string;
  currentStage: ApplicationStage;
  status: ApplicationStatus;
  personalInfo?: PersonalInfo;
  resume?: FileUpload;
  coverLetter?: string;
  portfolio?: string;
  writtenTestId?: string;
  writtenTestScore?: number;
  writtenTestCompletedAt?: string;
  writtenTestAttempts?: number;
  videoTestId?: string;
  videoTestScore?: number;
  videoTestCompletedAt?: string;
  videoTestAttempts?: number;
  interviewScheduledAt?: string;
  interviewCompletedAt?: string;
  interviewScore?: number;
  interviewNotes?: string;
  finalDecision?: 'accepted' | 'rejected';
  finalDecisionAt?: string;
  finalDecisionBy?: string;
  finalDecisionNotes?: string;
  score?: number;
  notes?: string;
  adminNotes?: AdminNote[];
  stageHistory?: StageHistory[];
  notifications?: NotificationLog[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
  linkedIn?: string;
  github?: string;
  website?: string;
  eligibilityToWork: boolean;
  requiresSponsorship: boolean;
  availableStartDate?: string;
  expectedSalary?: string;
  noticePeriod?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FileUpload {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  url: string;
}

export interface AdminNote {
  noteId: string;
  adminId: string;
  adminName: string;
  content: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface StageHistory {
  stage: ApplicationStage;
  enteredAt: string;
  exitedAt?: string;
  actionBy?: string;
  notes?: string;
}

export interface NotificationLog {
  notificationId: string;
  type: NotificationType;
  subject: string;
  content: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'written-test'
  | 'video-test'
  | 'final-interview'
  | 'decision'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationStatus =
  | 'active'
  | 'rejected'
  | 'withdrawn'
  | 'accepted'
  | 'expired';

export type NotificationType =
  | 'application-received'
  | 'stage-advance'
  | 'test-invitation'
  | 'interview-scheduled'
  | 'decision-made'
  | 'reminder'
  | 'deadline-approaching';

export interface ApplicationFilters {
  stage?: ApplicationStage;
  status?: ApplicationStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  scoreRange?: {
    min: number;
    max: number;
  };
  search?: string;
  tags?: string[];
}

export interface ApplicationStats {
  total: number;
  byStage: Record<ApplicationStage, number>;
  byStatus: Record<ApplicationStatus, number>;
  averageScore: number;
  averageTimeToComplete: number;
  conversionRates: Record<ApplicationStage, number>;
}

export interface BulkAction {
  action: 'advance' | 'reject' | 'schedule-interview' | 'send-notification';
  applicationIds: string[];
  data?: any;
  reason?: string;
}

export interface ApplicationFormData {
  personalInfo: PersonalInfo;
  resume: File;
  coverLetter: string;
  portfolio?: string;
  additionalInfo?: string;
  agreedToTerms: boolean;
}