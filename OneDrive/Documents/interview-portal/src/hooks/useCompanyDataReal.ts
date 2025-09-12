// File: src/hooks/useCompanyDataReal.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { jobService } from "@/services/jobService";
import { applicationService } from "@/services/applicationService";
import { companyService } from "@/services/companyService";
import { useErrorHandler } from "@/lib/errorHandler";
import { Job, Application, Company, JobStatus, ApplicationStatus } from "@/API";

// Transform types for component compatibility
interface CompanyStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  newApplicationsToday: number;
  interviewsScheduled: number;
  applicationsInProgress: number;
}

interface CompanyJob {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: "active" | "paused" | "closed";
  applicationsCount: number;
  createdAt: string;
  closingDate?: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: string;
}

interface CompanyApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  appliedAt: string;
  currentStage: number;
  stage: "applied" | "written_test" | "video_test" | "interview" | "completed";
  status: "pending" | "approved" | "rejected";
  totalStages: number;
}

export function useCompanyData() {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplicationsToday: 0,
    interviewsScheduled: 0,
    applicationsInProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get company ID from user record in the database
  const getCompanyId = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      console.log('🔍 Debug user object:', {
        user: user,
        userId: user.userId,
        username: user.username,
        attributes: user.attributes
      });
      
      // First try from user attributes (if available)
      if (user.attributes?.companyId) {
        console.log('✅ Found company ID from user attributes:', user.attributes.companyId);
        return user.attributes.companyId;
      }
      
      // If not in attributes, fetch from user service by sub (Cognito user ID)
      const { userService } = await import('@/services/userService');
      const userSubId = user.userId || user.username;
      console.log('🔍 Looking up user by sub:', userSubId);
      
      const userRecord = await userService.getUserBySub(userSubId);
      console.log('🔍 User record from database:', userRecord);
      console.log('🔍 User record companyId specifically:', userRecord?.companyId);
      console.log('🔍 User record role specifically:', userRecord?.role);
      
      if (userRecord && userRecord.companyId) {
        console.log('✅ Found company ID from user record:', userRecord.companyId);
        return userRecord.companyId;
      }
      
      // If user exists but has wrong role or no companyId, try to fix them
      if (userRecord) {
        const isWrongRole = userRecord.role === 'CANDIDATE' || userRecord.role !== 'COMPANY_ADMIN';
        const missingCompanyId = !userRecord.companyId;
        
        if (isWrongRole || missingCompanyId) {
          console.log('🔧 User needs fixing:', { 
            wrongRole: isWrongRole, 
            missingCompanyId, 
            currentRole: userRecord.role,
            currentCompanyId: userRecord.companyId
          });
          
          try {
            const { companyService } = await import('@/services/companyService');
            const companies = await companyService.getAllCompanies();
            
            if (companies.length > 0) {
              const firstCompany = companies[0];
              console.log(`🔧 Fixing user: assigning to company ${firstCompany.name} (${firstCompany.id}) and setting role to COMPANY_ADMIN`);
              
              await userService.fixAdminUser(userRecord.id, firstCompany.id);
              console.log('✅ User role and companyId fixed successfully');
              return firstCompany.id;
            }
          } catch (fixError) {
            console.error('❌ Failed to auto-fix user:', fixError);
          }
        }
      }
      
      console.warn('⚠️ No company ID found for user:', userSubId);
      console.warn('⚠️ User record exists but no companyId:', !!userRecord);
      return null;
    } catch (error) {
      console.error('❌ Error getting company ID:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      const companyId = await getCompanyId();
      
      if (!user || !companyId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load company, jobs, and applications in parallel
        const [companyData, jobsData, applicationsData] = await Promise.all([
          companyService.getCompanyById(companyId),
          jobService.getJobsByCompany(companyId),
          applicationService.getApplicationsByCompany(companyId),
        ]);

        if (!companyData) {
          throw new Error("Company not found");
        }

        setCompany(companyData);

        // Transform jobs data
        const transformedJobs: CompanyJob[] = jobsData.map((job) => ({
          id: job.id,
          title: job.title,
          department: job.department,
          location: job.location,
          type: job.type,
          salary: job.salary || undefined,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          status: mapJobStatusToLowercase(job.status),
          applicationsCount: 0, // Will be updated below
          createdAt: job.createdAt,
          closingDate: job.closingDate || undefined,
        }));

        // Transform applications data
        const transformedApplications: CompanyApplication[] = applicationsData.map((app) => ({
          id: app.id,
          candidateName: `${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.trim() || 'Unknown',
          candidateEmail: app.candidate?.email || 'Unknown',
          jobTitle: app.job?.title || 'Unknown Job',
          appliedAt: app.appliedAt,
          currentStage: app.currentStage,
          stage: mapStageToEnum(app.currentStage),
          status: mapApplicationStatusToEnum(app.overallStatus),
          totalStages: 4,
        }));

        // Update job application counts
        const jobApplicationCounts = transformedApplications.reduce((acc, app) => {
          const jobId = jobsData.find(job => job.title === app.jobTitle)?.id;
          if (jobId) {
            acc[jobId] = (acc[jobId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        transformedJobs.forEach((job) => {
          job.applicationsCount = jobApplicationCounts[job.id] || 0;
        });

        setJobs(transformedJobs);
        setApplications(transformedApplications);

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const newToday = transformedApplications.filter(
          (app) => app.appliedAt.startsWith(today)
        ).length;

        const inProgress = transformedApplications.filter(
          (app) => app.status === 'pending'
        ).length;

        const scheduled = transformedApplications.filter(
          (app) => app.currentStage === 4 && app.stage === 'interview'
        ).length;

        setStats({
          totalJobs: transformedJobs.length,
          activeJobs: transformedJobs.filter((job) => job.status === 'active').length,
          totalApplications: transformedApplications.length,
          newApplicationsToday: newToday,
          interviewsScheduled: scheduled,
          applicationsInProgress: inProgress,
        });

        console.log("✅ Company data loaded successfully", {
          company: companyData.name,
          jobs: transformedJobs.length,
          applications: transformedApplications.length,
        });

      } catch (error) {
        const appError = handleError(error);
        setError(appError.message);
        console.error("❌ Error loading company data:", appError);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [user]);

  // Helper functions
  const mapJobStatusToLowercase = (status: JobStatus): "active" | "paused" | "closed" => {
    switch (status) {
      case JobStatus.ACTIVE:
        return "active";
      case JobStatus.PAUSED:
        return "paused";
      case JobStatus.CLOSED:
        return "closed";
      default:
        return "active";
    }
  };

  const mapStageToEnum = (currentStage: number): "applied" | "written_test" | "video_test" | "interview" | "completed" => {
    switch (currentStage) {
      case 1:
        return "applied";
      case 2:
        return "written_test";
      case 3:
        return "video_test";
      case 4:
        return "interview";
      default:
        return "completed";
    }
  };

  const mapApplicationStatusToEnum = (overallStatus: ApplicationStatus): "pending" | "approved" | "rejected" => {
    switch (overallStatus) {
      case ApplicationStatus.HIRED:
        return "approved";
      case ApplicationStatus.REJECTED:
        return "rejected";
      case ApplicationStatus.ACTIVE:
      default:
        return "pending";
    }
  };

  // Actions
  const createJob = async (jobData: any) => {
    const companyId = await getCompanyId();
    if (!companyId) throw new Error("Company ID not found");

    try {
      const jobInput = {
        ...jobData,
        companyId,
      };
      
      console.log('🔍 Job input data being sent:', jobInput);
      console.log('🔍 Company ID:', companyId);
      
      const newJob = await jobService.createJob(jobInput);

      // Transform and add to jobs list
      const transformedJob: CompanyJob = {
        id: newJob.id,
        title: newJob.title,
        department: newJob.department,
        location: newJob.location,
        type: newJob.type,
        salary: newJob.salary || undefined,
        description: newJob.description,
        requirements: newJob.requirements,
        responsibilities: newJob.responsibilities,
        status: mapJobStatusToLowercase(newJob.status),
        applicationsCount: 0,
        createdAt: newJob.createdAt,
        closingDate: newJob.closingDate || undefined,
      };

      setJobs((prev) => [transformedJob, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalJobs: prev.totalJobs + 1,
        activeJobs: newJob.status === JobStatus.ACTIVE ? prev.activeJobs + 1 : prev.activeJobs,
      }));

      return newJob;
    } catch (error) {
      const appError = handleError(error);
      throw new Error(appError.message);
    }
  };

  const updateJob = async (jobId: string, jobData: any) => {
    try {
      const updatedJob = await jobService.updateJob({
        id: jobId,
        ...jobData,
      });

      // Update jobs list
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                title: updatedJob.title,
                department: updatedJob.department,
                location: updatedJob.location,
                type: updatedJob.type,
                salary: updatedJob.salary || undefined,
                description: updatedJob.description,
                requirements: updatedJob.requirements,
                responsibilities: updatedJob.responsibilities,
                status: mapJobStatusToLowercase(updatedJob.status),
              }
            : job
        )
      );

      return updatedJob;
    } catch (error) {
      const appError = handleError(error);
      throw new Error(appError.message);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await jobService.deleteJob(jobId);

      // Remove from jobs list
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setStats((prev) => ({ ...prev, totalJobs: prev.totalJobs - 1 }));
    } catch (error) {
      const appError = handleError(error);
      throw new Error(appError.message);
    }
  };

  const updateApplicationStage = async (applicationId: string, newStage: number) => {
    try {
      await applicationService.progressToNextStage(applicationId, newStage - 1);

      // Update applications list
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { 
                ...app, 
                currentStage: newStage, 
                stage: mapStageToEnum(newStage),
                status: 'pending' as const
              }
            : app
        )
      );
    } catch (error) {
      const appError = handleError(error);
      throw new Error(appError.message);
    }
  };

  return {
    company,
    jobs,
    applications,
    stats,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    updateApplicationStage,
  };
}