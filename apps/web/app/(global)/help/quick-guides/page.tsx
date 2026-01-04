const guides = [
  {
    title: "Set up a new term",
    detail: "Create sessions, terms, and class groups in under 15 minutes."
  },
  {
    title: "Import students and parents",
    detail: "Upload CSV files and fix duplicates with the import review flow."
  },
  {
    title: "Generate term invoices",
    detail: "Create fee schedules, preview breakdowns, and generate invoices."
  },
  {
    title: "Send defaulter reminders",
    detail: "Target classes or parents with outstanding balances."
  }
];

export default function QuickGuidesPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Support</div>
          <h1>Quick guides</h1>
          <p className="muted">Step-by-step help for the most common workflows.</p>
        </div>
        <a className="button" href="/help/contact-support">
          Contact support
        </a>
      </div>

      <div className="card">
        <h3>Guides</h3>
        <div className="list-cards">
          {guides.map((guide) => (
            <div key={guide.title} className="list-card">
              <strong>{guide.title}</strong>
              <span>{guide.detail}</span>
              <span>Estimated time: 10 mins</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
