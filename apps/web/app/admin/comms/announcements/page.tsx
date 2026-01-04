export default function AnnouncementsPage() {
  const announcements = [
    { id: "an-1", title: "PTA Meeting", audience: "All parents", status: "Published", date: "20 Dec" },
    { id: "an-2", title: "Mid-term tests", audience: "Secondary", status: "Draft", date: "22 Dec" },
    { id: "an-3", title: "Sports day", audience: "Primary", status: "Published", date: "28 Dec" }
  ];

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Communication / Announcements</div>
          <h1>Announcements</h1>
          <p className="muted">Publish updates to parents and staff quickly.</p>
        </div>
        <a className="button" href="/admin/comms/announcements/new">
          New announcement
        </a>
      </div>

      <div className="card">
        <div className="quick-actions">
          <input className="chip-input" placeholder="Search announcements" />
          <button className="chip">All</button>
          <button className="chip">Drafts</button>
          <button className="chip">Published</button>
        </div>
      </div>

      <div className="card">
        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.audience}</td>
                    <td>
                      <span className="status-pill">{item.status}</span>
                    </td>
                    <td>{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mobile-only list-cards">
          {announcements.map((item) => (
            <div key={item.id} className="list-card">
              <strong>{item.title}</strong>
              <span>{item.audience}</span>
              <span>{item.date}</span>
              <span className="status-pill">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
