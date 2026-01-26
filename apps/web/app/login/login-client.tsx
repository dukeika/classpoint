"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type LoginState = "idle" | "loading" | "error";

type SchoolOption = {
  id: string;
  name: string;
  host: string;
  description: string;
};

type Variant = "admin" | "portal";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";

const normalizeHost = (host: string) => host.split(":")[0].toLowerCase();

const isLocalhost = (host: string) => host === "localhost" || host.endsWith(".localhost");

const buildSchoolOptions = (host: string): SchoolOption[] => {
  if (isLocalhost(host)) {
    return [
      {
        id: "hq",
        name: "ClassPoint HQ",
        host: "app.localhost",
        description: "Platform dashboard"
      },
      {
        id: "demo",
        name: "Demo School",
        host: "demo.localhost",
        description: "School admin & teacher"
      }
    ];
  }

  return [
    {
      id: "hq",
      name: "ClassPoint HQ",
      host: `app.${ROOT_DOMAIN}`,
      description: "Platform dashboard"
    },
    {
      id: "demo",
      name: "Demo School",
      host: `demo.${ROOT_DOMAIN}`,
      description: "School admin & teacher"
    }
  ];
};

const defaultOptions: SchoolOption[] = [
  {
    id: "hq",
    name: "ClassPoint HQ",
    host: `app.${ROOT_DOMAIN}`,
    description: "Platform dashboard"
  },
  {
    id: "demo",
    name: "Demo School",
    host: `demo.${ROOT_DOMAIN}`,
    description: "School admin & teacher"
  }
];

type Props = {
  initialNext: string;
  initialEmail: string;
  initialSchool: string;
  initialVariant: Variant;
};

function LoginPageContent({ initialNext, initialEmail, initialSchool, initialVariant }: Props) {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || initialNext || "/";
  const safeNext = useMemo(() => {
    if (!nextParam.startsWith("/")) return "";
    return nextParam === "/" ? "" : nextParam;
  }, [nextParam]);
  const [variant, setVariant] = useState<Variant>(initialVariant);
  const [email, setEmail] = useState(initialEmail || searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>(defaultOptions);
  const [schoolHost, setSchoolHost] = useState(initialSchool || defaultOptions[0]?.host || "");
  const isAdminFlow = variant === "admin";
  const selectedSchool = useMemo(
    () => schoolOptions.find((option) => option.host === schoolHost),
    [schoolOptions, schoolHost]
  );

  useEffect(() => {
    const host = normalizeHost(window.location.hostname);
    const options = buildSchoolOptions(host);
    setSchoolOptions(options.length ? options : defaultOptions);

    const schoolParam = searchParams.get("school");
    const matching =
      options.find((option) => option.id === schoolParam || option.host === schoolParam) ||
      options.find((option) => option.host === host);
    setSchoolHost(matching?.host || options[0]?.host || defaultOptions[0]?.host || host);
  }, [searchParams]);

  useEffect(() => {
    const nextFromUrl = searchParams.get("next");
    const inferred =
      nextFromUrl && (nextFromUrl.startsWith("/admin") || nextFromUrl.startsWith("/platform"))
        ? "admin"
        : "portal";
    setVariant(inferred);
  }, [searchParams]);

  useEffect(() => {
    document.title = isAdminFlow ? "ClassPoint Admin Sign-in" : "ClassPoint Parent Portal";
  }, [isAdminFlow]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setState("loading");
    try {
      const currentHost = normalizeHost(window.location.hostname);
      const selectedHost = normalizeHost(schoolHost || currentHost);
      if (isLocalhost(currentHost) && selectedHost && selectedHost !== currentHost) {
        const params = new URLSearchParams();
        if (safeNext) params.set("next", safeNext);
        if (email.trim()) params.set("email", email.trim());
        params.set("school", selectedHost);
        const target = `${window.location.protocol}//${selectedHost}/login?${params.toString()}`;
        window.location.href = target;
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.trim(),
          password,
          next: safeNext,
          schoolHost: selectedHost
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Unable to sign in.");
        setState("error");
        return;
      }
      const fallbackByRole =
        isAdminFlow ? "/admin" : safeNext.startsWith("/teacher") ? "/teacher" : "/portal";
      window.location.href = data.redirectTo || safeNext || fallbackByRole;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setState("error");
    }
  };

  return (
    <main className={`login-page ${isAdminFlow ? "login-page-admin" : "login-page-portal"}`}>
      <section className={`login-shell ${isAdminFlow ? "login-admin" : "login-portal"}`}>
        <div className="login-panel">
          <div className="login-brand">
            <span className={`chip ${isAdminFlow ? "chip-admin" : "chip-portal"}`}>
              {isAdminFlow ? "Admin / Staff" : "Family Portal"}
            </span>
            <h1>{isAdminFlow ? "Sign in to HQ" : "Welcome back"}</h1>
            <p className="muted">
              {isAdminFlow
                ? "Access admin, billing, and operations dashboards."
                : "Parents and students can view fees, results, and messages here."}
            </p>
          </div>

          <form className="form-grid login-form" onSubmit={onSubmit}>
            <label>
              School
              <small className="muted">Choose your school (Demo School is ready to use).</small>
              <select
                value={schoolHost}
                onChange={(event) => setSchoolHost(event.target.value)}
                required
              >
                {schoolOptions.map((option) => (
                  <option key={option.id} value={option.host}>
                    {option.name} · {option.description}
                  </option>
                ))}
              </select>
            </label>
            {selectedSchool && (
              <div className="login-school-card">
                <div>
                  <strong>{selectedSchool.name}</strong>
                  <span className="muted">{selectedSchool.description}</span>
                </div>
                <span className="login-school-host">{selectedSchool.host}</span>
              </div>
            )}
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.edu.ng"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </label>
            {error && <div className="login-error">{error}</div>}
            <button className="button" type="submit" disabled={state === "loading"}>
              {state === "loading" ? "Signing in..." : isAdminFlow ? "Sign in to admin" : "Sign in"}
            </button>
            <div className="login-inline">
              <div>
                <small className="muted">
                  {isAdminFlow
                    ? "Staff access is invitation-only. Ask your super admin if you need access."
                    : "Need an account? Ask your school to invite you to the portal."}
                </small>
                <div className="muted">Having trouble? support@classpoint.ng</div>
              </div>
              {isAdminFlow ? (
                <a className="ghost-button" href="/login?next=/portal">
                  Switch to portal
                </a>
              ) : (
                <a className="ghost-button" href="/login?next=/admin">
                  Admin sign in
                </a>
              )}
            </div>
          </form>
        </div>

        <aside className={`login-aside ${isAdminFlow ? "login-aside-admin" : "login-aside-portal"}`}>
          <div className="login-aside-content">
            {isAdminFlow ? (
              <>
                <h2>Admin control</h2>
                <p>Run fees, messaging, and academics from one hub.</p>
                <div className="login-stats">
                  <div>
                    <strong>Realtime</strong>
                    <span>collections, receipts, audit trails</span>
                  </div>
                  <div>
                    <strong>Ops-ready</strong>
                    <span>roles, approvals, handoffs</span>
                  </div>
                  <div>
                    <strong>Insights</strong>
                    <span>fee gaps, engagement, attendance</span>
                  </div>
                </div>
                <ul className="login-list">
                  <li>Secure admin dashboard</li>
                  <li>Staff and bursar controls</li>
                  <li>Broadcasts and templates</li>
                  <li>Audit-friendly actions</li>
                </ul>
              </>
            ) : (
              <>
                <h2>Parent & student hub</h2>
                <p>Pay fees, view results, and stay connected with the school.</p>
                <div className="login-stats">
                  <div>
                    <strong>Instant</strong>
                    <span>invoices, receipts, balances</span>
                  </div>
                  <div>
                    <strong>Secure</strong>
                    <span>role-based access for families</span>
                  </div>
                  <div>
                    <strong>Connected</strong>
                    <span>messages, announcements, support</span>
                  </div>
                </div>
                <ul className="login-list">
                  <li>Pay online or upload proof</li>
                  <li>Results and report cards</li>
                  <li>Attendance snapshots</li>
                  <li>Support tickets and updates</li>
                </ul>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function LoginClient(props: Props) {
  return (
    <Suspense
      fallback={
        <main
          className={`login-page ${
            props.initialVariant === "admin" ? "login-page-admin" : "login-page-portal"
          }`}
        >
          <section
            className={`login-shell ${
              props.initialVariant === "admin" ? "login-admin" : "login-portal"
            }`}
          >
            <div className="login-panel">
              <div className="login-brand">
                <span
                  className={`chip ${
                    props.initialVariant === "admin" ? "chip-admin" : "chip-portal"
                  }`}
                >
                  {props.initialVariant === "admin" ? "Admin / Staff" : "Family Portal"}
                </span>
                <h1>{props.initialVariant === "admin" ? "Sign in to HQ" : "Welcome back"}</h1>
                <p className="muted">Loading login experience...</p>
              </div>
            </div>
            <aside
              className={`login-aside ${
                props.initialVariant === "admin" ? "login-aside-admin" : "login-aside-portal"
              }`}
            >
              <div className="login-aside-content">
                <h2>{props.initialVariant === "admin" ? "Admin control" : "Parent portal"}</h2>
                <p>Preparing secure sign-in.</p>
              </div>
            </aside>
          </section>
        </main>
      }
    >
      <LoginPageContent {...props} />
    </Suspense>
  );
}
