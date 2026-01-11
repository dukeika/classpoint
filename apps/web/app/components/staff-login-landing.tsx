"use client";

import { useEffect, useState } from "react";

type StaffLoginLandingProps = {
  isAppHost: boolean;
  rootDomain: string;
};

export default function StaffLoginLanding({ isAppHost, rootDomain }: StaffLoginLandingProps) {
  const [email, setEmail] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const appHost = `https://app.${rootDomain}`;
  const demoHost = `https://demo.${rootDomain}`;

  useEffect(() => {
    setHasToken(document.cookie.includes("cp.id_token="));
  }, []);

  if (isAppHost) {
    return (
      <main className="hq-landing">
        <header className="hq-nav">
          <div className="hq-logo">
            <span className="hq-mark">CP</span>
            <div>
              <strong>ClassPoint HQ</strong>
              <span>Leadership control room</span>
            </div>
          </div>
          <nav className="hq-links">
            <a href="/platform">Platform</a>
            <a href="/admin">Admin</a>
            <a href="/teacher">Teacher</a>
          </nav>
          <div className="hq-actions">
            <a className="ghost-button" href={demoHost}>
              Demo school site
            </a>
            <a className="button" href={`${appHost}/login?next=/platform`}>
              Sign in
            </a>
          </div>
        </header>

        <section className="hq-hero fade-up">
          <div>
            <span className="chip">ClassPoint HQ</span>
            <h1>Everything leadership needs, in one view.</h1>
            <p>
              Track collections, attendance, support, and staff activity across every campus
              without jumping between tools.
            </p>
            <div className="cta-row">
              <a className="button" href={`${appHost}/login?next=/platform`}>
                Open HQ dashboard
              </a>
              <a className="ghost-button" href={demoHost}>
                View demo school site
              </a>
            </div>
          </div>
          <div className="hq-hero-card">
            <h3>Today at a glance</h3>
            <ul>
              <li>
                <span>126</span>
                <span>Invoices issued in the last 7 days</span>
              </li>
              <li>
                <span>92%</span>
                <span>Fees collected on schedule</span>
              </li>
              <li>
                <span>34</span>
                <span>Teacher updates delivered</span>
              </li>
            </ul>
            {hasToken && <span className="badge">Signed in</span>}
          </div>
        </section>

        <section className="hq-metrics fade-up delay-1">
          <div>
            <strong>Billing control</strong>
            <span>Issue, track, and reconcile fees without spreadsheets.</span>
          </div>
          <div>
            <strong>Family communication</strong>
            <span>Send updates across invoices, messages, and announcements.</span>
          </div>
          <div>
            <strong>Performance signals</strong>
            <span>Spot attendance and revenue trends before they spread.</span>
          </div>
        </section>

        <section className="hq-grid">
          <article>
            <h3>Finance console</h3>
            <p>Manage fees, receipts, and reconciliations from one view.</p>
          </article>
          <article>
            <h3>Academic reporting</h3>
            <p>Capture results, publish report cards, and share performance insights.</p>
          </article>
          <article>
            <h3>Teacher workflows</h3>
            <p>Attendance, classes, and announcements stay aligned.</p>
          </article>
          <article>
            <h3>Parent communication</h3>
            <p>Announcements, calendars, and support requests in one place.</p>
          </article>
        </section>

        <section className="hq-steps">
          <div>
            <span>01</span>
            <h4>Sign in once</h4>
            <p>Access the HQ workspace with hosted, secure sign-in.</p>
          </div>
          <div>
            <span>02</span>
            <h4>Track collections</h4>
            <p>Monitor fees, receipts, and defaulters in real time.</p>
          </div>
          <div>
            <span>03</span>
            <h4>Coordinate teams</h4>
            <p>Keep staff aligned on attendance, results, and communication.</p>
          </div>
        </section>

        <section className="hq-quote">
          <div>
            <h2>“Collections became predictable after the first term.”</h2>
            <p className="muted">Finance lead, pilot campus</p>
          </div>
          <a className="button secondary" href={`${appHost}/login?next=/platform`}>
            Continue to login
          </a>
        </section>

        <footer className="hq-footer">
          <div>
            <strong>ClassPoint</strong>
            <span>HQ workspace for school leadership teams.</span>
          </div>
          <div>
            <span>Need help? support@classpoint.ng</span>
            <span>Built for modern school operations.</span>
          </div>
        </footer>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">ClassPoint</span>
            <h1>Sign in</h1>
            <p>
              {isAppHost
                ? "Use your staff credentials to access HQ tools."
                : "Use your staff credentials to access billing and messaging tools."}
            </p>
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
              <a className="button" href="/login?next=/admin">
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
