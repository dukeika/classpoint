// src/lib/emailService.ts
export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface AdminWelcomeEmailData {
  adminName: string;
  adminEmail: string;
  tempPassword: string;
  companyName: string;
  loginUrl: string;
}

export class EmailService {
  
  static generateAdminWelcomeEmail(data: AdminWelcomeEmailData): EmailTemplate {
    const { adminName, adminEmail, tempPassword, companyName, loginUrl } = data;
    
    const subject = `Welcome to ABHH Interview Platform - ${companyName} Admin Access`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ABHH Interview Platform</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .welcome { margin-bottom: 30px; }
            .welcome h2 { color: #1e293b; margin: 0 0 15px 0; font-size: 22px; }
            .welcome p { color: #64748b; margin: 0; font-size: 16px; }
            .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 25px 0; }
            .credentials h3 { color: #1e293b; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; }
            .credential-item { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
            .credential-item:last-child { border-bottom: none; }
            .credential-label { font-weight: 500; color: #475569; }
            .credential-value { font-family: monospace; background: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #d1d5db; font-size: 14px; word-break: break-all; }
            .steps { margin: 30px 0; }
            .steps h3 { color: #1e293b; margin: 0 0 15px 0; font-size: 18px; }
            .steps ol { padding-left: 20px; }
            .steps li { margin: 8px 0; color: #475569; }
            .login-button { display: inline-block; background: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; text-align: center; }
            .login-button:hover { background: #0284c7; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
            .warning-icon { color: #f59e0b; font-weight: bold; }
            .footer { background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🧠❤️ ABHH</h1>
                <p>Applied Behavioral Holistic Health</p>
            </div>
            
            <div class="content">
                <div class="welcome">
                    <h2>Welcome to ABHH Interview Platform!</h2>
                    <p>Hello <strong>${adminName}</strong>,</p>
                    <p>Your administrator account has been created for <strong>${companyName}</strong>. You now have full access to manage your company's interview and recruitment process.</p>
                </div>
                
                <div class="credentials">
                    <h3>🔑 Your Login Credentials</h3>
                    <div class="credential-item">
                        <span class="credential-label">Email:</span>
                        <span class="credential-value">${adminEmail}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Temporary Password:</span>
                        <span class="credential-value">${tempPassword}</span>
                    </div>
                    <div class="credential-item">
                        <span class="credential-label">Login URL:</span>
                        <span class="credential-value">${loginUrl}</span>
                    </div>
                </div>
                
                <div class="warning">
                    <span class="warning-icon">⚠️</span> <strong>Important:</strong> You will be required to change this temporary password when you first log in for security purposes.
                </div>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" class="login-button">Log In to ABHH Platform</a>
                </div>
                
                <div class="steps">
                    <h3>📋 Next Steps</h3>
                    <ol>
                        <li>Click the "Log In" button above or visit the login URL</li>
                        <li>Sign in with your email and temporary password</li>
                        <li>Create a new, secure password when prompted</li>
                        <li>Complete your profile setup</li>
                        <li>Start managing your company's interview process!</li>
                    </ol>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                    <p style="margin: 0; color: #0c4a6e;"><strong>Need Help?</strong> If you have any questions or need assistance, please contact your system administrator or our support team.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>This email was sent to ${adminEmail} because an administrator account was created for you.</p>
                <p><strong>ABHH Interview Platform</strong> - Empowering holistic behavioral health through technology</p>
            </div>
        </div>
    </body>
    </html>`;

    const text = `
Welcome to ABHH Interview Platform!

Hello ${adminName},

Your administrator account has been created for ${companyName}. You now have full access to manage your company's interview and recruitment process.

Login Credentials:
- Email: ${adminEmail}
- Temporary Password: ${tempPassword}
- Login URL: ${loginUrl}

IMPORTANT: You will be required to change this temporary password when you first log in for security purposes.

Next Steps:
1. Visit the login URL: ${loginUrl}
2. Sign in with your email and temporary password
3. Create a new, secure password when prompted
4. Complete your profile setup
5. Start managing your company's interview process!

Need Help? If you have any questions or need assistance, please contact your system administrator or our support team.

Best regards,
ABHH Interview Platform Team

This email was sent to ${adminEmail} because an administrator account was created for you.
    `;

    return {
      to: adminEmail,
      subject,
      html,
      text
    };
  }

  // For development - log the email content
  static async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      console.log('📧 SENDING EMAIL:');
      console.log('='.repeat(80));
      console.log(`TO: ${template.to}`);
      console.log(`SUBJECT: ${template.subject}`);
      console.log('HTML CONTENT:');
      console.log(template.html);
      console.log('='.repeat(80));
      console.log('TEXT CONTENT:');
      console.log(template.text);
      console.log('='.repeat(80));
      
      // TODO: In production, integrate with actual email service like:
      // - AWS SES
      // - SendGrid
      // - Nodemailer with SMTP
      // - Resend
      // etc.
      
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return false;
    }
  }
}