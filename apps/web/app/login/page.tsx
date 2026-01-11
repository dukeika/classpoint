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

function LoginPageContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const safeNext = useMemo(() => {
    if (!nextPath.startsWith("/")) return "";
    return nextPath === "/" ? "" : nextPath;
  }, [nextPath]);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");
  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>(defaultOptions);
  const [schoolHost, setSchoolHost] = useState(defaultOptions[0]?.host || "");
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
      window.location.href = data.redirectTo || safeNext || "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setState("error");
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-panel">
          <div className="login-brand">
            <span className="chip">ClassPoint</span>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to manage billing, messaging, and daily operations.</p>
          </div>

          <form className="form-grid login-form" onSubmit={onSubmit}>
            <label>
              School
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
              {state === "loading" ? "Signing in..." : "Sign in"}
            </button>
            <div className="login-inline">
              <small className="muted">Need access? Ask your school admin to invite you.</small>
              <a className="ghost-button" href={`https://app.${ROOT_DOMAIN}`}>
                Visit HQ
              </a>
            </div>
          </form>
        </div>

        <aside className="login-aside">
          <div className="login-aside-content">
            <h2>ClassPoint OS</h2>
            <p>
              The operating system for school fees, parent communication, and academic reporting.
            </p>
            <div className="login-stats">
              <div>
                <strong>30%</strong>
                <span>faster fee collection</span>
              </div>
              <div>
                <strong>2x</strong>
                <span>parent response rate</span>
              </div>
              <div>
                <strong>1 day</strong>
                <span>setup to go-live</span>
              </div>
            </div>
            <ul className="login-list">
              <li>Instant invoices and receipts</li>
              <li>WhatsApp-first reminders</li>
              <li>Attendance and results in one place</li>
              <li>Role-based visibility for every staff member</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-page">
          <section className="login-shell">
            <div className="login-panel">
              <div className="login-brand">
                <span className="chip">ClassPoint</span>
                <h1>Welcome back</h1>
                <p className="muted">Loading login experience...</p>
              </div>
            </div>
            <aside className="login-aside">
              <div className="login-aside-content">
                <h2>ClassPoint OS</h2>
                <p>Preparing secure sign-in.</p>
              </div>
            </aside>
          </section>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
