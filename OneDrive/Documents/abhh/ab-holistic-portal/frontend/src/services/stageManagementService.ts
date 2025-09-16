import { Application, ApplicationStage } from '../types/application';
import { StageTransition } from '../types/notification';
import { notificationService } from './notificationService';

interface StageRule {
  fromStage: ApplicationStage;
  toStage: ApplicationStage;
  conditions: {
    testScoreThreshold?: number;
    adminApprovalRequired?: boolean;
    timeBasedTrigger?: {
      delayHours: number;
      condition: 'auto-advance' | 'auto-reject';
    };
  };
  automatedActions: {
    sendNotifications: boolean;
    updateStatus: boolean;
    scheduleReminders: boolean;
  };
}

class StageManagementService {

  // Define stage progression rules
  private stageRules: StageRule[] = [
    {
      fromStage: 'applied',
      toStage: 'screening',
      conditions: {
        adminApprovalRequired: false // Auto-advance immediately
      },
      automatedActions: {
        sendNotifications: true,
        updateStatus: true,
        scheduleReminders: false
      }
    },
    {
      fromStage: 'screening',
      toStage: 'written-test',
      conditions: {
        adminApprovalRequired: true // Requires admin approval
      },
      automatedActions: {
        sendNotifications: true,
        updateStatus: true,
        scheduleReminders: true
      }
    },
    {
      fromStage: 'written-test',
      toStage: 'video-test',
      conditions: {
        testScoreThreshold: 70, // Must score 70% or higher
        adminApprovalRequired: false
      },
      automatedActions: {
        sendNotifications: true,
        updateStatus: true,
        scheduleReminders: true
      }
    },
    {
      fromStage: 'video-test',
      toStage: 'final-interview',
      conditions: {
        adminApprovalRequired: true // Requires admin review of video
      },
      automatedActions: {
        sendNotifications: true,
        updateStatus: true,
        scheduleReminders: false
      }
    },
    {
      fromStage: 'final-interview',
      toStage: 'decision',
      conditions: {
        adminApprovalRequired: true // Manual decision required
      },
      automatedActions: {
        sendNotifications: true,
        updateStatus: true,
        scheduleReminders: false
      }
    }
  ];

  // Progress application to next stage
  async progressApplication(
    applicationId: string,
    triggeredBy: string,
    reason?: string,
    notes?: string
  ): Promise<{ success: boolean; newStage?: ApplicationStage; error?: string }> {
    try {
      // Get current application
      const application = await this.getApplication(applicationId);
      if (!application) {
        return { success: false, error: 'Application not found' };
      }

      // Find applicable rule
      const rule = this.stageRules.find(r => r.fromStage === application.currentStage);
      if (!rule) {
        return { success: false, error: 'No progression rule found for current stage' };
      }

      // Check conditions
      const canProgress = await this.checkStageConditions(application, rule);
      if (!canProgress.allowed) {
        return { success: false, error: canProgress.reason };
      }

      // Execute stage transition
      await this.executeStageTransition(
        application,
        rule.toStage,
        triggeredBy,
        reason,
        notes
      );

      return { success: true, newStage: rule.toStage };
    } catch (error) {
      console.error('Error progressing application:', error);
      return { success: false, error: 'Internal error during stage progression' };
    }
  }

  // Check if application can progress to next stage
  private async checkStageConditions(
    application: Application,
    rule: StageRule
  ): Promise<{ allowed: boolean; reason?: string }> {
    const { conditions } = rule;

    // Check test score threshold
    if (conditions.testScoreThreshold) {
      let score: number | undefined;

      if (application.currentStage === 'written-test') {
        score = application.writtenTestScore;
      } else if (application.currentStage === 'video-test') {
        score = application.videoTestScore;
      }

      if (score === undefined) {
        return { allowed: false, reason: 'Test not completed' };
      }

      if (score < conditions.testScoreThreshold) {
        return { allowed: false, reason: `Score ${score}% below threshold ${conditions.testScoreThreshold}%` };
      }
    }

    // Check admin approval requirement
    if (conditions.adminApprovalRequired) {
      // In a real implementation, check if admin has approved this transition
      // For now, we'll assume manual calls have admin approval
      console.log('Admin approval required for this transition');
    }

    // Check time-based conditions
    if (conditions.timeBasedTrigger) {
      const stageStartTime = new Date(application.lastActivityAt || application.appliedAt);
      const hoursElapsed = (Date.now() - stageStartTime.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed < conditions.timeBasedTrigger.delayHours) {
        return { allowed: false, reason: 'Minimum time requirement not met' };
      }
    }

    return { allowed: true };
  }

  // Execute stage transition
  private async executeStageTransition(
    application: Application,
    newStage: ApplicationStage,
    triggeredBy: string,
    reason?: string,
    notes?: string
  ): Promise<StageTransition> {
    const transition: StageTransition = {
      id: `transition-${Date.now()}`,
      applicationId: application.applicationId,
      fromStage: application.currentStage,
      toStage: newStage,
      triggeredBy,
      triggeredAt: new Date().toISOString(),
      reason,
      notes,
      notificationsSent: []
    };

    try {
      // Update application stage
      await this.updateApplicationStage(application.applicationId, newStage);

      // Send notifications
      const notifications = await notificationService.sendStageTransitionNotifications(
        { ...application, currentStage: newStage },
        application.currentStage,
        newStage,
        triggeredBy
      );

      transition.notificationsSent = notifications.map(n => n.id);

      // Log transition
      await this.logStageTransition(transition);

      return transition;
    } catch (error) {
      console.error('Error executing stage transition:', error);
      throw error;
    }
  }

  // Auto-process applications based on test results
  async processTestCompletion(
    applicationId: string,
    testType: 'written' | 'video',
    score?: number
  ): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) return;

      const expectedStage: ApplicationStage = testType === 'written' ? 'written-test' : 'video-test';
      if (application.currentStage !== expectedStage) {
        console.log('Application not in expected stage for test completion');
        return;
      }

      // Update application with test score
      if (testType === 'written') {
        await this.updateApplicationField(applicationId, 'writtenTestScore', score);
        await this.updateApplicationField(applicationId, 'writtenTestCompletedAt', new Date().toISOString());
      } else {
        await this.updateApplicationField(applicationId, 'videoTestScore', score);
        await this.updateApplicationField(applicationId, 'videoTestCompletedAt', new Date().toISOString());
      }

      // Auto-progress if conditions are met
      if (testType === 'written' && score !== undefined) {
        const result = await this.progressApplication(applicationId, 'system', 'Test completed');

        if (!result.success && result.error?.includes('below threshold')) {
          // Auto-reject if score is below threshold
          await this.rejectApplication(applicationId, 'system', 'Test score below required threshold');
        }
      }
    } catch (error) {
      console.error('Error processing test completion:', error);
    }
  }

  // Reject application
  async rejectApplication(
    applicationId: string,
    triggeredBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) return;

      await this.executeStageTransition(application, 'rejected', triggeredBy, reason);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  }

  // Accept application
  async acceptApplication(
    applicationId: string,
    triggeredBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) return;

      await this.executeStageTransition(application, 'accepted', triggeredBy, 'Application accepted', notes);
    } catch (error) {
      console.error('Error accepting application:', error);
    }
  }

  // Get stage progression timeline
  async getStageTimeline(applicationId: string): Promise<StageTransition[]> {
    try {
      // Mock implementation - replace with actual API call
      const mockTimeline: StageTransition[] = [
        {
          id: 'transition-1',
          applicationId,
          fromStage: 'applied',
          toStage: 'screening',
          triggeredBy: 'system',
          triggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          notificationsSent: ['notif-1']
        },
        {
          id: 'transition-2',
          applicationId,
          fromStage: 'screening',
          toStage: 'written-test',
          triggeredBy: 'admin@abholistic.com',
          triggeredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          reason: 'Application meets requirements',
          notificationsSent: ['notif-2']
        }
      ];

      return mockTimeline;
    } catch (error) {
      console.error('Error fetching stage timeline:', error);
      return [];
    }
  }

  // Helper methods (mock implementations)
  private async getApplication(applicationId: string): Promise<Application | null> {
    // Mock implementation - replace with actual API call
    // This would typically fetch from your database
    return null;
  }

  private async updateApplicationStage(applicationId: string, stage: ApplicationStage): Promise<void> {
    // Mock implementation - replace with actual API call
    console.log(`Updating application ${applicationId} to stage ${stage}`);
  }

  private async updateApplicationField(applicationId: string, field: string, value: any): Promise<void> {
    // Mock implementation - replace with actual API call
    console.log(`Updating application ${applicationId} field ${field} to ${value}`);
  }

  private async logStageTransition(transition: StageTransition): Promise<void> {
    // Mock implementation - replace with actual API call
    console.log('Logging stage transition:', transition);
  }

  // Get applications requiring admin attention
  async getApplicationsRequiringAttention(): Promise<Application[]> {
    try {
      // Mock implementation - replace with actual API call
      // This would return applications that need admin review/action
      return [];
    } catch (error) {
      console.error('Error fetching applications requiring attention:', error);
      return [];
    }
  }

  // Bulk stage operations
  async bulkProgressApplications(
    applicationIds: string[],
    triggeredBy: string,
    reason?: string
  ): Promise<{ successful: string[]; failed: { id: string; error: string }[] }> {
    const successful: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const applicationId of applicationIds) {
      try {
        const result = await this.progressApplication(applicationId, triggeredBy, reason);
        if (result.success) {
          successful.push(applicationId);
        } else {
          failed.push({ id: applicationId, error: result.error || 'Unknown error' });
        }
      } catch (error) {
        failed.push({ id: applicationId, error: 'Processing error' });
      }
    }

    return { successful, failed };
  }
}

export const stageManagementService = new StageManagementService();