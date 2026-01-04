export default function SettingsPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Settings</div>
          <h1>School settings</h1>
          <p className="muted">Manage profile, branding, provider configs, and audits.</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Branding</h3>
          <p className="muted">Update logo, colors, and public page visuals.</p>
          <a className="button" href="/admin/branding">
            Update branding
          </a>
        </div>
        <div className="card">
          <h3>Provider configs</h3>
          <p className="muted">Set payment, messaging, and integration keys.</p>
          <a className="button" href="/admin/settings/providers">
            Manage providers
          </a>
        </div>
        <div className="card">
          <h3>Plan catalog</h3>
          <p className="muted">App admins define subscription plans and add-ons.</p>
          <a className="button" href="/admin/settings/catalog">
            Open catalog
          </a>
        </div>
        <div className="card">
          <h3>Audit log</h3>
          <p className="muted">Review sensitive actions across fees, roles, and results.</p>
          <a className="button" href="/admin/settings/audit">
            View audit log
          </a>
        </div>
      </div>
    </main>
  );
}
