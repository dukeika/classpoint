#!/usr/bin/env node

// Quick deployment debugging script
require('dotenv').config({ path: '.env.local' });

console.log('🔍 DEPLOYMENT DEBUG - Current Configuration');
console.log('==========================================');

console.log('\n📧 Admin User Check:');
console.log('Email: dukeika@gmail.com');
console.log('Expected: Should redirect to /admin/dashboard after login');

console.log('\n🔧 Environment Variables:');
console.log('NEXT_PUBLIC_AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION || '❌ Missing');
console.log('NEXT_PUBLIC_AWS_USER_POOLS_ID:', process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID || '❌ Missing');
console.log('NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID:', process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID || '❌ Missing');
console.log('NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID:', process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID || '❌ Missing');
console.log('NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT:', process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT || '❌ Missing');
console.log('NEXT_PUBLIC_AWS_APPSYNC_API_KEY:', process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY ? '✅ Set' : '❌ Missing');

console.log('\n✅ Expected Values (Production):');
console.log('User Pool ID: eu-west-2_FpwJJthe4');
console.log('Identity Pool ID: eu-west-2:c0ce106d-6892-4312-ab97-2dcae624ec66');
console.log('Region: eu-west-2');
console.log('AppSync Endpoint: https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql');

console.log('\n🚨 Common Issues:');
console.log('1. Amplify Console environment variables not set correctly');
console.log('2. Browser cache contains old authentication tokens');
console.log('3. Still deploying to wrong AWS account/region');
console.log('4. Build cache needs clearing in Amplify Console');

console.log('\n🔧 Next Steps:');
console.log('1. Check your Amplify Console environment variables match expected values');
console.log('2. Clear browser cache completely');
console.log('3. Try incognito/private browsing mode');
console.log('4. Visit /debug-auth on your deployed URL');
console.log('5. Check browser console for specific error messages');

console.log('\n📍 Deployment URLs to check:');
console.log('- Your Amplify app URL + /login');
console.log('- Your Amplify app URL + /debug-auth');
console.log('- Expected redirect after login: /admin/dashboard');
console.log('==========================================');