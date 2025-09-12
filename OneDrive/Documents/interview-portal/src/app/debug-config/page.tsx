"use client";

import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';

export default function DebugConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    // Get Amplify configuration
    const amplifyConfig = Amplify.getConfig();
    setConfig(amplifyConfig);

    // Get environment variables
    setEnvVars({
      NEXT_PUBLIC_AWS_USER_POOLS_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
      NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      NEXT_PUBLIC_AWS_COGNITO_REGION: process.env.NEXT_PUBLIC_AWS_COGNITO_REGION,
    });
  }, []);

  const testAuth = async () => {
    try {
      const { signIn } = await import('aws-amplify/auth');
      console.log('🔍 About to attempt sign in with:');
      console.log('- Email: dukeika@gmail.com');
      console.log('- User Pool ID from config:', config?.Auth?.Cognito?.userPoolId);
      console.log('- Client ID from config:', config?.Auth?.Cognito?.userPoolClientId);
      
      const result = await signIn({
        username: 'dukeika@gmail.com',
        password: 'lbifdfdfdX3'
      });
      console.log('✅ Sign in result:', result);
      alert('Login successful!');
    } catch (error) {
      console.error('❌ Sign in error:', error);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Authentication Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Amplify Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Expected Values</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User Pool ID:</strong> eu-west-2_FpwJJthe4</p>
            <p><strong>Client ID:</strong> 3juansb0jr3s3b8qouon7nr9gn</p>
            <p><strong>Region:</strong> eu-west-2</p>
            <p><strong>User:</strong> dukeika@gmail.com (CONFIRMED, in SuperAdmins group)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
          <button 
            onClick={testAuth}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Login with dukeika@gmail.com
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Check browser console for detailed logs
          </p>
        </div>
      </div>
    </div>
  );
}