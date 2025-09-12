// File: src/hooks/useCandidateDataReal.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { jobService } from "@/services/jobService";
import { applicationService } from "@/services/applicationService";
import { Job, Application, StageStatus } from "@/API";
import { CandidateApplication, ApplicationStage, TestStage, InterviewStage } from "@/components/candidate/types";

// Type transformations from GraphQL types to component types
interface TransformedJob {
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


interface CandidateStats {
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  interviewsScheduled: number;
  availableJobs: number;
}

// Transform GraphQL Job to component Job
const transformJob = (job: Job): TransformedJob => ({
  id: job.id,
  title: job.title,
  company: job.company?.name || "Unknown Company",
  department: job.department,
  location: job.location,
  type: job.type.toLowerCase().replace('_', '-') as "Full-time" | "Part-time" | "Contract" | "Internship",
  salary: job.salary || undefined,
  description: job.description,
  requirements: job.requirements || [],
  responsibilities: job.responsibilities || [],
  benefits: job.benefits || undefined,
  status: job.status.toLowerCase() as "active" | "closed",
  createdAt: job.createdAt,
  closingDate: job.closingDate || undefined,
  companyLogo: job.company?.logo || undefined,
});

// Transform GraphQL Application to component Application
const transformApplication = (app: Application): CandidateApplication => ({
  id: app.id,
  jobId: app.jobId,
  jobTitle: app.job?.title || "Unknown Job",
  company: app.job?.company?.name || "Unknown Company",
  appliedAt: app.appliedAt,
  currentStage: app.currentStage as 1 | 2 | 3 | 4,
  stageStatus: getStageStatus(app),
  overallStatus: mapOverallStatus(app.overallStatus),
  stages: {
    application: mapApplicationStage(app.applicationStatus, app.appliedAt),
    written_test: mapTestStage(app.writtenTestStatus),
    video_test: mapTestStage(app.videoTestStatus),
    interview: mapInterviewStage(app.interviewStatus)
  },
  nextAction: getNextAction(app),
  feedback: app.feedback || undefined,
});

// Helper functions to map GraphQL enums to component interfaces
const mapOverallStatus = (status: string): "active" | "rejected" | "hired" | "withdrawn" => {
  switch (status?.toUpperCase()) {
    case 'HIRED':
      return 'hired';
    case 'REJECTED':
      return 'rejected';
    case 'WITHDRAWN':
      return 'withdrawn';
    case 'ACTIVE':
    default:
      return 'active';
  }
};

const mapApplicationStage = (status: StageStatus, completedAt?: string): ApplicationStage => ({
  status: status === StageStatus.COMPLETED ? 'completed' : 'pending',
  completedAt
});

const mapTestStage = (status: StageStatus): TestStage => ({
  status: status === StageStatus.COMPLETED ? 'completed' : 
          status === StageStatus.IN_PROGRESS ? 'pending' : 'not_started'
});

const mapInterviewStage = (status: StageStatus): InterviewStage => ({
  status: status === StageStatus.COMPLETED ? 'completed' :
          status === StageStatus.SCHEDULED ? 'scheduled' :
          status === StageStatus.IN_PROGRESS ? 'pending' : 'not_started'
});

// Helper function to determine stage status
const getStageStatus = (app: Application): "pending" | "in_progress" | "completed" | "failed" => {
  const stage = app.currentStage;
  
  switch (stage) {
    case 1:
      return app.applicationStatus === StageStatus.COMPLETED ? 'completed' : 'pending';
    case 2:
      return app.writtenTestStatus === StageStatus.COMPLETED ? 'completed' : 
             app.writtenTestStatus === StageStatus.IN_PROGRESS ? 'in_progress' : 'pending';
    case 3:
      return app.videoTestStatus === StageStatus.COMPLETED ? 'completed' : 
             app.videoTestStatus === StageStatus.IN_PROGRESS ? 'in_progress' : 'pending';
    case 4:
      return app.interviewStatus === StageStatus.COMPLETED ? 'completed' : 
             app.interviewStatus === StageStatus.IN_PROGRESS ? 'in_progress' : 'pending';
    default:
      return 'pending';
  }
};

// Helper function to determine next action
const getNextAction = (app: Application): string => {
  switch (app.currentStage) {
    case 1:
      return "Wait for application review";
    case 2:
      return app.writtenTestStatus === StageStatus.PENDING 
        ? "Complete written assessment" 
        : "Wait for test results";
    case 3:
      return app.videoTestStatus === StageStatus.PENDING 
        ? "Record video responses" 
        : "Wait for video review";
    case 4:
      return app.interviewStatus === StageStatus.SCHEDULED 
        ? "Attend interview" 
        : "Wait for interview scheduling";
    default:
      return "Application in progress";
  }
};

export function useCandidateData() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<TransformedJob[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [stats, setStats] = useState<CandidateStats>({
    totalApplications: 0,
    activeApplications: 0,
    completedApplications: 0,
    interviewsScheduled: 0,
    availableJobs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load real data from GraphQL
        const [jobsData, applicationsData] = await Promise.all([
          jobService.getActiveJobs(),
          applicationService.getApplicationsByCandidate(user.userId || user.username),
        ]);

        // Transform the data
        const transformedJobs = jobsData.map(transformJob);
        const transformedApplications = applicationsData.map(transformApplication);

        setJobs(transformedJobs);
        setApplications(transformedApplications);

        // Calculate stats
        const activeApps = transformedApplications.filter(
          (app) => app.overallStatus === "active"
        ).length;

        const scheduledInterviews = transformedApplications.filter(
          (app) => app.stages.interview.status === "scheduled"
        ).length;

        setStats({
          totalApplications: transformedApplications.length,
          activeApplications: activeApps,
          completedApplications: transformedApplications.length - activeApps,
          interviewsScheduled: scheduledInterviews,
          availableJobs: transformedJobs.length,
        });

        console.log("✅ Candidate data loaded successfully", {
          jobs: transformedJobs.length,
          applications: transformedApplications.length,
        });
      } catch (error) {
        console.error("❌ Error loading candidate data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const applyToJob = async (jobId: string) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const newApplication = await applicationService.applyToJob(
        user.userId || user.username,
        jobId
      );

      // Transform and add to applications
      const transformedApp = transformApplication(newApplication);
      setApplications((prev) => [transformedApp, ...prev]);

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalApplications: prev.totalApplications + 1,
        activeApplications: prev.activeApplications + 1,
      }));

      console.log("✅ Applied to job successfully:", jobId);
      return newApplication;
    } catch (error) {
      console.error("❌ Error applying to job:", error);
      throw error;
    }
  };

  const hasApplied = (jobId: string) => {
    return applications.some((app) => app.jobId === jobId);
  };

  return {
    jobs,
    applications,
    stats,
    loading,
    error,
    applyToJob,
    hasApplied,
  };
}