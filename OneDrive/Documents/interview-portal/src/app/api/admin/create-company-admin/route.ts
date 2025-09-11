// src/app/api/admin/create-company-admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AdminCreateUserCommand, CognitoIdentityProviderClient, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand, AdminCreateUserCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { userService } from '@/services/userService';
import { UserRole, ApprovalStatus } from '@/API';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { createCompany as createCompanyMutation } from '@/graphql/mutations';
import { EmailService } from '@/lib/emailService';

// Configure Amplify for server-side use
if (!Amplify.getConfig().API?.GraphQL) {
  Amplify.configure({
    API: {
      GraphQL: {
        endpoint: process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT!,
        region: process.env.NEXT_PUBLIC_AWS_APPSYNC_REGION!,
        defaultAuthMode: 'apiKey' as any,
        apiKey: process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY
      }
    },
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID!,
      }
    }
  });
}

// Create GraphQL client for server-side operations
const client = generateClient();

// Server-side configuration using process.env (not NEXT_PUBLIC_)
const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID;
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.PRORECRUIT_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.PRORECRUIT_SECRET_ACCESS_KEY;
const APPSYNC_API_KEY = process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY;

// Lazy initialization function for Cognito client (only when needed)
function createCognitoClient() {
  // Debug credentials loading (only at runtime)
  console.log('🔍 Server environment check:');
  console.log('  COGNITO_USER_POOL_ID:', COGNITO_USER_POOL_ID ? '✅ Set' : '❌ Missing');
  console.log('  AWS_REGION:', AWS_REGION);
  console.log('  AWS_ACCESS_KEY_ID:', AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('  AWS_SECRET_ACCESS_KEY:', AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('  APPSYNC_API_KEY:', APPSYNC_API_KEY ? '✅ Set' : '❌ Missing');

  // Validate credentials before creating client
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error('❌ Missing AWS credentials. Please check your environment variables.');
  }

  return new CognitoIdentityProviderClient({ 
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    }
  });
}

interface CreateCompanyWithAdminRequest {
  company: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address?: string;
    description?: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure it has at least one of each required character type
  password += 'A'; // Uppercase
  password += 'a'; // Lowercase
  password += '1'; // Number
  password += '!'; // Special character
  
  // Add more random characters
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function createCompanyAdmin(adminData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId: string;
  companyName: string;
}): Promise<{ tempPassword: string; adminId: string }> {
  if (!COGNITO_USER_POOL_ID) {
    throw new Error('Cognito User Pool ID not configured');
  }

  try {
    const cognitoClient = createCognitoClient();
    // Generate temporary password
    const tempPassword = generateTempPassword();
    
    console.log('🔄 Creating company admin user in Cognito...');
    
    // Format phone number for Cognito (must be in E.164 format: +1234567890)
    let formattedPhone = null;
    if (adminData.phone && adminData.phone.trim()) {
      let phone = adminData.phone.replace(/\D/g, ''); // Remove all non-digits
      
      // If it's a US number without country code, add +1
      if (phone.length === 10) {
        phone = '1' + phone;
      }
      
      // Add the + prefix if not present
      if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }
      
      formattedPhone = phone;
      console.log('📞 Formatted phone:', adminData.phone, '->', formattedPhone);
    }

    // Create user in Cognito - suppress all automatic emails
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: adminData.email,
      UserAttributes: [
        { Name: 'email', Value: adminData.email },
        { Name: 'email_verified', Value: 'true' }, // Pre-verify email since we trust it
        { Name: 'given_name', Value: adminData.firstName },
        { Name: 'family_name', Value: adminData.lastName },
        ...(formattedPhone ? [{ Name: 'phone_number', Value: formattedPhone }] : [])
      ],
      TemporaryPassword: tempPassword,
      MessageAction: 'SUPPRESS', // Don't send any Cognito emails - we'll send our own
      ForceAliasCreation: false
    });

    const createResult: AdminCreateUserCommandOutput = await cognitoClient.send(createUserCommand);
    console.log('✅ Company admin user created in Cognito');
    
    // Send our custom professional welcome email
    console.log('📧 Sending custom welcome email to:', adminData.email);
    
    try {
      const loginUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
      
      const emailTemplate = EmailService.generateAdminWelcomeEmail({
        adminName: `${adminData.firstName} ${adminData.lastName}`,
        adminEmail: adminData.email,
        tempPassword: tempPassword,
        companyName: adminData.companyName,
        loginUrl: `${loginUrl}/login`
      });
      
      // For now, we'll log the email content (in production, integrate with real email service)
      await EmailService.sendEmail(emailTemplate);
      console.log('✅ Welcome email prepared and logged');
      
    } catch (emailError) {
      console.warn('⚠️ Email preparation failed, but admin account was created:', emailError);
    }

    // Add user to CompanyAdmins group
    console.log('🔄 Adding user to CompanyAdmins group...');
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: adminData.email,
      GroupName: 'CompanyAdmins'
    });

    await cognitoClient.send(addToGroupCommand);
    console.log('✅ User added to CompanyAdmins group');

    // Create user record in our database
    console.log('🔄 Creating user record in database...');
    const userRecord = await userService.createUser({
      sub: createResult.User?.Username || '',
      email: adminData.email,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      phone: adminData.phone,
      role: UserRole.COMPANY_ADMIN,
      companyId: adminData.companyId,
      isActive: true,
      approvalStatus: ApprovalStatus.APPROVED // Company admins are auto-approved
    });

    console.log('✅ User record created in database');

    return {
      tempPassword,
      adminId: userRecord.id
    };

  } catch (error) {
    console.error('❌ Error creating company admin:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCompanyWithAdminRequest = await request.json();
    
    console.log('🔄 API: Creating company with admin...');
    
    // Step 1: Create the company directly using GraphQL
    console.log('🔄 Creating company...');
    const companyResult = await client.graphql({
      query: createCompanyMutation,
      variables: {
        input: {
          name: body.company.name,
          email: body.company.email,
          phone: body.company.phone || null,
          website: body.company.website || null,
          address: body.company.address || null,
          description: body.company.description || null,
          isActive: true
        }
      },
      authMode: 'apiKey' as any
    });

    const company = companyResult.data.createCompany;
    console.log('✅ Company created:', company.id);

    // Step 2: Create the admin user
    const adminResult = await createCompanyAdmin({
      firstName: body.admin.firstName,
      lastName: body.admin.lastName,
      email: body.admin.email,
      phone: body.admin.phone,
      companyId: company.id,
      companyName: company.name
    });

    console.log('✅ Company admin created:', adminResult.adminId);

    return NextResponse.json({
      success: true,
      data: {
        companyId: company.id,
        adminId: adminResult.adminId,
        tempPassword: adminResult.tempPassword,
        adminEmail: body.admin.email,
        message: 'Company and admin created successfully. Admin credentials are logged in server console.'
      }
    });

  } catch (error: any) {
    console.error('❌ API Error creating company with admin:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create company and admin'
    }, { status: 500 });
  }
}