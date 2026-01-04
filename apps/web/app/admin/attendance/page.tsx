export default function AttendancePage() {
  const classes = [
    { id: "c-1", name: "Primary 3A", teacher: "Faith Obi", submitted: "09:10 AM", status: "Submitted" },
    { id: "c-2", name: "Primary 4B", teacher: "Tosin Ade", submitted: "Pending", status: "Pending" },
    { id: "c-3", name: "JSS1", teacher: "Danladi Musa", submitted: "Pending", status: "Pending" },
    { id: "c-4", name: "SSS2", teacher: "Kemi Ayo", submitted: "09:22 AM", status: "Submitted" }
  ];

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Attendance</div>
          <h1>Attendance overview</h1>
          <p className="muted">Track daily attendance completion by class.</p>
        </div>
        <a className="button" href="/teacher/attendance">
          Take attendance
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Today</h3>
          <div className="summary">
            <div className="summary-row">
              <span>Completed</span>
              <span>2 classes</span>
            </div>
            <div className="summary-row">
              <span>Pending</span>
              <span>2 classes</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Alerts</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Primary 4B</strong>
                <small>Attendance overdue by 25 mins</small>
              </div>
              <span className="status-pill">Pending</span>
            </div>
            <div className="line-item">
              <div>
                <strong>JSS1</strong>
                <small>Attendance not started</small>
              </div>
              <span className="status-pill">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{entry.teacher}</td>
                    <td>{entry.submitted}</td>
                    <td>
                      <span className="status-pill">{entry.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mobile-only list-cards">
          {classes.map((entry) => (
            <div key={entry.id} className="list-card">
              <strong>{entry.name}</strong>
              <span>{entry.teacher}</span>
              <span>{entry.submitted}</span>
              <span className="status-pill">{entry.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
