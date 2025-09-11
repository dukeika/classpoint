// src/lib/amplify-client.ts
"use client";

import { Amplify } from "aws-amplify";

// DEPRECATED: This file is using old configuration
// The application now uses src/aws-exports.js for configuration
// This file is kept for compatibility but should not be used

// AWS configuration - UPDATED TO MATCH CURRENT DEPLOYMENT
const awsconfig = {
  aws_project_region: "eu-west-2",
  aws_appsync_graphqlEndpoint: "https://54ofumz56bfh3kozn2qrd55ih4.appsync-api.eu-west-2.amazonaws.com/graphql",
  aws_appsync_region: "eu-west-2",
  aws_appsync_authenticationType: "API_KEY",
  aws_appsync_apiKey: "da2-2ottpnk4ejdarf3moy2nzq2adu",
  aws_cognito_identity_pool_id: "eu-west-2:TBD",
  aws_cognito_region: "eu-west-2",
  aws_user_pools_id: "eu-west-2_FpwJJthe4",
  aws_user_pools_web_client_id: "3juansb0jr3s3b8qouon7nr9gn",
  oauth: {},
  aws_cognito_username_attributes: ["EMAIL"],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ["EMAIL"],
  aws_cognito_mfa_configuration: "OFF",
  aws_cognito_mfa_types: ["SMS"],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: []
  },
  aws_cognito_verification_mechanisms: ["EMAIL"],
  aws_user_files_s3_bucket: "prorecruit-storage-eu-west-2-624914081304",
  aws_user_files_s3_bucket_region: "eu-west-2"
};

let isConfigured = false;

export function configureAmplifyClient() {
  if (typeof window === 'undefined' || isConfigured) return;
  
  try {
    Amplify.configure(awsconfig);
    isConfigured = true;
    console.log("✅ Amplify configured successfully");
  } catch (error) {
    console.error("❌ Failed to configure Amplify:", error);
  }
}

// Auto-configure on import in browser
if (typeof window !== 'undefined') {
  configureAmplifyClient();
}