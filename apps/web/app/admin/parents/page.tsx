export default function ParentsPage() {
  const parents = [
    { id: "pa-1", name: "Mrs. Okafor", children: 2, phone: "+234 803 114 8890", channel: "WhatsApp", status: "Active" },
    { id: "pa-2", name: "Mr. Adeyemi", children: 1, phone: "+234 802 338 2110", channel: "SMS", status: "Active" },
    { id: "pa-3", name: "Mrs. Bello", children: 3, phone: "+234 807 502 7712", channel: "WhatsApp", status: "Opted out" },
    { id: "pa-4", name: "Mr. Eze", children: 1, phone: "+234 805 441 6201", channel: "Email", status: "Active" }
  ];

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Parents</div>
          <h1>Parents & guardians</h1>
          <p className="muted">Manage parent contacts and communication preferences.</p>
        </div>
        <a className="button" href="/admin/comms/announcements">
          Send announcement
        </a>
      </div>

      <div className="card">
        <div className="quick-actions">
          <input className="chip-input" placeholder="Search parent name or phone" />
          <button className="chip">All</button>
          <button className="chip">WhatsApp</button>
          <button className="chip">Opted out</button>
        </div>
      </div>

      <div className="card">
        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Children</th>
                  <th>Phone</th>
                  <th>Channel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id}>
                    <td>{parent.name}</td>
                    <td>{parent.children}</td>
                    <td>{parent.phone}</td>
                    <td>{parent.channel}</td>
                    <td>
                      <span className="status-pill">{parent.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mobile-only list-cards">
          {parents.map((parent) => (
            <div key={parent.id} className="list-card">
              <strong>{parent.name}</strong>
              <span>{parent.phone}</span>
              <span>{parent.children} children · {parent.channel}</span>
              <span className="status-pill">{parent.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
