/**
 * Job-related type definitions for frontend
 */

import { BaseEntity } from './common';

export type JobStatus = 'draft' | 'published' | 'closed' | 'archived';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
export type RemotePolicy = 'On-site' | 'Remote' | 'Hybrid';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface Job extends BaseEntity {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities?: string[];
  qualifications?: string[];
  department: string;
  location: string;
  remotePolicy: RemotePolicy;
  type: JobType; // matches backend 'type' field
  status: JobStatus;
  salaryRange?: SalaryRange;
  benefits?: string[];
  skills: string[];
  experienceLevel?: ExperienceLevel;
  applicationDeadline?: string;
  startDate?: string;
  createdBy?: string;
  publishedAt?: string;
  closedAt?: string;
  applicationCount?: number;
  viewCount?: number;
  tags?: string[];
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string[];
  responsibilities?: string[];
  qualifications?: string[];
  department: string;
  location: string;
  remotePolicy: RemotePolicy;
  type: JobType; // matches backend 'type' field
  salaryRange?: SalaryRange;
  benefits?: string[];
  skills: string[];
  experienceLevel?: ExperienceLevel;
  applicationDeadline?: string;
  startDate?: string;
  tags?: string[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
  status?: JobStatus;
}

export interface JobFilters {
  status?: JobStatus;
  type?: JobType; // matches backend 'type' field
  remotePolicy?: RemotePolicy;
  department?: string;
  location?: string;
  experienceLevel?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  search?: string;
  tags?: string[];
}

// Application stage types
export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'written_test'
  | 'video_test'
  | 'first_interview'
  | 'second_interview'
  | 'final_interview'
  | 'reference_check'
  | 'offer_extended'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type ApplicationStatus = 'active' | 'on_hold' | 'completed';

export interface Application extends BaseEntity {
  applicationId: string;
  jobId: string;
  applicantId: string;
  stage: ApplicationStage;
  status: ApplicationStatus;
  coverLetter: string;
  resumeUrl: string;
  customAnswers?: Record<string, string>;
  appliedAt: string;
  stageHistory: StageHistoryEntry[];
  assignedRecruiterId?: string;
  assignedInterviewerIds?: string[];
  nextActionDate?: string;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: ApplicationNote[];
  scores?: ApplicationScore[];

  // Populated data for UI
  job?: Job;
  applicant?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface StageHistoryEntry {
  stage: ApplicationStage;
  changedBy: string;
  changedAt: string;
  comments?: string;
  automaticTransition: boolean;
}

export interface ApplicationNote {
  noteId: string;
  authorId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationScore {
  scoreId: string;
  evaluatorId: string;
  category: string;
  score: number;
  maxScore: number;
  comments?: string;
  createdAt: string;
}

export interface CreateApplicationRequest {
  jobId: string;
  coverLetter: string;
  resumeUrl: string;
  customAnswers?: Record<string, string>;
}

export interface UpdateApplicationStageRequest {
  stage: ApplicationStage;
  comments?: string;
  assignedRecruiterId?: string;
  assignedInterviewerIds?: string[];
  nextActionDate?: string;
  rejectionReason?: string;
}

// Job statistics and analytics
export interface JobStats {
  totalViews: number;
  totalApplications: number;
  conversionRate: number;
  averageTimeToHire?: number;
  stageBreakdown: Record<ApplicationStage, number>;
  applicationTrend: Array<{
    date: string;
    count: number;
  }>;
}

// Form validation types
export interface JobFormErrors {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  qualifications?: string;
  department?: string;
  location?: string;
  remotePolicy?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string;
  salaryRange?: {
    min?: string;
    max?: string;
    currency?: string;
  };
}

// UI state types
export interface JobListState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  filters: JobFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface JobFormState {
  data: Partial<CreateJobRequest>;
  errors: JobFormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Constants for dropdowns and selects
export const JOB_TYPES: Array<{ value: JobType; label: string }> = [
  { value: 'Full-time', label: 'Full Time' },
  { value: 'Part-time', label: 'Part Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
];

export const REMOTE_POLICIES: Array<{ value: RemotePolicy; label: string }> = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'On-site', label: 'On-site' },
];

export const EXPERIENCE_LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
];

export const JOB_STATUSES: Array<{ value: JobStatus; label: string; color: string }> = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'published', label: 'Published', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'red' },
  { value: 'archived', label: 'Archived', color: 'gray' },
];

export const APPLICATION_STAGES: Array<{ value: ApplicationStage; label: string; color: string }> = [
  { value: 'applied', label: 'Applied', color: 'blue' },
  { value: 'screening', label: 'Screening', color: 'yellow' },
  { value: 'written_test', label: 'Written Test', color: 'orange' },
  { value: 'video_test', label: 'Video Test', color: 'purple' },
  { value: 'first_interview', label: 'First Interview', color: 'indigo' },
  { value: 'second_interview', label: 'Second Interview', color: 'indigo' },
  { value: 'final_interview', label: 'Final Interview', color: 'indigo' },
  { value: 'reference_check', label: 'Reference Check', color: 'pink' },
  { value: 'offer_extended', label: 'Offer Extended', color: 'green' },
  { value: 'hired', label: 'Hired', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'gray' },
];