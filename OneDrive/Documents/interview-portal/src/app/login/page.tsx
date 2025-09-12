"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface DebugInfo {
  amplifyConfig: {
    userPoolId?: string;
    userPoolClientId?: string;
    region?: string;
  };
  envVars: {
    NEXT_PUBLIC_AWS_USER_POOLS_ID?: string;
    NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID?: string;
    NEXT_PUBLIC_AWS_REGION?: string;
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("dukeika@gmail.com");
  const [password, setPassword] = useState("lbifdfdfdX3");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const { Amplify } = await import('aws-amplify');
        const config = Amplify.getConfig();
        
        const debugData: DebugInfo = {
          amplifyConfig: {
            userPoolId: config?.Auth?.Cognito?.userPoolId,
            userPoolClientId: config?.Auth?.Cognito?.userPoolClientId,
            region: config?.Auth?.Cognito?.userPoolId?.split('_')[0],
          },
          envVars: {
            NEXT_PUBLIC_AWS_USER_POOLS_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID,
            NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID,
            NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
          }
        };
        
        setDebugInfo(debugData);
        
        // Log to console immediately
        console.log('🔍 Debug Info Loaded:', debugData);
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
      // Log debug info before login attempt
      console.log('🔐 LOGIN ATTEMPT STARTING');
      console.log('📧 Email:', email);
      console.log('🔍 Expected User Pool: eu-west-2_FpwJJthe4');
      console.log('🔍 Expected Client: 3juansb0jr3s3b8qouon7nr9gn');
      
      if (debugInfo) {
        console.log('🔧 Current Amplify Config:', debugInfo.amplifyConfig);
        console.log('🌍 Environment Variables:', debugInfo.envVars);
      }
      
      await signIn(email, password);
      console.log('✅ Login successful!');
      
    } catch (error: unknown) {
      console.error("❌ LOGIN FAILED:");
      console.error("❌ Full error object:", error);
      
      if (error instanceof Error) {
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        setError(error.message);
      } else {
        console.error("❌ Unknown error type:", typeof error);
        setError("Login failed. Please check console for details.");
      }
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
              <strong>Error:</strong> {error}
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
        
        {/* Test Credentials */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <h3 className="font-semibold text-blue-800 mb-2">🧪 Test Credentials:</h3>
          <p><strong>Email:</strong> dukeika@gmail.com</p>
          <p><strong>Password:</strong> lbifdfdfdX3</p>
          <p className="text-xs text-blue-600 mt-2">User is confirmed and in SuperAdmins group</p>
        </div>

        {/* Debug Information */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded text-xs">
          <h3 className="font-semibold text-gray-800 mb-3">🔍 Configuration Debug Info</h3>
          
          <div className="space-y-3">
            <div className="p-2 bg-green-100 rounded">
              <strong className="text-green-800">✅ Expected Configuration:</strong>
              <div className="mt-1 font-mono text-green-700">
                <div>User Pool: eu-west-2_FpwJJthe4</div>
                <div>Client: 3juansb0jr3s3b8qouon7nr9gn</div>
                <div>Region: eu-west-2</div>
              </div>
            </div>
            
            {debugInfo && (
              <>
                <div className="p-2 bg-blue-100 rounded">
                  <strong className="text-blue-800">🔧 Current Amplify Config:</strong>
                  <div className="mt-1 font-mono text-blue-700">
                    <div>User Pool: {debugInfo.amplifyConfig?.userPoolId || 'undefined'}</div>
                    <div>Client: {debugInfo.amplifyConfig?.userPoolClientId || 'undefined'}</div>
                    <div>Region: {debugInfo.amplifyConfig?.region || 'undefined'}</div>
                  </div>
                </div>
                
                <div className="p-2 bg-purple-100 rounded">
                  <strong className="text-purple-800">🌍 Environment Variables:</strong>
                  <div className="mt-1 font-mono text-purple-700">
                    <div>USER_POOLS_ID: {debugInfo.envVars?.NEXT_PUBLIC_AWS_USER_POOLS_ID || 'undefined'}</div>
                    <div>CLIENT_ID: {debugInfo.envVars?.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID || 'undefined'}</div>
                    <div>REGION: {debugInfo.envVars?.NEXT_PUBLIC_AWS_REGION || 'undefined'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-300">
            <p className="text-gray-600">
              📋 <strong>Check browser console for detailed logs</strong>
            </p>
            <p className="text-gray-600">
              🎯 Compare Expected vs Current to identify issues
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}