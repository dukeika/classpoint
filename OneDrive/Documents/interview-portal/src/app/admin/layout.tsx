// File: src/app/admin/layout.tsx
"use client";

import { useRoleProtection } from "@/lib/auth/route-protection";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useRoleProtection(["super_admin"]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-abhh-teal-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-abhh-yellow-500 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-abhh animate-pulse">
            <div className="w-8 h-8 border-2 border-abhh-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-abhh-teal-600 font-medium">
            Loading ABHH Platform...
          </p>
        </div>
      </div>
    );
  }

  if (!user || (userRole && !["super_admin"].includes(userRole))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-abhh-teal-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unauthorized Access
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access the Super Admin panel.
          </p>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="px-6 py-3 bg-abhh-teal-600 text-white rounded-lg hover:bg-abhh-teal-700 transition-colors shadow-abhh"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
