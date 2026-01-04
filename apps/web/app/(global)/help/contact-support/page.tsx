const reasons = [
  "Billing and subscriptions",
  "Payments and receipts",
  "Attendance or results",
  "Data imports",
  "Other"
];

export default function ContactSupportPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Support</div>
          <h1>Contact support</h1>
          <p className="muted">Tell us what you need and we will respond quickly.</p>
        </div>
        <a className="button" href="/help">
          Back to Help Center
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Support request</h3>
          <div className="form-grid">
            <input placeholder="Subject" defaultValue="Need help with defaulter reminders" />
            <select defaultValue={reasons[0]}>
              {reasons.map((reason) => (
                <option key={reason}>{reason}</option>
              ))}
            </select>
            <textarea rows={5} placeholder="Describe the issue or request." defaultValue=""/>
            <button className="button" type="button">
              Submit request
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Support channels</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>WhatsApp</strong>
                <small>+234 800 000 0000</small>
              </div>
              <span className="status-pill">Fastest</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Email</strong>
                <small>support@classpoint.ng</small>
              </div>
              <span className="status-pill">24 hrs</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Phone</strong>
                <small>+234 700 123 4567</small>
              </div>
              <span className="status-pill">Business hours</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

