"use client";

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

// Configure Amplify immediately when this module loads
console.log("🔧 Configuring Amplify on client side...");
console.log("🔍 Configuration values:", {
  userPoolId: awsExports.aws_user_pools_id,
  userPoolWebClientId: awsExports.aws_user_pools_web_client_id,
  region: awsExports.aws_cognito_region
});

try {
  Amplify.configure(awsExports);
  console.log("✅ Amplify configured successfully on client side");
} catch (error) {
  console.error("❌ Failed to configure Amplify on client side:", error);
}

export const isAmplifyConfigured = true;