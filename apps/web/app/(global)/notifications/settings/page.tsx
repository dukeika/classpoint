const channels = [
  { title: "Payments & receipts", detail: "Payment confirmations, receipts, reversals." },
  { title: "Attendance & results", detail: "Pending attendance, score entry deadlines." },
  { title: "System updates", detail: "Maintenance windows and platform updates." }
];

export default function NotificationsSettingsPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Notifications</div>
          <h1>Notification settings</h1>
          <p className="muted">Control which alerts show in your dashboard.</p>
        </div>
        <a className="button" href="/notifications">
          Back to notifications
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Delivery</h3>
          <div className="list">
            <label className="line-item">
              <span>Email alerts</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="line-item">
              <span>SMS alerts</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="line-item">
              <span>In-app badges</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </div>
        <div className="card">
          <h3>Alert types</h3>
          <div className="list">
            {channels.map((item) => (
              <label key={item.title} className="line-item">
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <input type="checkbox" defaultChecked />
              </label>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
