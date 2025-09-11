#!/usr/bin/env node

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { AdminGetUserCommand, CognitoIdentityProviderClient, AdminListGroupsForUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
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
  process.exit(1);
}

// Create Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ 
  region: AWS_REGION
});

async function checkUserGroups(email) {
  try {
    console.log('🔍 Checking groups for user:', email);
    
    // Get user details
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email
    });
    
    const userResult = await cognitoClient.send(getUserCommand);
    console.log('✅ User found:', userResult.Username);
    
    // Get user groups
    const getGroupsCommand = new AdminListGroupsForUserCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: email
    });
    
    const groupsResult = await cognitoClient.send(getGroupsCommand);
    console.log('🔍 User groups:', groupsResult.Groups.map(g => g.GroupName));
    
    return groupsResult.Groups;
    
  } catch (error) {
    console.error('❌ Error checking user groups:', error.message);
    throw error;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('📝 Usage: node check-user-groups.js <email>');
    console.log('\n📄 Example:');
    console.log('   node check-user-groups.js dukeika@gmail.com');
    process.exit(1);
  }

  const [email] = args;
  
  console.log('🚀 Checking User Groups');
  console.log('=====================');
  console.log('📧 Email:', email);
  console.log('🏢 User Pool ID:', COGNITO_USER_POOL_ID);
  console.log('🌍 Region:', AWS_REGION);
  console.log('=====================\n');

  await checkUserGroups(email);
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUserGroups };