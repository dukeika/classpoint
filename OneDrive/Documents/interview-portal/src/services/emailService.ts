// src/services/emailService.ts
// Email notification service using AWS SES

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface ApplicationStatusEmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  newStatus: string;
  nextSteps?: string;
  applicationUrl?: string;
}

export interface InterviewScheduleEmailData {
  candidateName: string;
  interviewerName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: 'video' | 'phone' | 'in-person';
  meetingUrl?: string;
  location?: string;
  duration: number; // in minutes
}

export class EmailService {
  private static readonly FROM_EMAIL = 'noreply@abhh-interviews.com';
  private static readonly COMPANY_NAME = 'ABHH Interview Portal';

  // Email templates
  static getApplicationStatusTemplate(data: ApplicationStatusEmailData): EmailTemplate {
    const subject = `Application Status Update: ${data.jobTitle} at ${data.companyName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0D9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .status-badge { 
              display: inline-block; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold; 
              text-transform: uppercase;
              margin: 10px 0;
            }
            .status-active { background-color: #D1FAE5; color: #065F46; }
            .status-pending { background-color: #FEF3C7; color: #92400E; }
            .status-completed { background-color: #DBEAFE; color: #1E40AF; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #0D9488; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.COMPANY_NAME}</h1>
              <p>Application Status Update</p>
            </div>
            
            <div class="content">
              <h2>Hello ${data.candidateName},</h2>
              
              <p>We have an update regarding your application for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
              
              <p>Your application status has been updated to:</p>
              <div class="status-badge status-${data.newStatus.toLowerCase()}">${data.newStatus}</div>
              
              ${data.nextSteps ? `
                <h3>Next Steps:</h3>
                <p>${data.nextSteps}</p>
              ` : ''}
              
              ${data.applicationUrl ? `
                <p>
                  <a href="${data.applicationUrl}" class="button">View Your Application</a>
                </p>
              ` : ''}
              
              <p>Thank you for your interest in joining our team. We appreciate the time and effort you've invested in your application.</p>
              
              <p>Best regards,<br>
              The ${data.companyName} Recruitment Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from ${this.COMPANY_NAME}.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hello ${data.candidateName},

We have an update regarding your application for the ${data.jobTitle} position at ${data.companyName}.

Your application status has been updated to: ${data.newStatus}

${data.nextSteps ? `Next Steps: ${data.nextSteps}` : ''}

${data.applicationUrl ? `View your application: ${data.applicationUrl}` : ''}

Thank you for your interest in joining our team. We appreciate the time and effort you've invested in your application.

Best regards,
The ${data.companyName} Recruitment Team

---
This is an automated message from ${this.COMPANY_NAME}.
Please do not reply to this email.
    `;

    return { subject, htmlBody, textBody };
  }

  static getInterviewScheduleTemplate(data: InterviewScheduleEmailData): EmailTemplate {
    const subject = `Interview Scheduled: ${data.jobTitle} at ${data.companyName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Scheduled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0D9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .interview-details { 
              background-color: white; 
              padding: 20px; 
              border-left: 4px solid #0D9488; 
              margin: 20px 0; 
            }
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              border-bottom: 1px solid #eee; 
            }
            .detail-label { font-weight: bold; color: #666; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #0D9488; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.COMPANY_NAME}</h1>
              <p>Interview Scheduled</p>
            </div>
            
            <div class="content">
              <h2>Hello ${data.candidateName},</h2>
              
              <p>Great news! Your interview has been scheduled for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>.</p>
              
              <div class="interview-details">
                <h3>Interview Details:</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span>${data.interviewDate}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span>${data.interviewTime}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span>${data.duration} minutes</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Type:</span>
                  <span>${data.interviewType.replace('_', ' ')}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Interviewer:</span>
                  <span>${data.interviewerName}</span>
                </div>
                
                ${data.meetingUrl ? `
                  <div class="detail-row">
                    <span class="detail-label">Meeting Link:</span>
                    <span><a href="${data.meetingUrl}">${data.meetingUrl}</a></span>
                  </div>
                ` : ''}
                
                ${data.location ? `
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${data.location}</span>
                  </div>
                ` : ''}
              </div>
              
              <h3>Preparation Tips:</h3>
              <ul>
                <li>Review the job description and company information</li>
                <li>Prepare questions about the role and company culture</li>
                <li>Have your resume and any portfolio materials ready</li>
                ${data.interviewType === 'video' ? '<li>Test your camera and microphone beforehand</li>' : ''}
                ${data.interviewType === 'in-person' ? '<li>Plan your route and arrive 10 minutes early</li>' : ''}
              </ul>
              
              <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
              
              <p>We look forward to speaking with you!</p>
              
              <p>Best regards,<br>
              The ${data.companyName} Recruitment Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from ${this.COMPANY_NAME}.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hello ${data.candidateName},

Great news! Your interview has been scheduled for the ${data.jobTitle} position at ${data.companyName}.

Interview Details:
- Date: ${data.interviewDate}
- Time: ${data.interviewTime}
- Duration: ${data.duration} minutes
- Type: ${data.interviewType.replace('_', ' ')}
- Interviewer: ${data.interviewerName}
${data.meetingUrl ? `- Meeting Link: ${data.meetingUrl}` : ''}
${data.location ? `- Location: ${data.location}` : ''}

Preparation Tips:
- Review the job description and company information
- Prepare questions about the role and company culture
- Have your resume and any portfolio materials ready
${data.interviewType === 'video' ? '- Test your camera and microphone beforehand' : ''}
${data.interviewType === 'in-person' ? '- Plan your route and arrive 10 minutes early' : ''}

If you need to reschedule or have any questions, please contact us as soon as possible.

We look forward to speaking with you!

Best regards,
The ${data.companyName} Recruitment Team

---
This is an automated message from ${this.COMPANY_NAME}.
Please do not reply to this email.
    `;

    return { subject, htmlBody, textBody };
  }

  static getWelcomeTemplate(candidateName: string): EmailTemplate {
    const subject = `Welcome to ${this.COMPANY_NAME}!`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ABHH Interview Portal</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0D9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #0D9488; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .features { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${this.COMPANY_NAME}!</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${candidateName},</h2>
              
              <p>Welcome to the ABHH Interview Portal! We're excited to have you join our platform.</p>
              
              <div class="features">
                <h3>What you can do with your account:</h3>
                <ul>
                  <li>Browse and apply for job opportunities</li>
                  <li>Complete online assessments and video interviews</li>
                  <li>Track your application progress in real-time</li>
                  <li>Upload and manage your resume and profile</li>
                  <li>Schedule and join interviews with employers</li>
                </ul>
              </div>
              
              <p>Ready to start your career journey? Log in to your dashboard and explore available opportunities.</p>
              
              <p>
                <a href="https://your-domain.com/candidate/dashboard" class="button">Go to Dashboard</a>
              </p>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              The ABHH Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from ${this.COMPANY_NAME}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Hello ${candidateName},

Welcome to the ABHH Interview Portal! We're excited to have you join our platform.

What you can do with your account:
- Browse and apply for job opportunities
- Complete online assessments and video interviews
- Track your application progress in real-time
- Upload and manage your resume and profile
- Schedule and join interviews with employers

Ready to start your career journey? Log in to your dashboard and explore available opportunities.

Visit: https://your-domain.com/candidate/dashboard

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
The ABHH Team

---
This is an automated message from ${this.COMPANY_NAME}.
    `;

    return { subject, htmlBody, textBody };
  }

  // Mock email sending for development
  static async sendEmail(
    recipient: EmailRecipient,
    template: EmailTemplate,
    options?: {
      replyTo?: string;
      attachments?: Array<{
        filename: string;
        content: string;
        contentType: string;
      }>;
    }
  ): Promise<boolean> {
    try {
      // In development, just log the email
      console.log('📧 Email would be sent:');
      console.log('To:', recipient);
      console.log('Subject:', template.subject);
      console.log('HTML Body:', template.htmlBody);
      console.log('Text Body:', template.textBody);
      
      // TODO: Integrate with AWS SES
      // const sesClient = new SESClient({ region: 'us-west-1' });
      // const command = new SendEmailCommand({
      //   Source: this.FROM_EMAIL,
      //   Destination: {
      //     ToAddresses: [recipient.email]
      //   },
      //   Message: {
      //     Subject: {
      //       Data: template.subject,
      //       Charset: 'UTF-8'
      //     },
      //     Body: {
      //       Html: {
      //         Data: template.htmlBody,
      //         Charset: 'UTF-8'
      //       },
      //       Text: {
      //         Data: template.textBody,
      //         Charset: 'UTF-8'
      //       }
      //     }
      //   }
      // });
      // await sesClient.send(command);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  // Convenience methods for common email types
  static async sendApplicationStatusEmail(
    recipient: EmailRecipient,
    data: ApplicationStatusEmailData
  ): Promise<boolean> {
    const template = this.getApplicationStatusTemplate(data);
    return this.sendEmail(recipient, template);
  }

  static async sendInterviewScheduleEmail(
    recipient: EmailRecipient,
    data: InterviewScheduleEmailData
  ): Promise<boolean> {
    const template = this.getInterviewScheduleTemplate(data);
    return this.sendEmail(recipient, template);
  }

  static async sendWelcomeEmail(
    recipient: EmailRecipient
  ): Promise<boolean> {
    const template = this.getWelcomeTemplate(recipient.name || 'there');
    return this.sendEmail(recipient, template);
  }
}