"use client";

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import awsExports from '@/aws-exports';

export default function DebugConfigPage() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Configure Amplify
    Amplify.configure(awsExports);
    
    // Get the current configuration
    const currentConfig = Amplify.getConfig();
    setConfig(currentConfig);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">🔧 ProRecruit Configuration Debug</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <p><strong>NEXT_PUBLIC_AWS_REGION:</strong> {process.env.NEXT_PUBLIC_AWS_REGION || 'undefined'}</p>
              <p><strong>NEXT_PUBLIC_AWS_USER_POOLS_ID:</strong> {process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID || 'undefined'}</p>
              <p><strong>NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID || 'undefined'}</p>
              <p><strong>NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT:</strong> {process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT || 'undefined'}</p>
              <p><strong>NEXT_PUBLIC_AWS_APPSYNC_API_KEY:</strong> {process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY?.substring(0, 10) + '...' || 'undefined'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">AWS Exports Configuration</h2>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <p><strong>Region:</strong> {awsExports.aws_project_region}</p>
              <p><strong>User Pool ID:</strong> {awsExports.aws_user_pools_id}</p>
              <p><strong>Client ID:</strong> {awsExports.aws_user_pools_web_client_id}</p>
              <p><strong>GraphQL Endpoint:</strong> {awsExports.aws_appsync_graphqlEndpoint}</p>
              <p><strong>Auth Type:</strong> {awsExports.aws_appsync_authenticationType}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Current Amplify Configuration</h2>
            <div className="bg-gray-100 p-4 rounded text-sm max-h-96 overflow-auto">
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800">🎯 Expected Configuration</h3>
            <p className="text-blue-700 text-sm mt-2">
              For the super admin login to work, we need:
            </p>
            <ul className="text-blue-700 text-sm mt-1 list-disc list-inside">
              <li>User Pool ID: <code>eu-west-2_FpwJJthe4</code></li>
              <li>Region: <code>eu-west-2</code></li>
              <li>User exists in SuperAdmins group</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}