export default function ProfilePreferencesPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Account</div>
          <h1>Preferences</h1>
          <p className="muted">Personalize your dashboard experience.</p>
        </div>
        <a className="button" href="/profile">
          Back to profile
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Appearance</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Theme</strong>
                <small>Choose light or dark theme.</small>
              </div>
              <select defaultValue="Light">
                <option>Light</option>
                <option>Dark</option>
                <option>Auto</option>
              </select>
            </div>
            <div className="line-item">
              <div>
                <strong>Sidebar density</strong>
                <small>Compact mode makes navigation slimmer.</small>
              </div>
              <select defaultValue="Comfortable">
                <option>Comfortable</option>
                <option>Compact</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Language</h3>
          <div className="form-grid">
            <select defaultValue="English (Nigeria)">
              <option>English (Nigeria)</option>
              <option>English (UK)</option>
              <option>French</option>
            </select>
            <button className="button" type="button">
              Save preferences
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

