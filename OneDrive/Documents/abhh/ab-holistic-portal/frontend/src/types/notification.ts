export interface Notification {
  id: string;
  recipientId: string;
  recipientEmail: string;
  recipientRole: 'admin' | 'applicant';
  type: 'email' | 'in-app' | 'sms';
  category: 'application' | 'test' | 'interview' | 'system' | 'reminder';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  metadata?: {
    applicationId?: string;
    jobId?: string;
    testId?: string;
    interviewId?: string;
    triggeredBy?: string;
    templateId?: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: Notification['category'];
  type: Notification['type'];
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    applicationUpdates: boolean;
    testInvitations: boolean;
    interviewScheduling: boolean;
    systemNotifications: boolean;
    reminders: boolean;
  };
  inApp: {
    applicationUpdates: boolean;
    testInvitations: boolean;
    interviewScheduling: boolean;
    systemNotifications: boolean;
    reminders: boolean;
  };
  sms: {
    urgentOnly: boolean;
    interviewReminders: boolean;
  };
}

export interface StageTransition {
  id: string;
  applicationId: string;
  fromStage: string;
  toStage: string;
  triggeredBy: string;
  triggeredAt: string;
  reason?: string;
  notes?: string;
  automatedRules?: {
    testScoreThreshold?: number;
    timeBasedTrigger?: boolean;
    adminApprovalRequired?: boolean;
  };
  notificationsSent: Notification['id'][];
}