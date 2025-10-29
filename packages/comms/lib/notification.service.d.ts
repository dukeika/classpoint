import { ConfigService } from '@nestjs/config';
export declare enum NotificationChannel {
    IN_APP = "IN_APP",
    EMAIL = "EMAIL",
    SMS = "SMS"
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
export declare class NotificationService {
    private configService;
    private readonly logger;
    private readonly sesClient;
    private readonly snsClient;
    private readonly fromEmail;
    private readonly region;
    private readonly enabled;
    constructor(configService: ConfigService);
    /**
     * Send an email notification using AWS SES
     */
    sendEmail(notification: EmailNotification): Promise<NotificationResult>;
    /**
     * Send an SMS notification using AWS SNS
     */
    sendSms(notification: SmsNotification): Promise<NotificationResult[]>;
    /**
     * Format phone number to E.164 format
     * Assumes Nigerian numbers (+234)
     */
    private formatPhoneNumber;
    /**
     * Send notifications across multiple channels
     */
    sendMultiChannel(params: {
        channels: NotificationChannel[];
        email?: EmailNotification;
        sms?: SmsNotification;
    }): Promise<NotificationResult[]>;
    /**
     * Send announcement notification to recipients
     */
    sendAnnouncementNotification(params: {
        title: string;
        content: string;
        channels: NotificationChannel[];
        recipients: Array<{
            email?: string;
            phone?: string;
            name?: string;
        }>;
    }): Promise<NotificationResult[]>;
    /**
     * Format announcement as HTML email
     */
    private formatAnnouncementHtml;
}
