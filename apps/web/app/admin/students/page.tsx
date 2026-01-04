export default function StudentsPage() {
  const students = [
    { id: "st-1", name: "Ada Okafor", classGroup: "Primary 4B", admissionNo: "P4-018", balance: "NGN 35k", status: "Active" },
    { id: "st-2", name: "Chinedu Okafor", classGroup: "JSS1", admissionNo: "J1-042", balance: "Paid", status: "Active" },
    { id: "st-3", name: "Olu Adebayo", classGroup: "Primary 6A", admissionNo: "P6-011", balance: "NGN 12k", status: "Overdue" },
    { id: "st-4", name: "Zainab Bello", classGroup: "SSS2", admissionNo: "S2-033", balance: "NGN 8k", status: "Active" }
  ];

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Students</div>
          <h1>Students</h1>
          <p className="muted">Track enrollment, fee balances, and student status across classes.</p>
        </div>
        <div className="quick-actions">
          <a className="button" href="/admin/students/new">
            Add student
          </a>
          <a className="button" href="/admin/setup">
            Import CSV
          </a>
        </div>
      </div>

      <div className="card">
        <div className="quick-actions">
          <input className="chip-input" placeholder="Search name or admission no" />
          <button className="chip">All classes</button>
          <button className="chip">Overdue</button>
          <button className="chip">New this term</button>
        </div>
      </div>

      <div className="card">
        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Admission No</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.classGroup}</td>
                    <td>{student.admissionNo}</td>
                    <td>{student.balance}</td>
                    <td>
                      <span className="status-pill">{student.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mobile-only list-cards">
          {students.map((student) => (
            <div key={student.id} className="list-card">
              <strong>{student.name}</strong>
              <span>{student.classGroup} · {student.admissionNo}</span>
              <span>{student.balance}</span>
              <span className="status-pill">{student.status}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
