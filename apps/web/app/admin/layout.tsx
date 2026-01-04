"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import DashboardShell from "../components/dashboard-shell";
import { adminNav } from "../components/navigation";
import { StaffAuthGate, StaffAuthProvider, useStaffAuth } from "../components/staff-auth";

function AdminAccessGate({ children }: { children: ReactNode }) {
  const { groups, loading } = useStaffAuth();
  const isAdmin = useMemo(
    () => groups.includes("APP_ADMIN") || groups.includes("SCHOOL_ADMIN"),
    [groups]
  );

  if (loading) {
    return (
      <section className="shell">
        <div className="card">
          <h2>Checking access...</h2>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="shell">
        <div className="card">
          <h2>Admin access required</h2>
          <p>Sign in with an admin account to access this section.</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      <AdminAccessGate>
        <DashboardShell sections={adminNav}>
          <StaffAuthGate>{children}</StaffAuthGate>
        </DashboardShell>
      </AdminAccessGate>
    </StaffAuthProvider>
  );
}
