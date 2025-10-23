import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { DatabaseService } from '../../services/database';
import {
  UserRole,
  SendNotificationRequest,
  Notification,
  NotificationType,
  NotificationTemplate
} from '../../types';
import { validateRequest } from '../../utils/validation';

const logger = new Logger('NotificationsSend');
const dbService = DatabaseService.getInstance();

// Notification templates with placeholders
const NOTIFICATION_TEMPLATES: Record<NotificationTemplate, { subject: string; content: string }> = {
  [NotificationTemplate.WELCOME]: {
    subject: 'Welcome to AB Holistic Interview Portal',
    content: 'Hello {{firstName}}, welcome to our recruitment platform! We\'re excited to have you.'
  },
  [NotificationTemplate.APPLICATION_RECEIVED]: {
    subject: 'Application Received - {{jobTitle}}',
    content: 'Thank you for applying to {{jobTitle}}. We have received your application and will review it shortly.'
  },
  [NotificationTemplate.APPLICATION_STATUS_UPDATE]: {
    subject: 'Application Status Update - {{jobTitle}}',
    content: 'Your application for {{jobTitle}} has been updated to: {{newStage}}. {{comments}}'
  },
  [NotificationTemplate.TEST_INVITATION]: {
    subject: 'Test Invitation - {{testTitle}}',
    content: 'You have been invited to take the {{testTitle}} test for your application to {{jobTitle}}. Please complete it by {{deadline}}.'
  },
  [NotificationTemplate.INTERVIEW_SCHEDULED]: {
    subject: 'Interview Scheduled - {{jobTitle}}',
    content: 'Your interview for {{jobTitle}} has been scheduled for {{interviewDate}} at {{interviewTime}}. {{interviewLink}}'
  },
  [NotificationTemplate.OFFER_EXTENDED]: {
    subject: 'Job Offer - {{jobTitle}}',
    content: 'Congratulations! We are pleased to extend an offer for the {{jobTitle}} position. Please review the offer details and respond by {{deadline}}.'
  },
  [NotificationTemplate.REJECTION]: {
    subject: 'Application Update - {{jobTitle}}',
    content: 'Thank you for your interest in {{jobTitle}}. After careful consideration, we have decided to move forward with other candidates. {{feedback}}'
  },
  [NotificationTemplate.REMINDER]: {
    subject: 'Reminder: {{reminderTitle}}',
    content: '{{reminderMessage}}'
  }
};

/**
 * Send Notification Handler
 *
 * SECURITY: Requires admin authentication
 * Only admins can send notifications to applicants
 *
 * Features:
 * - Send email/SMS/push/in-app notifications
 * - Use predefined templates
 * - Schedule notifications for later
 * - Track delivery status
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  logger.info('Send notification request received', {
    requestId: context.awsRequestId
  });

  try {
    // SECURITY: Verify admin authentication
    const authContext = event.requestContext?.authorizer;
    if (!authContext || !authContext.principalId) {
      logger.warn('Unauthorized notification send attempt');
      return createResponse(401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to send notifications'
        }
      });
    }

    const userId = authContext.userId || authContext.principalId;
    const userRole = authContext.role as UserRole;

    // SECURITY: Only admins can send notifications
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SUPER_ADMIN) {
      logger.warn('Non-admin attempting to send notification', {
        userId,
        userRole
      });
      return createResponse(403, {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can send notifications'
        }
      });
    }

    // Validate request body
    const validationResult = validateRequest<SendNotificationRequest>(event.body, {
      recipientId: { required: true, type: 'string' },
      recipientType: { required: true, type: 'string', enum: ['applicant', 'admin'] },
      type: { required: true, type: 'string', enum: Object.values(NotificationType) },
      template: { required: true, type: 'string', enum: Object.values(NotificationTemplate) },
      data: { required: false, type: 'object' },
      scheduledFor: { required: false, type: 'string' },
      priority: { required: false, type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
    });

    if (!validationResult.isValid) {
      return createResponse(400, {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid notification data',
          details: validationResult.errors
        }
      });
    }

    const notificationData = validationResult.data!;

    logger.info('Creating notification', {
      recipientId: notificationData.recipientId,
      type: notificationData.type,
      template: notificationData.template,
      userId
    });

    // Verify recipient exists
    const recipientTable = notificationData.recipientType === 'applicant'
      ? process.env.APPLICANTS_TABLE
      : process.env.APPLICANTS_TABLE; // In a real app, would have separate admin table

    const recipient = await dbService.getItem(
      recipientTable!,
      {
        applicantId: notificationData.recipientId  // Or userId for admins
      }
    );

    if (!recipient) {
      logger.warn('Recipient not found for notification', {
        recipientId: notificationData.recipientId
      });
      return createResponse(404, {
        success: false,
        error: {
          code: 'RECIPIENT_NOT_FOUND',
          message: 'Notification recipient not found'
        }
      });
    }

    // Get template and populate with data
    const template = NOTIFICATION_TEMPLATES[notificationData.template];
    const subject = replacePlaceholders(template.subject, notificationData.data || {});
    const content = replacePlaceholders(template.content, notificationData.data || {});

    // Create notification record
    const notificationId = uuidv4();
    const now = dbService.getTimestamp();
    const isScheduled = !!notificationData.scheduledFor;

    const notification: Notification & Record<string, any> = {
      notificationId,
      recipientId: notificationData.recipientId,
      recipientType: notificationData.recipientType,
      type: notificationData.type,
      template: notificationData.template,
      subject,
      content,
      data: notificationData.data,
      sentAt: isScheduled ? undefined : now,
      failed: false,
      priority: notificationData.priority || 'medium',
      scheduledFor: notificationData.scheduledFor,
      expiresAt: notificationData.scheduledFor
        ? new Date(new Date(notificationData.scheduledFor).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      createdAt: now,

      // DynamoDB metadata
      EntityType: 'Notification',
      GSI1PK: `RECIPIENT#${notificationData.recipientId}`,
      GSI1SK: `NOTIFICATION#${now}`,
      GSI2PK: `STATUS#${isScheduled ? 'scheduled' : 'sent'}`,
      GSI2SK: now
    };

    // Save notification to database
    await dbService.putItem(
      process.env.NOTIFICATIONS_TABLE!,
      notification
    );

    logger.info('Notification created', {
      notificationId,
      recipientId: notificationData.recipientId,
      type: notificationData.type,
      scheduled: isScheduled,
      userId
    });

    // In a real application, this would trigger actual email/SMS/push sending
    // For now, we just store it in the database
    if (!isScheduled) {
      await sendNotificationViaChannel(notification, recipient);
    }

    // Prepare response
    const response = {
      notificationId,
      recipientId: notification.recipientId,
      type: notification.type,
      template: notification.template,
      subject,
      priority: notification.priority,
      sentAt: notification.sentAt,
      scheduledFor: notification.scheduledFor,
      status: isScheduled ? 'scheduled' : 'sent'
    };

    return createResponse(201, {
      success: true,
      data: {
        notification: response
      },
      message: isScheduled
        ? 'Notification scheduled successfully'
        : 'Notification sent successfully'
    });

  } catch (error) {
    logger.error('Failed to send notification', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return createResponse(500, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send notification'
      }
    });
  }
};

/**
 * Replace placeholders in template string
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value || ''));
  }
  // Remove any remaining unreplaced placeholders
  result = result.replace(/{{[^}]+}}/g, '');
  return result;
}

/**
 * Send notification via appropriate channel
 * This is a placeholder - in production would integrate with SES, SNS, etc.
 */
async function sendNotificationViaChannel(
  notification: Notification,
  recipient: any
): Promise<void> {
  try {
    logger.info('Sending notification via channel', {
      notificationId: notification.notificationId,
      type: notification.type,
      recipientEmail: recipient.email
    });

    // TODO: Integrate with actual services
    switch (notification.type) {
      case NotificationType.EMAIL:
        // Would use AWS SES here
        logger.info('EMAIL notification queued', {
          to: recipient.email,
          subject: notification.subject
        });
        break;

      case NotificationType.SMS:
        // Would use AWS SNS here
        logger.info('SMS notification queued', {
          to: recipient.phone,
          message: notification.content
        });
        break;

      case NotificationType.PUSH:
        // Would use FCM/APNS here
        logger.info('PUSH notification queued', {
          to: recipient.userId,
          title: notification.subject
        });
        break;

      case NotificationType.IN_APP:
        // Already stored in database, just log
        logger.info('IN_APP notification created', {
          recipientId: notification.recipientId
        });
        break;

      default:
        logger.warn('Unknown notification type', {
          type: notification.type
        });
    }

    // Update notification as delivered (in real app, this would be async callback)
    await dbService.updateItem(
      process.env.NOTIFICATIONS_TABLE!,
      { notificationId: notification.notificationId },
      {
        updateExpression: 'SET deliveredAt = :deliveredAt',
        expressionAttributeValues: {
          ':deliveredAt': dbService.getTimestamp()
        }
      }
    );

  } catch (error) {
    logger.error('Failed to send notification via channel', {
      error,
      notificationId: notification.notificationId,
      type: notification.type
    });

    // Mark notification as failed
    await dbService.updateItem(
      process.env.NOTIFICATIONS_TABLE!,
      { notificationId: notification.notificationId },
      {
        updateExpression: 'SET failed = :failed, failureReason = :reason',
        expressionAttributeValues: {
          ':failed': true,
          ':reason': error instanceof Error ? error.message : 'Unknown error'
        }
      }
    );
  }
}

export default handler;
