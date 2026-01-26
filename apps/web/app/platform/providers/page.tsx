export default function PlatformProvidersPage() {
  const payments = [
    { name: "Paystack", status: "Healthy", region: "NG", notes: "Default gateway" },
    { name: "Flutterwave", status: "Planned", region: "NG", notes: "Backup/alt" }
  ];
  const messaging = [
    { name: "WhatsApp API", status: "Configured", notes: "Primary channel" },
    { name: "Email (SES)", status: "Planned", notes: "Receipts/announcements" }
  ];
  return (
    <div className="platform-page">
      <section className="card">
        <div className="card-header">
          <h3>Payment providers</h3>
          <small className="muted">Global templates for gateways.</small>
        </div>
        <div className="list">
          {payments.map((p) => (
            <div key={p.name} className="line-item">
              <div>
                <strong>{p.name}</strong>
                <small className="muted">
                  {p.region} · {p.notes}
                </small>
              </div>
              <span className="status-pill">{p.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Messaging providers</h3>
          <small className="muted">WhatsApp/SMS/email health.</small>
        </div>
        <div className="list">
          {messaging.map((m) => (
            <div key={m.name} className="line-item">
              <div>
                <strong>{m.name}</strong>
                <small className="muted">{m.notes}</small>
              </div>
              <span className="status-pill">{m.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Defaults & failover</h3>
          <small className="muted">Region-aware defaults and fallback rules.</small>
        </div>
        <p className="muted">Coming soon: set primary/backup providers and health checks.</p>
      </section>
    </div>
  );
}
