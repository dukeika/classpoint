"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import DashboardShell from "../components/dashboard-shell";
import { portalNav } from "../components/navigation";
import { PortalAuthGate, PortalAuthProvider, usePortalAuth } from "../components/portal-auth";

function PortalAccessGate({ children }: { children: ReactNode }) {
  const { groups, loading } = usePortalAuth();
  const isParent = useMemo(
    () => groups.includes("PARENT") || groups.includes("STUDENT"),
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

  if (!isParent) {
    return (
      <section className="shell">
        <div className="card">
          <h2>Parent access required</h2>
          <p>Sign in with a parent or student account to access this section.</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <PortalAuthProvider>
      <PortalAccessGate>
        <DashboardShell sections={portalNav}>
          <PortalAuthGate>{children}</PortalAuthGate>
        </DashboardShell>
      </PortalAccessGate>
    </PortalAuthProvider>
  );
}
