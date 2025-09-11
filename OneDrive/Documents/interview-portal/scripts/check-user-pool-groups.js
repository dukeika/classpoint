#!/usr/bin/env node

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { 
  CognitoIdentityProviderClient, 
  ListGroupsCommand,
  GetGroupCommand
} = require('@aws-sdk/client-cognito-identity-provider');

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

async function checkUserPoolGroups() {
  try {
    console.log('🔍 Checking User Pool groups configuration...');
    
    // List all groups
    const listGroupsCommand = new ListGroupsCommand({
      UserPoolId: COGNITO_USER_POOL_ID
    });
    
    const groupsResult = await cognitoClient.send(listGroupsCommand);
    console.log('✅ Found groups:', groupsResult.Groups?.length || 0);
    
    // Check each group configuration
    for (const group of groupsResult.Groups || []) {
      console.log(`\n📋 Group: ${group.GroupName}`);
      console.log(`   Description: ${group.Description || 'N/A'}`);
      console.log(`   Role ARN: ${group.RoleArn || 'N/A'}`);
      console.log(`   Precedence: ${group.Precedence || 'N/A'}`);
      console.log(`   Creation Date: ${group.CreationDate}`);
      console.log(`   Last Modified: ${group.LastModifiedDate}`);
    }
    
    return groupsResult.Groups;
    
  } catch (error) {
    console.error('❌ Error checking user pool groups:', error.message);
    throw error;
  }
}

// CLI Interface
async function main() {
  console.log('🚀 Checking User Pool Groups Configuration');
  console.log('==========================================');
  console.log('🏢 User Pool ID:', COGNITO_USER_POOL_ID);
  console.log('🌍 Region:', AWS_REGION);
  console.log('==========================================\n');

  await checkUserPoolGroups();
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUserPoolGroups };