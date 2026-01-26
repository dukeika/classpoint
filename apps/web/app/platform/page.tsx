export default function PlatformPage() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";
  const demoAdminUrl = `https://demo.${rootDomain}/login?next=/admin`;
  const appLoginUrl = `https://app.${rootDomain}/login?next=/platform`;

  return (
    <main className="dashboard-page platform-page">
      <section className="platform-banner">
        <div className="platform-banner-content">
          <div className="breadcrumb">Platform / HQ overview</div>
          <h1>ClassPoint HQ Console</h1>
          <p className="muted">
            Track activation, collections, and comms performance across every school.
          </p>
          <div className="hero-meta">
            <span className="status-pill status-in_progress">Dev environment</span>
            <span className="hero-note">Last sync: moments ago</span>
          </div>
          <div className="platform-banner-actions">
            <a className="button primary" href={appLoginUrl}>
              Open HQ dashboard
            </a>
            <a className="button secondary" href={demoAdminUrl}>
              View a school admin site
            </a>
          </div>
        </div>
        <div className="platform-banner-card">
          <div>
            <small className="muted">Platform pulse</small>
            <h2>Stable</h2>
          </div>
          <div className="platform-banner-grid">
            <div>
              <strong>98.1%</strong>
              <span>Message delivery</span>
            </div>
            <div>
              <strong>1.8s</strong>
              <span>API response time</span>
            </div>
            <div>
              <strong>4</strong>
              <span>Open incidents</span>
            </div>
          </div>
        </div>
      </section>

      <section className="platform-kpis">
        <div className="platform-kpi">
          <span>Active schools</span>
          <strong>12</strong>
          <small className="muted">+2 onboarding this week</small>
        </div>
        <div className="platform-kpi">
          <span>Payment volume</span>
          <strong>NGN 9.4m</strong>
          <small className="muted">Term-to-date</small>
        </div>
        <div className="platform-kpi">
          <span>Messaging success</span>
          <strong>98.1%</strong>
          <small className="muted">Last 24 hours</small>
        </div>
        <div className="platform-kpi">
          <span>Open support</span>
          <strong>7</strong>
          <small className="muted">2 urgent</small>
        </div>
      </section>

      <section className="platform-rail">
        <div className="card platform-rail-card">
          <div className="card-header">
            <h3>Onboarding pipeline</h3>
            <small className="muted">Keep schools moving from invite to launch.</small>
          </div>
          <div className="platform-rail-list">
            <div>
              <strong>2 schools pending activation</strong>
              <span className="muted">Awaiting branding approval.</span>
            </div>
            <div>
              <strong>4 schools in data import</strong>
              <span className="muted">Student records in review.</span>
            </div>
            <div>
              <strong>6 schools fully live</strong>
              <span className="muted">Parents engaging weekly.</span>
            </div>
          </div>
        </div>

        <div className="card platform-rail-card highlight">
          <div className="card-header">
            <h3>Action center</h3>
            <small className="muted">Today’s priorities for HQ ops.</small>
          </div>
          <ul className="platform-list">
            <li>
              <strong>1 payment webhook retry</strong>
              <span className="muted">Reprocess provider callbacks.</span>
            </li>
            <li>
              <strong>7 open support tickets</strong>
              <span className="muted">Prioritize billing disputes.</span>
            </li>
            <li>
              <strong>3 staff invites pending</strong>
              <span className="muted">Follow up with new admins.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="platform-activity">
        <div className="card platform-activity-card">
          <div className="card-header">
            <h3>Recent platform activity</h3>
            <small className="muted">Latest actions across schools.</small>
          </div>
          <div className="platform-activity-list">
            <div className="platform-activity-item">
              <span className="platform-pill">Payments</span>
              <div>
                <strong>Lakeview College sent 48 invoices</strong>
                <span className="muted">10 minutes ago</span>
              </div>
            </div>
            <div className="platform-activity-item">
              <span className="platform-pill">Messaging</span>
              <div>
                <strong>Term reminder delivered to 1,240 parents</strong>
                <span className="muted">32 minutes ago</span>
              </div>
            </div>
            <div className="platform-activity-item">
              <span className="platform-pill">Support</span>
              <div>
                <strong>New billing dispute ticket opened</strong>
                <span className="muted">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
