"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthSession = {
  authenticated: boolean;
  expiresAt?: number;
  claims?: {
    sub?: string;
    name?: string;
    email?: string;
    phone_number?: string;
    ["cognito:username"]?: string;
    ["cognito:groups"]?: string[];
    ["custom:schoolId"]?: string;
  };
};

type StaffAuthContextValue = {
  token: string;
  session: AuthSession | null;
  loading: boolean;
  schoolId: string;
  userId: string;
  groups: string[];
  displayName: string;
  email: string;
  isAuthenticated: boolean;
};

const StaffAuthContext = createContext<StaffAuthContextValue | null>(null);

export const useStaffAuth = () => {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error("useStaffAuth must be used within StaffAuthProvider");
  }
  return ctx;
};

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = (await res.json()) as AuthSession;
        if (active) {
          setSession(data);
        }
      } catch {
        if (active) {
          setSession({ authenticated: false });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const claims = session?.claims || {};
  const schoolId = claims["custom:schoolId"] || "";
  const userId = claims.sub || "";
  const groups = claims["cognito:groups"] || [];
  const displayName =
    claims.name || claims["cognito:username"] || claims.email || "Staff";
  const email = claims.email || "No email on file";
  const isAuthenticated = Boolean(session?.authenticated);
  const token = isAuthenticated ? "session" : "";

  const value = useMemo(
    () => ({
      token,
      session,
      loading,
      schoolId,
      userId,
      groups,
      displayName,
      email,
      isAuthenticated
    }),
    [token, session, loading, schoolId, userId, groups, displayName, email, isAuthenticated]
  );

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function StaffAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useStaffAuth();

  return (
    <>
      {!loading && !isAuthenticated && (
        <div className="card">
          <strong>Demo mode</strong>
          <p className="muted">
            You are viewing sample data. Sign in through the staff portal to connect live data.
          </p>
        </div>
      )}
      {children}
    </>
  );
}
