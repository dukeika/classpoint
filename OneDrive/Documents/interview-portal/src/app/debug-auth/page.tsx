"use client";

import { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import awsExports from "@/aws-exports";

export default function DebugAuthPage() {
  const [config, setConfig] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugAuth = async () => {
      try {
        Amplify.configure(awsExports);
        const currentConfig = Amplify.getConfig();
        setConfig(currentConfig);

        const { getCurrentUser } = await import("aws-amplify/auth");
        try {
          const user = await getCurrentUser();
          setTestResult({ success: true, user, message: "User is logged in" });
        } catch (error: any) {
          setTestResult({ success: false, error: error.message, message: "No user logged in" });
        }
      } catch (error: any) {
        setTestResult({ success: false, error: error.message, message: "Configuration error" });
      }
      setLoading(false);
    };

    debugAuth();
  }, []);

  const testLogin = async () => {
    try {
      const { signIn } = await import("aws-amplify/auth");
      console.log("🧪 Testing login with dukeika@gmail.com...");
      
      const result = await signIn({
        username: "dukeika@gmail.com",
        password: "ProRecruit123\!"
      });
      
      console.log("✅ Login test result:", result);
      setTestResult({ success: true, result, message: "Login successful\!" });
    } catch (error: any) {
      console.error("❌ Login test failed:", error);
      setTestResult({ 
        success: false, 
        error: error.message, 
        code: error.name,
        message: "Login failed",
        details: error
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug information...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔧 Authentication Debug Center</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🌍 Environment Variables</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono">
              <p><strong>REGION:</strong> {process.env.NEXT_PUBLIC_AWS_REGION || "undefined"}</p>
              <p><strong>USER_POOLS_ID:</strong> {process.env.NEXT_PUBLIC_AWS_USER_POOLS_ID || "undefined"}</p>
              <p><strong>CLIENT_ID:</strong> {process.env.NEXT_PUBLIC_AWS_USER_POOLS_WEB_CLIENT_ID || "undefined"}</p>
              <p><strong>GRAPHQL_ENDPOINT:</strong> {process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT?.substring(0, 50) + "..." || "undefined"}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Active Amplify Config</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-64 overflow-auto">
              {config ? (
                <>
                  <p><strong>User Pool ID:</strong> {config.Auth?.Cognito?.userPoolId || "N/A"}</p>
                  <p><strong>Client ID:</strong> {config.Auth?.Cognito?.userPoolClientId || "N/A"}</p>
                  <p><strong>GraphQL Endpoint:</strong> {config.API?.GraphQL?.endpoint || "N/A"}</p>
                </>
              ) : (
                <p>Config not loaded</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">✅ Expected Configuration</h2>
            <div className="bg-green-50 p-4 rounded text-sm">
              <p><strong>User Pool ID:</strong> eu-west-2_FpwJJthe4</p>
              <p><strong>Client ID:</strong> 3juansb0jr3s3b8qouon7nr9gn</p>
              <p><strong>Region:</strong> eu-west-2</p>
              <p><strong>Account:</strong> 624914081304</p>
              <p><strong>User:</strong> dukeika@gmail.com (CONFIRMED)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Authentication Test</h2>
            <button 
              onClick={testLogin}
              className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Test Login (dukeika@gmail.com)
            </button>
            
            {testResult && (
              <div className={`p-4 rounded text-sm ${testResult.success ? "bg-green-100" : "bg-red-100"}`}>
                <p><strong>Status:</strong> {testResult.success ? "✅ SUCCESS" : "❌ FAILED"}</p>
                <p><strong>Message:</strong> {testResult.message}</p>
                {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
                {testResult.code && <p><strong>Code:</strong> {testResult.code}</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
