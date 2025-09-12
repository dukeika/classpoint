// File: src/services/applicationService.ts
import { generateClient } from 'aws-amplify/api';
import { listApplications, getApplication } from '@/graphql/queries';
import { createApplication, updateApplication } from '@/graphql/mutations';
import { Application, CreateApplicationInput, UpdateApplicationInput, ApplicationStatus, StageStatus } from '@/API';
import { NotificationService } from './notificationService';


// Simplified createApplication mutation that doesn't fetch the candidate and job relations
const createApplicationSimplified = /* GraphQL */ `mutation CreateApplication(
  $input: CreateApplicationInput!
  $condition: ModelApplicationConditionInput
) {
  createApplication(input: $input, condition: $condition) {
    id
    candidateId
    jobId
    appliedAt
    currentStage
    overallStatus
    applicationStatus
    writtenTestStatus
    videoTestStatus
    interviewStatus
    feedback
    internalNotes
    createdAt
    updatedAt
    __typename
  }
}`;

const client = generateClient({
  authMode: 'apiKey'
});

export const applicationService = {
  // Get all applications (for super admin)
  async getAllApplications(): Promise<Application[]> {
    try {
      const result = await client.graphql({ 
        query: listApplications
      });
      const applications = (result.data as any).listApplications.items as Application[];
      
      console.log(`📋 Found ${applications.length} applications, enriching with candidate and job details...`);
      
      // Manually enrich each application with candidate and job details
      const enrichedApplications = await Promise.all(
        applications.map(async (app, index) => {
          try {
            console.log(`🔄 Enriching application ${index + 1}/${applications.length}: ${app.id}`);
            
            // Get candidate details
            let candidate = null;
            if (app.candidateId) {
              try {
                const { userService } = await import('./userService');
                candidate = await userService.getUserById(app.candidateId);
                console.log(`✅ Found candidate: ${candidate?.firstName} ${candidate?.lastName}`);
              } catch (err) {
                console.warn(`⚠️ Could not fetch candidate ${app.candidateId}:`, err);
              }
            } else {
              console.warn(`⚠️ Application ${app.id} has no candidateId`);
            }
            
            // Get job details
            let job = null;
            if (app.jobId) {
              try {
                const { jobService } = await import('./jobService');
                job = await jobService.getJobById(app.jobId);
                console.log(`✅ Found job: ${job?.title} at ${job?.company?.name || 'Unknown Company'}`);
              } catch (err) {
                console.warn(`⚠️ Could not fetch job ${app.jobId}:`, err);
              }
            } else {
              console.warn(`⚠️ Application ${app.id} has no jobId`);
            }
            
            return {
              ...app,
              candidate,
              job
            } as Application;
          } catch (err) {
            console.warn('❌ Error enriching application:', app.id, err);
            return app;
          }
        })
      );
      
      console.log(`✅ Successfully enriched ${enrichedApplications.length} applications`);
      
      return enrichedApplications;
    } catch (error) {
      console.error('Error fetching all applications:', error);
      throw error;
    }
  },

  // Get applications for a specific candidate
  async getApplicationsByCandidate(candidateId: string): Promise<Application[]> {
    try {
      const result = await client.graphql({ 
        query: listApplications,
        variables: {
          filter: {
            candidateId: { eq: candidateId }
          }
        }
      });
      return (result.data as any).listApplications.items as Application[];
    } catch (error) {
      console.error('Error fetching candidate applications:', error);
      throw error;
    }
  },

  // Get applications for a specific job
  async getApplicationsByJob(jobId: string): Promise<Application[]> {
    try {
      const result = await client.graphql({ 
        query: listApplications,
        variables: {
          filter: {
            jobId: { eq: jobId }
          }
        }
      });
      return (result.data as any).listApplications.items as Application[];
    } catch (error) {
      console.error('Error fetching job applications:', error);
      throw error;
    }
  },

  // Get applications for a company (all jobs under that company)
  async getApplicationsByCompany(companyId: string): Promise<Application[]> {
    try {
      // First get all jobs for the company
      const { jobService } = await import('./jobService');
      const companyJobs = await jobService.getJobsByCompany(companyId);
      const jobIds = companyJobs.map(job => job.id);
      
      if (jobIds.length === 0) {
        return []; // No jobs for this company
      }
      
      // Get all applications and filter for company jobs
      const result = await client.graphql({ 
        query: listApplications
      });
      
      const allApplications = (result.data as any).listApplications.items as Application[];
      
      // Filter applications that belong to jobs from this company
      const companyApplications = allApplications.filter(app => 
        jobIds.includes(app.jobId)
      );
      
      return companyApplications;
    } catch (error) {
      console.error('Error fetching company applications:', error);
      throw error;
    }
  },

  // Get a single application
  async getApplicationById(id: string): Promise<Application | null> {
    try {
      const result = await client.graphql({ 
        query: getApplication,
        variables: { id }
      });
      return (result.data as any).getApplication as Application;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  // Create a new application
  async createApplication(input: CreateApplicationInput): Promise<Application> {
    try {
      const result = await client.graphql({ 
        query: createApplicationSimplified,
        variables: { input }
      });
      
      const application = (result as any).data.createApplication as Application;
      
      // Send notification about new application (temporarily disabled for debugging)
      try {
        console.log('📬 Application notification temporarily disabled for debugging');
        // await NotificationService.notifyApplicationStatusChange({
        //   candidateId: input.candidateId,
        //   applicationId: application.id,
        //   jobTitle: 'Position', // TODO: Get from job data
        //   companyName: 'Company', // TODO: Get from company data  
        //   oldStatus: 'Not Applied',
        //   newStatus: 'Applied',
        //   nextSteps: 'Your application has been submitted successfully. We will review it and get back to you soon.'
        // });
      } catch (notificationError) {
        console.warn('Failed to send application notification:', notificationError);
      }
      
      return application;
    } catch (error: any) {
      console.error('Error creating application:', error);
      
      // Log individual GraphQL errors for debugging
      if (error.errors && Array.isArray(error.errors)) {
        console.error('🔍 GraphQL errors breakdown:');
        error.errors.forEach((err: any, index: number) => {
          console.error(`  Error ${index + 1}:`, {
            message: err.message,
            errorType: err.errorType,
            errorInfo: err.errorInfo,
            locations: err.locations,
            path: err.path
          });
        });
      }
      
      throw error;
    }
  },

  // Update application (typically for stage progression)
  async updateApplication(input: UpdateApplicationInput): Promise<Application> {
    try {
      // Get current application state first
      let currentApplication: Application | null = null;
      if (input.id) {
        try {
          currentApplication = await this.getApplicationById(input.id);
        } catch (error) {
          console.warn('Could not fetch current application for comparison:', error);
        }
      }

      const result = await client.graphql({ 
        query: updateApplication,
        variables: { input }
      });
      
      const updatedApplication = result.data.updateApplication as Application;
      
      // Send notification if status changed
      if (currentApplication && input.overallStatus && 
          currentApplication.overallStatus !== input.overallStatus) {
        try {
          await NotificationService.notifyApplicationStatusChange({
            candidateId: updatedApplication.candidateId,
            applicationId: updatedApplication.id,
            jobTitle: 'Position', // TODO: Get from job/company data
            companyName: 'Company', // TODO: Get from job/company data
            oldStatus: currentApplication.overallStatus,
            newStatus: input.overallStatus,
            nextSteps: this.getNextStepsMessage(input.overallStatus, input.currentStage ?? undefined)
          });
        } catch (notificationError) {
          console.warn('Failed to send application update notification:', notificationError);
        }
      }
      
      return updatedApplication;
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  },

  // Helper method to generate next steps message
  getNextStepsMessage(status: string, currentStage?: number): string {
    switch (status) {
      case 'ACTIVE':
        if (currentStage === 2) return 'Please complete your written test when ready.';
        if (currentStage === 3) return 'Please complete your video interview when ready.';
        if (currentStage === 4) return 'Your interview will be scheduled soon.';
        return 'We are reviewing your application.';
      case 'REJECTED':
        return 'Thank you for your interest. We will keep your profile for future opportunities.';
      case 'HIRED':
        return 'Congratulations! Welcome to the team. You will receive onboarding information soon.';
      default:
        return 'We will update you on the next steps soon.';
    }
  },

  // Apply to a job (creates an application)
  async applyToJob(candidateId: string, jobId: string): Promise<Application> {
    const applicationInput: CreateApplicationInput = {
      candidateId,
      jobId,
      appliedAt: new Date().toISOString(),
      currentStage: 1,
      overallStatus: ApplicationStatus.ACTIVE,
      applicationStatus: StageStatus.COMPLETED,
      writtenTestStatus: StageStatus.NOT_STARTED,
      videoTestStatus: StageStatus.NOT_STARTED,
      interviewStatus: StageStatus.NOT_STARTED
    };

    return this.createApplication(applicationInput);
  },

  // Progress application to next stage
  async progressToNextStage(applicationId: string, currentStage: number): Promise<Application> {
    const nextStage = Math.min(currentStage + 1, 4);
    
    const updateInput: UpdateApplicationInput = {
      id: applicationId,
      currentStage: nextStage,
      // Update stage statuses based on the new stage
      ...(nextStage === 2 && { writtenTestStatus: StageStatus.PENDING }),
      ...(nextStage === 3 && { videoTestStatus: StageStatus.PENDING }),
      ...(nextStage === 4 && { interviewStatus: StageStatus.PENDING })
    };

    return this.updateApplication(updateInput);
  }
};