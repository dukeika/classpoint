import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-west-1_n0Ij4uUuB',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID || '742a4q83obkfejdod7d1retvep'
    }
  }
};

// Configure Amplify
if (typeof window !== 'undefined') {
  Amplify.configure(awsConfig);
}

export default awsConfig;