import { Notification } from '../types/notification';
import { Application, ApplicationStage } from '../types/application';

class NotificationService {

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'status'>): Promise<Notification> {
    try {
      // Mock implementation - replace with actual API call
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('Creating notification:', newNotification);

      // In real implementation, call API to create notification
      // const response = await fetch(`${this.baseUrl}/notifications`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newNotification)
      // });
      // return response.json();

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send stage transition notifications
  async sendStageTransitionNotifications(
    application: Application,
    fromStage: ApplicationStage,
    toStage: ApplicationStage,
    triggeredBy: string
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    try {
      // Notification to applicant
      const applicantNotification = await this.createNotification({
        recipientId: application.applicantId,
        recipientEmail: application.applicantEmail,
        recipientRole: 'applicant',
        type: 'email',
        category: 'application',
        title: this.getStageTransitionTitle(toStage, 'applicant'),
        message: this.getStageTransitionMessage(toStage, 'applicant', application),
        actionUrl: this.getStageActionUrl(toStage, application),
        actionText: this.getStageActionText(toStage),
        priority: this.getNotificationPriority(toStage),
        metadata: {
          applicationId: application.applicationId,
          jobId: application.jobId,
          triggeredBy
        }
      });

      notifications.push(applicantNotification);

      // Notification to admin (for certain stages)
      if (this.shouldNotifyAdmin(toStage)) {
        const adminNotification = await this.createNotification({
          recipientId: 'admin',
          recipientEmail: 'admin@abholistic.com',
          recipientRole: 'admin',
          type: 'email',
          category: 'application',
          title: this.getStageTransitionTitle(toStage, 'admin'),
          message: this.getStageTransitionMessage(toStage, 'admin', application),
          actionUrl: `/admin/jobs/${application.jobId}/applications`,
          actionText: 'Review Application',
          priority: 'medium',
          metadata: {
            applicationId: application.applicationId,
            jobId: application.jobId,
            triggeredBy
          }
        });

        notifications.push(adminNotification);
      }

      // Schedule follow-up reminders if needed
      const reminders = await this.scheduleStageReminders(application, toStage);
      notifications.push(...reminders);

      return notifications;
    } catch (error) {
      console.error('Error sending stage transition notifications:', error);
      throw error;
    }
  }

  // Get stage-specific notification content
  private getStageTransitionTitle(stage: ApplicationStage, role: 'applicant' | 'admin'): string {
    const titles = {
      applicant: {
        'applied': 'Application Received',
        'screening': 'Application Under Review',
        'written-test': 'Written Test Available',
        'video-test': 'Video Interview Ready',
        'final-interview': 'Final Interview Invitation',
        'decision': 'Application Update',
        'accepted': 'Congratulations! Job Offer',
        'rejected': 'Application Update',
        'withdrawn': 'Application Withdrawn'
      },
      admin: {
        'applied': 'New Application Received',
        'screening': 'New Application to Review',
        'written-test': 'Applicant Advanced to Written Test',
        'video-test': 'Applicant Advanced to Video Test',
        'final-interview': 'Applicant Ready for Final Interview',
        'decision': 'Application Pending Decision',
        'accepted': 'Application Accepted',
        'rejected': 'Application Rejected',
        'withdrawn': 'Application Withdrawn'
      }
    } as Record<'applicant' | 'admin', Record<ApplicationStage, string>>;

    return titles[role][stage] || 'Application Update';
  }

  private getStageTransitionMessage(stage: ApplicationStage, role: 'applicant' | 'admin', application: Application): string {
    const jobTitle = (application as any).job?.title || 'the position';
    const messages = {
      applicant: {
        'applied': `Thank you for applying to ${jobTitle}. We have received your application.`,
        'screening': `Thank you for applying to ${jobTitle}. Your application is now under review by our hiring team.`,
        'written-test': `Great news! You've advanced to the written test stage for ${jobTitle}. Please complete the assessment within 48 hours.`,
        'video-test': `Congratulations! You've passed the written test. You can now record your video interview responses.`,
        'final-interview': `Excellent progress! You're invited to schedule your final interview for the ${jobTitle} position.`,
        'decision': `We're making our final decision for the ${jobTitle} position. We'll contact you soon with updates.`,
        'accepted': `Congratulations! We're excited to offer you the ${jobTitle} position. Please check your email for next steps.`,
        'rejected': `Thank you for your interest in the ${jobTitle} position. While we were impressed with your qualifications, we've decided to move forward with other candidates.`,
        'withdrawn': `Your application for ${jobTitle} has been withdrawn as requested.`
      },
      admin: {
        'applied': `New application received from ${application.applicantName} for ${jobTitle}.`,
        'screening': `New application received from ${application.applicantName} for ${jobTitle}.`,
        'written-test': `${application.applicantName} has advanced to the written test stage for ${jobTitle}.`,
        'video-test': `${application.applicantName} has completed the written test and advanced to video interview for ${jobTitle}.`,
        'final-interview': `${application.applicantName} has completed video interview and is ready for final interview for ${jobTitle}.`,
        'decision': `Final decision needed for ${application.applicantName}'s application to ${jobTitle}.`,
        'accepted': `${application.applicantName} has been accepted for ${jobTitle}.`,
        'rejected': `${application.applicantName}'s application for ${jobTitle} has been rejected.`,
        'withdrawn': `${application.applicantName} has withdrawn their application for ${jobTitle}.`
      }
    } as Record<'applicant' | 'admin', Record<ApplicationStage, string>>;

    return messages[role][stage] || 'Your application status has been updated.';
  }

  private getStageActionUrl(stage: ApplicationStage, application: Application): string {
    const urls: Record<ApplicationStage, string> = {
      'applied': '/applicant/dashboard',
      'screening': '/applicant/dashboard',
      'written-test': `/applicant/tests/test-${application.jobId}`,
      'video-test': `/applicant/tests/video/video-${application.jobId}`,
      'final-interview': `/applicant/interview/schedule/${application.applicationId}`,
      'decision': '/applicant/dashboard',
      'accepted': `/applicant/applications/${application.applicationId}`,
      'rejected': '/applicant/dashboard',
      'withdrawn': '/applicant/dashboard'
    };

    return urls[stage] || '/applicant/dashboard';
  }

  private getStageActionText(stage: ApplicationStage): string {
    const actions: Record<ApplicationStage, string> = {
      'applied': 'View Application',
      'screening': 'View Application',
      'written-test': 'Take Test',
      'video-test': 'Record Video',
      'final-interview': 'Schedule Interview',
      'decision': 'View Status',
      'accepted': 'View Offer',
      'rejected': 'View Details',
      'withdrawn': 'View Dashboard'
    };

    return actions[stage] || 'View Details';
  }

  private getNotificationPriority(stage: ApplicationStage): Notification['priority'] {
    const priorities: Record<ApplicationStage, Notification['priority']> = {
      'applied': 'low',
      'screening': 'low',
      'written-test': 'high',
      'video-test': 'high',
      'final-interview': 'high',
      'decision': 'medium',
      'accepted': 'urgent',
      'rejected': 'medium',
      'withdrawn': 'low'
    };

    return priorities[stage] || 'medium';
  }

  private shouldNotifyAdmin(stage: ApplicationStage): boolean {
    const adminNotificationStages: ApplicationStage[] = [
      'screening', 'final-interview', 'accepted', 'rejected'
    ];
    return adminNotificationStages.includes(stage);
  }

  // Schedule reminder notifications
  private async scheduleStageReminders(application: Application, stage: ApplicationStage): Promise<Notification[]> {
    const reminders: Notification[] = [];

    // Schedule reminders for time-sensitive stages
    if (stage === 'written-test' || stage === 'video-test') {
      // 24-hour reminder
      const reminder24h = await this.createNotification({
        recipientId: application.applicantId,
        recipientEmail: application.applicantEmail,
        recipientRole: 'applicant',
        type: 'email',
        category: 'reminder',
        title: `Reminder: ${stage === 'written-test' ? 'Written Test' : 'Video Interview'} Due Soon`,
        message: `This is a friendly reminder that your ${stage === 'written-test' ? 'written test' : 'video interview'} for ${(application as any).job?.title || 'the position'} is due in 24 hours.`,
        actionUrl: this.getStageActionUrl(stage, application),
        actionText: this.getStageActionText(stage),
        priority: 'medium',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        metadata: {
          applicationId: application.applicationId,
          jobId: application.jobId,
          triggeredBy: 'system'
        }
      });

      reminders.push(reminder24h);
    }

    return reminders;
  }

  // Get notifications for a user
  async getNotificationsForUser(userId: string, role: 'admin' | 'applicant'): Promise<Notification[]> {
    try {
      // Mock implementation - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          recipientId: userId,
          recipientEmail: 'user@example.com',
          recipientRole: role,
          type: 'in-app',
          category: 'application',
          title: 'Application Status Update',
          message: 'Your application has been updated.',
          priority: 'medium',
          status: 'delivered',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          metadata: {
            applicationId: 'app-1',
            jobId: 'job-1'
          }
        }
      ];

      return mockNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Mock implementation - replace with actual API call
      console.log('Marking notification as read:', notificationId);

      // In real implementation:
      // await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      //   method: 'PATCH'
      // });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();