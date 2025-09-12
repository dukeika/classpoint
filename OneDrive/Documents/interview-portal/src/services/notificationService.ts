// src/services/notificationService.ts
// Centralized notification service for handling all types of notifications

import { EmailService, EmailRecipient, ApplicationStatusEmailData, InterviewScheduleEmailData } from './emailService';
import { userService } from './userService';

export interface NotificationContext {
  candidateId?: string;
  companyId?: string;
  applicationId?: string;
  jobId?: string;
  interviewId?: string;
}

export interface ApplicationStatusChangeData {
  candidateId: string;
  applicationId: string;
  jobTitle: string;
  companyName: string;
  oldStatus: string;
  newStatus: string;
  nextSteps?: string;
}

export interface InterviewScheduledData {
  candidateId: string;
  interviewId: string;
  jobTitle: string;
  companyName: string;
  interviewerName: string;
  scheduledAt: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  meetingUrl?: string;
  location?: string;
}

export class NotificationService {
  
  // Application-related notifications
  static async notifyApplicationStatusChange(data: ApplicationStatusChangeData): Promise<void> {
    try {
      console.log('📬 Sending application status change notification...');
      
      // Get candidate details
      const candidate = await userService.getUserById(data.candidateId);
      if (!candidate) {
        console.error('❌ Candidate not found:', data.candidateId);
        return;
      }

      // Prepare email data
      const emailData: ApplicationStatusEmailData = {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        newStatus: data.newStatus,
        nextSteps: data.nextSteps,
        applicationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/candidate/dashboard?tab=applications`
      };

      // Send email
      const recipient: EmailRecipient = {
        email: candidate.email,
        name: `${candidate.firstName} ${candidate.lastName}`
      };

      const success = await EmailService.sendApplicationStatusEmail(recipient, emailData);
      
      if (success) {
        console.log('✅ Application status notification sent successfully');
      } else {
        console.error('❌ Failed to send application status notification');
      }
      
    } catch (error) {
      console.error('❌ Error sending application status notification:', error);
    }
  }

  static async notifyInterviewScheduled(data: InterviewScheduledData): Promise<void> {
    try {
      console.log('📬 Sending interview scheduled notification...');
      
      // Get candidate details
      const candidate = await userService.getUserById(data.candidateId);
      if (!candidate) {
        console.error('❌ Candidate not found:', data.candidateId);
        return;
      }

      // Parse the scheduled date
      const interviewDate = new Date(data.scheduledAt);
      const dateString = interviewDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeString = interviewDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      // Prepare email data
      const emailData: InterviewScheduleEmailData = {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        interviewerName: data.interviewerName,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        interviewDate: dateString,
        interviewTime: timeString,
        interviewType: data.type,
        meetingUrl: data.meetingUrl,
        location: data.location,
        duration: data.duration
      };

      // Send email
      const recipient: EmailRecipient = {
        email: candidate.email,
        name: `${candidate.firstName} ${candidate.lastName}`
      };

      const success = await EmailService.sendInterviewScheduleEmail(recipient, emailData);
      
      if (success) {
        console.log('✅ Interview scheduled notification sent successfully');
      } else {
        console.error('❌ Failed to send interview scheduled notification');
      }
      
    } catch (error) {
      console.error('❌ Error sending interview scheduled notification:', error);
    }
  }

  // User registration welcome email
  static async notifyUserRegistered(candidateId: string): Promise<void> {
    try {
      console.log('📬 Sending welcome notification...');
      
      // Get candidate details
      const candidate = await userService.getUserById(candidateId);
      if (!candidate) {
        console.error('❌ Candidate not found:', candidateId);
        return;
      }

      // Send welcome email
      const recipient: EmailRecipient = {
        email: candidate.email,
        name: `${candidate.firstName} ${candidate.lastName}`
      };

      const success = await EmailService.sendWelcomeEmail(recipient);
      
      if (success) {
        console.log('✅ Welcome notification sent successfully');
      } else {
        console.error('❌ Failed to send welcome notification');
      }
      
    } catch (error) {
      console.error('❌ Error sending welcome notification:', error);
    }
  }

  // Test stage completion notifications
  static async notifyTestCompleted(candidateId: string, applicationId: string, testType: 'written' | 'video', score?: number): Promise<void> {
    try {
      console.log(`📬 Sending ${testType} test completion notification...`);
      
      // For now, we'll send a generic status change notification
      // This can be expanded to have specific test completion templates
      await this.notifyApplicationStatusChange({
        candidateId,
        applicationId,
        jobTitle: 'Position', // This should come from the application data
        companyName: 'Company', // This should come from the application data
        oldStatus: 'In Progress',
        newStatus: 'Test Completed',
        nextSteps: score ? `Your ${testType} test has been completed with a score of ${score}%. We will review your results and get back to you soon.` : `Your ${testType} test has been completed. We will review your results and get back to you soon.`
      });
      
    } catch (error) {
      console.error(`❌ Error sending ${testType} test completion notification:`, error);
    }
  }

  // Company notifications (to HR/recruiters)
  static async notifyCompanyNewApplication(companyId: string, candidateName: string, jobTitle: string): Promise<void> {
    try {
      console.log('📬 Sending new application notification to company...');
      
      // Get company admin users
      // For now, we'll just log this - in a real implementation, we'd send to all company admins
      console.log(`📧 New application from ${candidateName} for ${jobTitle}`);
      
      // TODO: Implement company admin email notifications
      // This would require getting all company admin users and sending them emails
      
    } catch (error) {
      console.error('❌ Error sending company notification:', error);
    }
  }

  // Bulk notification methods
  static async notifyMultipleRecipients(
    recipientIds: string[], 
    notificationType: 'status_change' | 'interview_scheduled' | 'welcome',
    data: any
  ): Promise<void> {
    const notifications = recipientIds.map(id => {
      switch (notificationType) {
        case 'status_change':
          return this.notifyApplicationStatusChange({ ...data, candidateId: id });
        case 'interview_scheduled':
          return this.notifyInterviewScheduled({ ...data, candidateId: id });
        case 'welcome':
          return this.notifyUserRegistered(id);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(notifications);
  }

  // Scheduled notification methods (for future features)
  static async scheduleNotification(
    recipientId: string,
    notificationType: string,
    data: any,
    scheduleAt: Date
  ): Promise<void> {
    // TODO: Implement scheduled notifications using AWS EventBridge or similar
    console.log(`📅 Scheduled notification for ${recipientId} at ${scheduleAt}`);
  }

  // Notification preferences (for future features)
  static async updateNotificationPreferences(
    userId: string, 
    preferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
      types: string[];
    }
  ): Promise<void> {
    // TODO: Implement user notification preferences
    console.log(`⚙️ Updated notification preferences for ${userId}`, preferences);
  }

  // Analytics and tracking
  static async trackNotificationSent(
    userId: string,
    notificationType: string,
    success: boolean
  ): Promise<void> {
    // TODO: Implement notification analytics
    console.log(`📊 Notification ${notificationType} for ${userId}: ${success ? 'sent' : 'failed'}`);
  }
}