// File: src/app/company/layout.tsx
"use client";

import { useRoleProtection } from "@/lib/auth/route-protection";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useRoleProtection(["company_admin"]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-abhh-teal-600"></div>
      </div>
    );
  }

  if (!user || (userRole && !["company_admin"].includes(userRole))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Unauthorized</h1>
          <p className="text-gray-600 mt-2">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="mt-4 px-4 py-2 bg-abhh-teal-600 text-white rounded hover:bg-abhh-teal-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
