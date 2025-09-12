"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <div>Access denied. Please log in.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="bg-green-50 p-4 rounded">
                <strong>Username:</strong> {user.username}
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <strong>Groups:</strong> {user.groups.join(", ") || "None"}
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <strong>Role:</strong> Super Administrator
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">🎉 Authentication Success!</h3>
            <p className="text-green-600 font-medium">
              ✅ You have successfully logged in as a Super Administrator!
            </p>
            <p className="text-gray-600 mt-2">
              The authentication system is now working correctly. You can access all admin features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}