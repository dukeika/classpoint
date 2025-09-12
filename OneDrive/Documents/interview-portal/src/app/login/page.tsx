"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Load debug info on component mount
    const loadDebugInfo = async () => {
      try {
        const { Amplify } = await import('aws-amplify');
        const config = Amplify.getConfig();
        setDebugInfo({
          amplifyConfig: {
            userPoolId: config?.Auth?.Cognito?.userPoolId,
            userPoolClientId: config?.Auth?.Cognito?.userPoolClientId,
            region: config?.Auth?.Cognito?.userPoolRegion || config?.aws_project_region,
          },
          envVars: {
            NEXT_PUBLIC_AWS_USER_POOLS_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
            NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
            NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
          }
        });
      } catch (error) {
        console.error('Failed to load debug info:', error);
      }
    };
    loadDebugInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Debug: Log Amplify configuration before attempting login
      const { Amplify } = await import('aws-amplify');
      const config = Amplify.getConfig();
      console.log('🔍 Current Amplify Config:', {
        userPoolId: config?.Auth?.Cognito?.userPoolId,
        userPoolClientId: config?.Auth?.Cognito?.userPoolClientId,
        region: config?.Auth?.Cognito?.userPoolRegion || config?.aws_project_region,
      });
      
      console.log('🔍 Environment Variables:', {
        NEXT_PUBLIC_AWS_USER_POOLS_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
        NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
        NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
      });
      
      console.log('🔐 Attempting login for:', email);
      
      await signIn(email, password);
      // Redirect is handled in AuthContext after successful login
    } catch (error: any) {
      console.error("❌ Login error details:", error);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ProRecruit Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Super Admin Test Account:</p>
          <p>Email: dukeika@gmail.com</p>
          <p className="text-xs text-gray-500">Password: lbifdfdfdX3</p>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded text-xs">
            <h3 className="font-semibold mb-2">🔍 Debug Info (Check Console for Logs)</h3>
            <div className="space-y-2">
              <div>
                <strong>Expected:</strong> User Pool: eu-west-2_FpwJJthe4, Client: 3juansb0jr3s3b8qouon7nr9gn
              </div>
              <div>
                <strong>Amplify Config:</strong> 
                Pool: {debugInfo.amplifyConfig?.userPoolId || 'undefined'}, 
                Client: {debugInfo.amplifyConfig?.userPoolClientId || 'undefined'}
              </div>
              <div>
                <strong>Env Vars:</strong> 
                Pool: {debugInfo.envVars?.NEXT_PUBLIC_AWS_USER_POOLS_ID || 'undefined'}, 
                Client: {debugInfo.envVars?.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID || 'undefined'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}