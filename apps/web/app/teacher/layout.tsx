"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import DashboardShell from "../components/dashboard-shell";
import { teacherNav } from "../components/navigation";
import { StaffAuthGate, StaffAuthProvider, useStaffAuth } from "../components/staff-auth";

function TeacherAccessGate({ children }: { children: ReactNode }) {
  const { groups, loading } = useStaffAuth();
  const isTeacher = useMemo(
    () => groups.includes("TEACHER") || groups.includes("SCHOOL_ADMIN"),
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

  if (!isTeacher) {
    return (
      <section className="shell">
        <div className="card">
          <h2>Teacher access required</h2>
          <p>Sign in with a teacher account to access this section.</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      <TeacherAccessGate>
        <DashboardShell sections={teacherNav}>
          <StaffAuthGate>{children}</StaffAuthGate>
        </DashboardShell>
      </TeacherAccessGate>
    </StaffAuthProvider>
  );
}
