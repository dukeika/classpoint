const devices = ["MacBook Pro · Lagos", "iPhone 13 · Lagos", "Chrome · Abuja"];

export default function ProfileSecurityPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Account</div>
          <h1>Security</h1>
          <p className="muted">Protect access to your ClassPoint account.</p>
        </div>
        <a className="button" href="/profile/preferences">
          Preferences
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Login protection</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Multi-factor authentication</strong>
                <small>Use SMS or authenticator app for login.</small>
              </div>
              <span className="status-pill">Enabled</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Password</strong>
                <small>Last updated 3 months ago.</small>
              </div>
              <button className="ghost-button" type="button">
                Change
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Trusted devices</h3>
          <div className="list">
            {devices.map((device) => (
              <div key={device} className="line-item">
                <span>{device}</span>
                <button className="ghost-button" type="button">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
