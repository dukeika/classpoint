"use client";

import type { ReactNode } from "react";
import DashboardShell from "../components/dashboard-shell";
import { globalNav } from "../components/navigation";
import { StaffAuthGate, StaffAuthProvider } from "../components/staff-auth";

export default function GlobalLayout({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      <DashboardShell sections={globalNav}>
        <StaffAuthGate>{children}</StaffAuthGate>
      </DashboardShell>
    </StaffAuthProvider>
  );
}
