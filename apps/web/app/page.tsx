"use client";

import { useEffect, useMemo, useState } from "react";
import PublicSchoolPage from "./components/public-school-page";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";

const getSchoolSlugFromHost = (host: string) => {
  const normalized = host.toLowerCase();
  if (normalized === "localhost") return null;
  if (normalized.endsWith(".localhost")) {
    const slug = normalized.replace(".localhost", "");
    return slug || null;
  }
  if (normalized === rootDomain || normalized === `app.${rootDomain}` || normalized === `www.${rootDomain}`) {
    return null;
  }
  if (normalized.endsWith(`.${rootDomain}`)) {
    return normalized.slice(0, -(rootDomain.length + 1));
  }
  return null;
};

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const slug = getSchoolSlugFromHost(window.location.hostname);
    setPublicSlug(slug);
  }, []);

  useEffect(() => {
    setHasToken(document.cookie.includes("cp.id_token="));
  }, []);

  const mode = useMemo(() => (publicSlug ? "school" : "staff"), [publicSlug]);

  if (mode === "school" && publicSlug) {
    return <PublicSchoolPage slug={publicSlug} />;
  }

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">ClassPoint</span>
            <h1>Sign in</h1>
            <p>Use your staff credentials to access billing and messaging tools.</p>
          </div>
          {hasToken && <span className="badge">Signed in</span>}
        </div>

        <div className="grid fade-up delay-1">
          <div className="card">
            <h3>Staff login</h3>
            <form className="form-grid">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled
              />
              <input
                type="password"
                placeholder="Password (use Hosted UI)"
                autoComplete="current-password"
                disabled
              />
              <a className="button" href="/auth/login?next=/admin">
                Sign in with ClassPoint
              </a>
            </form>
          </div>

          <div className="card">
            <h3>Invoice review</h3>
            <p>Parents can open invoice links directly once access is enabled.</p>
            <p>
              Example: <a href="/invoices/INV-0001">/invoices/INV-0001</a>
            </p>
          </div>
          <div className="card">
            <h3>School landing page</h3>
            <p>Preview a school homepage by slug once branding is configured.</p>
            <p>Example: demo-school.{rootDomain}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

