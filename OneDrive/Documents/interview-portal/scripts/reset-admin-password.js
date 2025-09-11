#!/usr/bin/env node

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { AdminSetUserPasswordCommand, CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration - try multiple environment variable names
const COGNITO_USER_POOL_ID = 
  process.env.AMPLIFY_COGNITO_USER_POOL_ID || 
  process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID ||
  process.env.AWS_USER_POOLS_ID;
const AWS_REGION = 
  process.env.AWS_REGION || 
  process.env.NEXT_PUBLIC_AWS_REGION || 
  'eu-west-2';

if (!COGNITO_USER_POOL_ID) {
  console.error('❌ Error: Cognito User Pool ID environment variable is not set');
  console.error('   Please set one of these in your .env.local file:');
  console.error('   - NEXT_PUBLIC_AWS_USER_POOLS_ID');
  console.error('   - AMPLIFY_COGNITO_USER_POOL_ID');
  console.error('   - AWS_USER_POOLS_ID');
  process.exit(1);
}

// Create Cognito client with automatic credential detection
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: AWS_REGION,
  // AWS SDK will automatically detect credentials from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. AWS credentials file (~/.aws/credentials)
  // 3. IAM roles (if running on EC2)
  // 4. AWS CLI profile
});

function generateSecurePassword() {
  // Generate a secure password with all required character types
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure it has at least one of each required character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
  
  // Add more random characters to make it 12 characters total
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function resetAdminPassword(email, newPassword = null, permanent = true) {
  try {
    console.log('🔍 Checking if user exists...');
    
    // First, verify the user exists
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email
    });

    const userResult = await cognitoClient.send(getUserCommand);
    console.log('✅ User found:', userResult.Username);

    // Generate new password if not provided
    const finalPassword = newPassword || generateSecurePassword();
    
    console.log('🔄 Resetting admin password...');
    
    // Set new password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email,
      Password: finalPassword,
      Permanent: permanent // If true, user won't be forced to change password on next login
    });

    await cognitoClient.send(setPasswordCommand);
    
    console.log('\n🎉 Admin password reset successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 New Password:', finalPassword);
    
    if (permanent) {
      console.log('✅ Password is permanent - admin can use this password indefinitely');
    } else {
      console.log('⚠️  Password is temporary - admin must change it on next login');
    }
    
    console.log('\n📝 The admin can now log in at your application URL');
    
    return {
      email,
      newPassword: finalPassword,
      permanent
    };

  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
    
    if (error.name === 'UserNotFoundException') {
      console.error('   This email address is not registered in the system');
      console.error('   Available options:');
      console.error('   1. Check the email address for typos');
      console.error('   2. Create a new admin with: node create-admin.js');
    } else if (error.name === 'InvalidPasswordException') {
      console.error('   Password does not meet requirements:');
      console.error('   - At least 8 characters');
      console.error('   - Must contain uppercase, lowercase, number, and special character');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('   User pool not found - check your User Pool ID');
      console.error('   Current User Pool ID:', COGNITO_USER_POOL_ID);
    } else if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.error('   AWS credentials do not have permission to reset passwords');
      console.error('   Required permissions: cognito-idp:AdminSetUserPassword, cognito-idp:AdminGetUser');
    } else if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      console.error('   AWS credentials not found. Please configure one of:');
      console.error('   1. AWS CLI: run `aws configure`');
      console.error('   2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
      console.error('   3. AWS credentials file: ~/.aws/credentials');
    }
    
    process.exit(1);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('📝 Usage: node reset-admin-password.js <email> [password] [--temporary]');
    console.log('');
    console.log('📄 Examples:');
    console.log('   node reset-admin-password.js admin@abhh.com');
    console.log('   node reset-admin-password.js admin@abhh.com MyNewPassword123!');
    console.log('   node reset-admin-password.js admin@abhh.com --temporary');
    console.log('   node reset-admin-password.js admin@abhh.com MyNewPassword123! --temporary');
    console.log('');
    console.log('🔧 Options:');
    console.log('   email          Email address of the admin to reset');
    console.log('   password       Optional: Specific password to set (will generate secure one if not provided)');
    console.log('   --temporary    Optional: Make password temporary (admin must change on next login)');
    console.log('');
    console.log('🔧 Prerequisites:');
    console.log('   - Set NEXT_PUBLIC_AWS_USER_POOLS_ID in environment variables');
    console.log('   - Ensure AWS credentials are configured');
    console.log('   - Admin user must already exist in Cognito User Pool');
    process.exit(1);
  }

  const email = args[0];
  let password = null;
  let permanent = true;

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--temporary') {
      permanent = false;
    } else if (!password && !arg.startsWith('--')) {
      password = arg;
    }
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Error: Invalid email address format');
    process.exit(1);
  }

  // Validate custom password if provided
  if (password) {
    if (password.length < 8) {
      console.error('❌ Error: Password must be at least 8 characters');
      process.exit(1);
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      console.error('❌ Error: Password must contain uppercase, lowercase, number, and special character');
      process.exit(1);
    }
  }

  console.log('🚀 ABHH Interview Platform - Admin Password Reset Tool');
  console.log('====================================================');
  console.log('📧 Email:', email);
  if (password) {
    console.log('🔑 Custom Password: ********');
  } else {
    console.log('🔑 Password: Will generate secure password');
  }
  console.log('⚙️  Type:', permanent ? 'Permanent' : 'Temporary');
  console.log('🏢 User Pool ID:', COGNITO_USER_POOL_ID);
  console.log('🌍 Region:', AWS_REGION);
  console.log('====================================================\n');

  await resetAdminPassword(email, password, permanent);
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { resetAdminPassword };