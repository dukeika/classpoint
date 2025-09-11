#!/usr/bin/env node

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { ListUsersInGroupCommand, CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

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
});

function formatUserInfo(user) {
  const attributes = {};
  if (user.Attributes) {
    user.Attributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
  }

  return {
    username: user.Username,
    email: attributes.email || 'No email',
    name: `${attributes.given_name || ''} ${attributes.family_name || ''}`.trim() || 'No name',
    phone: attributes.phone_number || 'No phone',
    status: user.UserStatus,
    enabled: user.Enabled,
    created: user.UserCreateDate ? new Date(user.UserCreateDate).toLocaleDateString() : 'Unknown',
    lastModified: user.UserLastModifiedDate ? new Date(user.UserLastModifiedDate).toLocaleDateString() : 'Unknown'
  };
}

async function listAdminUsers() {
  try {
    console.log('🔍 Fetching admin users from SuperAdmins group...');
    
    // List users in SuperAdmins group
    const listSuperAdminsCommand = new ListUsersInGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      GroupName: 'SuperAdmins'
    });

    const superAdminsResult = await cognitoClient.send(listSuperAdminsCommand);
    
    console.log('🔍 Fetching admin users from CompanyAdmins group...');
    
    // List users in CompanyAdmins group
    const listCompanyAdminsCommand = new ListUsersInGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      GroupName: 'CompanyAdmins'
    });

    const companyAdminsResult = await cognitoClient.send(listCompanyAdminsCommand);
    
    console.log('\n🚀 ABHH Interview Platform - Admin Users');
    console.log('========================================\n');
    
    // Display Super Admins
    if (superAdminsResult.Users && superAdminsResult.Users.length > 0) {
      console.log('👑 SUPER ADMINISTRATORS (' + superAdminsResult.Users.length + ')');
      console.log('─'.repeat(50));
      
      superAdminsResult.Users.forEach((user, index) => {
        const info = formatUserInfo(user);
        console.log(`${index + 1}. ${info.name} (${info.email})`);
        console.log(`   Username: ${info.username}`);
        console.log(`   Phone: ${info.phone}`);
        console.log(`   Status: ${info.status} ${info.enabled ? '✅' : '❌'}`);
        console.log(`   Created: ${info.created}`);
        console.log(`   Modified: ${info.lastModified}`);
        console.log('');
      });
    } else {
      console.log('👑 SUPER ADMINISTRATORS');
      console.log('─'.repeat(50));
      console.log('No super administrators found.\n');
    }
    
    // Display Company Admins
    if (companyAdminsResult.Users && companyAdminsResult.Users.length > 0) {
      console.log('🏢 COMPANY ADMINISTRATORS (' + companyAdminsResult.Users.length + ')');
      console.log('─'.repeat(50));
      
      companyAdminsResult.Users.forEach((user, index) => {
        const info = formatUserInfo(user);
        console.log(`${index + 1}. ${info.name} (${info.email})`);
        console.log(`   Username: ${info.username}`);
        console.log(`   Phone: ${info.phone}`);
        console.log(`   Status: ${info.status} ${info.enabled ? '✅' : '❌'}`);
        console.log(`   Created: ${info.created}`);
        console.log(`   Modified: ${info.lastModified}`);
        console.log('');
      });
    } else {
      console.log('🏢 COMPANY ADMINISTRATORS');
      console.log('─'.repeat(50));
      console.log('No company administrators found.\n');
    }
    
    console.log('📝 To reset a password, use: node reset-admin-password.js <email>');
    console.log('➕ To create new admin, use: node create-admin.js <email> <firstName> <lastName>');
    
  } catch (error) {
    console.error('❌ Error listing admin users:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      if (error.message.includes('SuperAdmins')) {
        console.error('   SuperAdmins group not found. Create it in Cognito User Pool Groups.');
      } else if (error.message.includes('CompanyAdmins')) {
        console.error('   CompanyAdmins group not found. Create it in Cognito User Pool Groups.');
      } else {
        console.error('   User pool not found - check your User Pool ID');
        console.error('   Current User Pool ID:', COGNITO_USER_POOL_ID);
      }
    } else if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.error('   AWS credentials do not have permission to list users');
      console.error('   Required permissions: cognito-idp:ListUsersInGroup');
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
  
  if (args.length > 0 && (args[0] === '--help' || args[0] === '-h')) {
    console.log('📝 Usage: node list-admins.js');
    console.log('');
    console.log('📄 Description:');
    console.log('   Lists all administrators in the ABHH platform');
    console.log('   Shows both Super Administrators and Company Administrators');
    console.log('');
    console.log('🔧 Prerequisites:');
    console.log('   - Set NEXT_PUBLIC_AWS_USER_POOLS_ID in environment variables');
    console.log('   - Ensure AWS credentials are configured');
    console.log('   - SuperAdmins and CompanyAdmins groups must exist in Cognito');
    process.exit(0);
  }

  console.log('🚀 ABHH Interview Platform - List Admin Users Tool');
  console.log('==================================================');
  console.log('🏢 User Pool ID:', COGNITO_USER_POOL_ID);
  console.log('🌍 Region:', AWS_REGION);
  console.log('==================================================');

  await listAdminUsers();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { listAdminUsers };