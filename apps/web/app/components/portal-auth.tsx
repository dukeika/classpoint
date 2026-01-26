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

type PortalAuthContextValue = {
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

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

export const usePortalAuth = () => {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) {
    throw new Error("usePortalAuth must be used within PortalAuthProvider");
  }
  return ctx;
};

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [derivedSchoolId, setDerivedSchoolId] = useState("");

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
  const schoolId = claims["custom:schoolId"] || derivedSchoolId || "";
  const userId = claims.sub || "";
  const groups = claims["cognito:groups"] || [];
  const displayName =
    claims.name || claims["cognito:username"] || claims.email || "User";
  const email = claims.email || "No email on file";
  const isAuthenticated = Boolean(session?.authenticated);
  const token = isAuthenticated ? "session" : "";

  useEffect(() => {
    if (!isAuthenticated || schoolId || typeof window === "undefined") return;
    const host = window.location.hostname.split(":")[0];
    const root = ".classpoint.ng";
    if (!host.endsWith(root)) return;
    const slug = host.slice(0, -root.length);
    if (!slug) return;
    if (slug === "demo-school" || slug === "demo") {
      setDerivedSchoolId("sch_lagos_demo_001");
      return;
    }
    let active = true;
    const lookupSchool = async () => {
      try {
        const res = await fetch("/api/public-graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query SchoolBySlug($slug: String!) { schoolBySlug(slug: $slug) { id } }`,
            variables: { slug }
          })
        });
        const payload = (await res.json()) as { data?: { schoolBySlug?: { id?: string } } };
        const id = payload?.data?.schoolBySlug?.id || "";
        if (active && id) {
          setDerivedSchoolId(id);
        }
      } catch {
        // Ignore lookup failures for demo sessions without school claims.
      }
    };
    lookupSchool();
    return () => {
      active = false;
    };
  }, [isAuthenticated, schoolId]);

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

  return <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>;
}

export function PortalAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, displayName } = usePortalAuth();

  return (
    <>
      {!loading && !isAuthenticated && (
        <div className="card">
          <strong>Demo mode</strong>
          <p className="muted">Sign in through the parent portal to connect live data.</p>
        </div>
      )}
      {!loading && isAuthenticated && (
        <div className="card muted compact-card">
          <strong>Welcome {displayName}</strong>
          <p className="muted">You’re signed in. Choose a section to continue.</p>
        </div>
      )}
      {children}
    </>
  );
}
