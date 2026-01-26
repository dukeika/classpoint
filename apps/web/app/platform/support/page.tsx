export default function PlatformSupportPage() {
  const tickets = [
    { id: "SUP-102", school: "Demo Academy", status: "Open", summary: "Invoice mismatch", age: "2h" },
    { id: "SUP-101", school: "Lakeview College", status: "Investigating", summary: "Webhook retries", age: "6h" },
    { id: "SUP-099", school: "Harbor Heights", status: "Resolved", summary: "Login redirect", age: "1d" }
  ];
  return (
    <div className="platform-page">
      <section className="card">
        <div className="card-header">
          <h3>Support tickets</h3>
          <small className="muted">Platform-level support and announcements.</small>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>School</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.school}</td>
                  <td>
                    <span className="status-pill">{t.status}</span>
                  </td>
                  <td>{t.summary}</td>
                  <td className="muted">{t.age}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Announcements</h3>
          <small className="muted">Platform-wide maintenance notices.</small>
        </div>
        <div className="list">
          <div className="line-item">
            <div>
              <strong>Upcoming maintenance</strong>
              <small className="muted">Schedule notices across all schools.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Impersonation (view-only)</h3>
          <small className="muted">Audit-safe view to troubleshoot school issues.</small>
        </div>
        <p className="muted">Coming soon: request view-only impersonation with audit logging.</p>
      </section>
    </div>
  );
}
