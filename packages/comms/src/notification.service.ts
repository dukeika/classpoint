import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  htmlBody?: string;
}

export interface SmsNotification {
  phoneNumbers: string[];
  message: string;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  recipientCount: number;
}

/**
 * Service for sending notifications via email (SES) and SMS (SNS)
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly sesClient: SESClient;
  private readonly snsClient: SNSClient;
  private readonly fromEmail: string;
  private readonly region: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION', 'af-south-1');
    this.fromEmail = this.configService.get(
      'NOTIFICATION_FROM_EMAIL',
      'noreply@classpoint.ng',
    );
    this.enabled =
      this.configService.get('NOTIFICATIONS_ENABLED', 'true') === 'true';

    this.sesClient = new SESClient({ region: this.region });
    this.snsClient = new SNSClient({ region: this.region });

    this.logger.log(`NotificationService initialized`);
    this.logger.log(`  Region: ${this.region}`);
    this.logger.log(`  From Email: ${this.fromEmail}`);
    this.logger.log(`  Enabled: ${this.enabled}`);
  }

  /**
   * Send an email notification using AWS SES
   */
  async sendEmail(notification: EmailNotification): Promise<NotificationResult> {
    if (!this.enabled) {
      this.logger.warn('Notifications are disabled. Skipping email send.');
      return {
        channel: NotificationChannel.EMAIL,
        success: false,
        error: 'Notifications disabled',
        recipientCount: notification.to.length,
      };
    }

    try {
      this.logger.log(
        `Sending email to ${notification.to.length} recipient(s): ${notification.subject}`,
      );

      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: notification.to,
        },
        Message: {
          Subject: {
            Data: notification.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: notification.body,
              Charset: 'UTF-8',
            },
            ...(notification.htmlBody && {
              Html: {
                Data: notification.htmlBody,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      });

      const response = await this.sesClient.send(command);

      this.logger.log(
        `Email sent successfully. MessageId: ${response.MessageId}`,
      );

      return {
        channel: NotificationChannel.EMAIL,
        success: true,
        messageId: response.MessageId,
        recipientCount: notification.to.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to send email: ${errorMessage}`,
        errorStack,
      );

      return {
        channel: NotificationChannel.EMAIL,
        success: false,
        error: errorMessage,
        recipientCount: notification.to.length,
      };
    }
  }

  /**
   * Send an SMS notification using AWS SNS
   */
  async sendSms(notification: SmsNotification): Promise<NotificationResult[]> {
    if (!this.enabled) {
      this.logger.warn('Notifications are disabled. Skipping SMS send.');
      return notification.phoneNumbers.map((phone) => ({
        channel: NotificationChannel.SMS,
        success: false,
        error: 'Notifications disabled',
        recipientCount: 1,
      }));
    }

    this.logger.log(
      `Sending SMS to ${notification.phoneNumbers.length} recipient(s)`,
    );

    const results: NotificationResult[] = [];

    // SNS sends one message per phone number
    for (const phoneNumber of notification.phoneNumbers) {
      try {
        // Ensure phone number is in E.164 format (+2348012345678)
        const formattedPhone = this.formatPhoneNumber(phoneNumber);

        const command = new PublishCommand({
          PhoneNumber: formattedPhone,
          Message: notification.message,
          MessageAttributes: {
            'AWS.SNS.SMS.SMSType': {
              DataType: 'String',
              StringValue: 'Transactional', // Use Transactional for important messages
            },
          },
        });

        const response = await this.snsClient.send(command);

        this.logger.log(
          `SMS sent to ${phoneNumber}. MessageId: ${response.MessageId}`,
        );

        results.push({
          channel: NotificationChannel.SMS,
          success: true,
          messageId: response.MessageId,
          recipientCount: 1,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.error(
          `Failed to send SMS to ${phoneNumber}: ${errorMessage}`,
          errorStack,
        );

        results.push({
          channel: NotificationChannel.SMS,
          success: false,
          error: errorMessage,
          recipientCount: 1,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(
      `SMS batch complete: ${successCount}/${notification.phoneNumbers.length} sent successfully`,
    );

    return results;
  }

  /**
   * Format phone number to E.164 format
   * Assumes Nigerian numbers (+234)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with 234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    }

    // If doesn't start with country code, add 234
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }

    // Add + prefix
    return '+' + cleaned;
  }

  /**
   * Send notifications across multiple channels
   */
  async sendMultiChannel(params: {
    channels: NotificationChannel[];
    email?: EmailNotification;
    sms?: SmsNotification;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    if (params.channels.includes(NotificationChannel.EMAIL) && params.email) {
      const result = await this.sendEmail(params.email);
      results.push(result);
    }

    if (params.channels.includes(NotificationChannel.SMS) && params.sms) {
      const smsResults = await this.sendSms(params.sms);
      results.push(...smsResults);
    }

    // IN_APP notifications are handled by creating database records
    // This service doesn't handle in-app notifications directly

    return results;
  }

  /**
   * Send announcement notification to recipients
   */
  async sendAnnouncementNotification(params: {
    title: string;
    content: string;
    channels: NotificationChannel[];
    recipients: Array<{
      email?: string;
      phone?: string;
      name?: string;
    }>;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Send email notifications
    if (params.channels.includes(NotificationChannel.EMAIL)) {
      const emailRecipients = params.recipients
        .filter((r) => r.email)
        .map((r) => r.email!);

      if (emailRecipients.length > 0) {
        const emailResult = await this.sendEmail({
          to: emailRecipients,
          subject: `ClassPoint: ${params.title}`,
          body: params.content,
          htmlBody: this.formatAnnouncementHtml(params.title, params.content),
        });

        results.push(emailResult);
      }
    }

    // Send SMS notifications
    if (params.channels.includes(NotificationChannel.SMS)) {
      const phoneNumbers = params.recipients
        .filter((r) => r.phone)
        .map((r) => r.phone!);

      if (phoneNumbers.length > 0) {
        // Truncate SMS message to 160 characters
        const smsMessage = `ClassPoint: ${params.title}. ${params.content}`.substring(
          0,
          160,
        );

        const smsResults = await this.sendSms({
          phoneNumbers,
          message: smsMessage,
        });

        results.push(...smsResults);
      }
    }

    return results;
  }

  /**
   * Format announcement as HTML email
   */
  private formatAnnouncementHtml(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="margin: 0;">ClassPoint</h1>
  </div>

  <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
    <h2 style="color: #4CAF50; margin-top: 0;">${title}</h2>

    <div style="background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
      ${content.replace(/\n/g, '<br>')}
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      This is an automated message from your school's ClassPoint system.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>&copy; 2025 ClassPoint. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }
}
