type AttendanceHistoryDetailProps = {
  params: { classGroupId: string; date: string };
};

const summary = [
  { label: "Marked by", value: "Blessing A." },
  { label: "Submitted at", value: "08:42 AM" },
  { label: "Status", value: "Completed" }
];

export default function AttendanceHistoryDetailPage({ params }: AttendanceHistoryDetailProps) {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Teacher</div>
          <h1>Attendance history</h1>
          <p className="muted">
            {params.classGroupId.toUpperCase()} · {params.date}
          </p>
        </div>
        <a className="button" href="/teacher/attendance/history">
          Back to history
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Summary</h3>
          <div className="list">
            {summary.map((item) => (
              <div key={item.label} className="line-item">
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Highlights</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Attendance rate</strong>
                <small>29 of 32 present</small>
              </div>
              <span className="status-pill">91%</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Late arrivals</strong>
                <small>1 student marked late</small>
              </div>
              <span className="status-pill">1</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Absences</strong>
                <small>3 students absent</small>
              </div>
              <span className="status-pill">3</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
