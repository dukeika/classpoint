import { Amplify } from 'aws-amplify';
import { awsConfig as envAwsConfig, isDevelopment } from './environment';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: envAwsConfig.userPoolId,
      userPoolClientId: envAwsConfig.userPoolClientId,
      loginWith: {
        oauth: {
          domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'ab-holistic-portal.auth.us-west-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
          redirectSignIn: [
            process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'https://d8wgee9e93vts.cloudfront.net/auth/callback'
          ],
          redirectSignOut: [
            process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://d8wgee9e93vts.cloudfront.net/auth/login'
          ],
          responseType: 'code' as const,
        },
      },
    }
  },
  region: envAwsConfig.region,
};

// Configure Amplify
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(awsConfig, { ssr: true });

    if (isDevelopment()) {
      console.log('AWS Amplify configured successfully');
    }
  } catch (error) {
    console.error('Failed to configure AWS Amplify:', error);
    throw new Error('AWS configuration failed. Please check your environment variables.');
  }
}

export default awsConfig;

// Export individual config sections for use in services
export const cognitoConfig = awsConfig.Auth.Cognito;
export const oauthConfig = awsConfig.Auth.Cognito.loginWith?.oauth;

// Export region for other AWS services
export const awsRegion = awsConfig.region;