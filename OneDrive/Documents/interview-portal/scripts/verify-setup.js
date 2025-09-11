#!/usr/bin/env node

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { CognitoIdentityProviderClient, ListGroupsCommand, CreateGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

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
  console.error('   Please set NEXT_PUBLIC_AWS_USER_POOLS_ID in your .env.local file');
  process.exit(1);
}

const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

async function verifySetup() {
  console.log('🔍 ABHH Platform Setup Verification');
  console.log('=====================================');
  console.log('📍 User Pool ID:', COGNITO_USER_POOL_ID);
  console.log('🌍 Region:', AWS_REGION);
  console.log('');

  try {
    // Test basic connection
    console.log('🔄 Testing Cognito connection...');
    const listGroupsCommand = new ListGroupsCommand({
      UserPoolId: COGNITO_USER_POOL_ID
    });
    
    const groupsResult = await cognitoClient.send(listGroupsCommand);
    console.log('✅ Connection successful');
    
    // Check for required groups
    const groups = groupsResult.Groups || [];
    const groupNames = groups.map(g => g.GroupName);
    
    console.log('\n📋 Existing Groups:', groupNames);
    
    const requiredGroups = ['SuperAdmins', 'CompanyAdmins', 'Candidates'];
    const missingGroups = requiredGroups.filter(group => !groupNames.includes(group));
    
    if (missingGroups.length > 0) {
      console.log('\n⚠️  Missing Groups:', missingGroups);
      console.log('🔧 Creating missing groups...');
      
      for (const groupName of missingGroups) {
        try {
          const createGroupCommand = new CreateGroupCommand({
            UserPoolId: COGNITO_USER_POOL_ID,
            GroupName: groupName,
            Description: `${groupName} group for ABHH Interview Platform`
          });
          
          await cognitoClient.send(createGroupCommand);
          console.log(`✅ Created group: ${groupName}`);
        } catch (error) {
          if (error.name === 'GroupExistsException') {
            console.log(`ℹ️  Group already exists: ${groupName}`);
          } else {
            console.error(`❌ Failed to create group ${groupName}:`, error.message);
          }
        }
      }
    } else {
      console.log('✅ All required groups exist');
    }
    
    console.log('\n🎉 Setup verification complete!');
    console.log('📝 You can now run: npm run create-admin admin@company.com John Doe');
    
  } catch (error) {
    console.error('\n❌ Setup verification failed:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('   User pool not found - check your User Pool ID');
      console.error('   Current User Pool ID:', COGNITO_USER_POOL_ID);
    } else if (error.name === 'UnauthorizedOperation' || error.name === 'AccessDenied') {
      console.error('   AWS credentials do not have required permissions');
      console.error('   Required permissions:');
      console.error('   - cognito-idp:ListGroups');
      console.error('   - cognito-idp:CreateGroup');
      console.error('   - cognito-idp:AdminCreateUser');
      console.error('   - cognito-idp:AdminSetUserPassword');
      console.error('   - cognito-idp:AdminAddUserToGroup');
    } else if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
      console.error('   AWS credentials not found. Please configure:');
      console.error('   1. Run: aws configure');
      console.error('   2. Or set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    }
    
    process.exit(1);
  }
}

verifySetup().catch(console.error);