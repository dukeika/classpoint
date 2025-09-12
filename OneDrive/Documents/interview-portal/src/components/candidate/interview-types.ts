// File: src/components/candidate/interview-types.ts

export interface Interviewer {
  id: string;
  name: string;
  title: string;
  email: string;
  avatarUrl?: string;
}

export interface PreparationMaterial {
  id: string;
  title: string;
  description?: string;
  type: "document" | "link" | "video";
  url: string;
  size?: string; // For documents
  duration?: number; // For videos, in minutes
}

export interface Interview {
  id: string;
  applicationId: string;
  jobTitle: string;
  company: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  scheduledAt: string; // ISO string
  duration: number; // minutes
  type: "video" | "phone" | "in-person";
  status: "scheduled" | "completed" | "cancelled" | "no-show" | "in-progress";
  location: string; // Meeting link, phone number, or address
  interviewers: Interviewer[];
  instructions?: string;
  preparationMaterials?: PreparationMaterial[];
  meetingLink?: string;
  meetingId?: string;
  meetingPassword?: string;
  feedback?: string; // Candidate feedback about the interview
  rating?: number; // 1-5 stars
  notes?: string; // Internal notes
  createdAt: string;
  updatedAt: string;
  rescheduleReason?: string;
  rescheduleRequestedAt?: string;
  rescheduleRequestedBy?: "candidate" | "company";
}

export interface InterviewSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  interviewerId?: string;
}

export interface InterviewFeedback {
  id: string;
  interviewId: string;
  candidateId: string;
  rating: number; // 1-5 stars
  feedback: string;
  wouldRecommend?: boolean;
  createdAt: string;
}

export interface InterviewStats {
  totalScheduled: number;
  completed: number;
  cancelled: number;
  averageRating: number;
  averageDuration: number;
  noShowRate: number;
}

// Company admin specific interfaces
export interface AvailableInterviewer {
  id: string;
  name: string;
  title: string;
  email: string;
  isAvailable: boolean;
  expertise: string[];
  timezone: string;
}

export interface InterviewTemplate {
  id: string;
  name: string;
  duration: number;
  type: "video" | "phone" | "in-person";
  instructions: string;
  preparationMaterials: PreparationMaterial[];
  questions?: string[];
}

export interface InterviewCalendar {
  date: string;
  slots: InterviewSlot[];
}

// Analytics interfaces
export interface InterviewAnalytics {
  totalInterviews: number;
  completionRate: number;
  averageRating: number;
  averageDuration: number;
  topInterviewers: {
    id: string;
    name: string;
    count: number;
    averageRating: number;
  }[];
  interviewsByType: {
    video: number;
    phone: number;
    inPerson: number;
  };
  monthlyTrends: {
    month: string;
    interviews: number;
    completionRate: number;
  }[];
}
