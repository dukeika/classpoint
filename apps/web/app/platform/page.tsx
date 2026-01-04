export default function PlatformPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header modern-header">
        <div>
          <div className="breadcrumb">Platform / Overview</div>
          <h1>HQ Platform Console</h1>
          <p className="muted">Central tools for onboarding schools, plans, and support.</p>
        </div>
        <a className="button primary" href="/auth/login?next=/platform">
          Sign in
        </a>
      </div>

      <section className="card">
        <div className="card-header">
          <h3>Coming next</h3>
          <small className="muted">Platform features are being rolled out in phases.</small>
        </div>
        <div className="quick-actions-grid">
          <span className="quick-action">Schools</span>
          <span className="quick-action">Plans &amp; add-ons</span>
          <span className="quick-action">Providers</span>
          <span className="quick-action">Support tickets</span>
          <span className="quick-action">Audit log</span>
        </div>
      </section>
    </main>
  );
}
