export default function TeacherDashboard() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Teacher / Today</div>
          <h1>Today at a glance</h1>
          <p className="muted">Mark attendance quickly and keep score entry on track.</p>
        </div>
        <button className="button">Take attendance</button>
      </div>

      <div className="grid">
        <div className="card">
          <h3>My classes</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Primary 3A</strong>
                <small>35 students</small>
              </div>
              <span className="status-pill">Today</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Primary 4B</strong>
                <small>29 students</small>
              </div>
              <span className="status-pill">Today</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Attendance status</h3>
          <div className="summary">
            <div className="summary-row">
              <span>Pending</span>
              <span>2 classes</span>
            </div>
            <div className="summary-row">
              <span>Submitted</span>
              <span>1 class</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Score entry</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Mathematics</strong>
                <small>Primary 4B - 12 scores left</small>
              </div>
              <span className="status-pill">Open</span>
            </div>
            <div className="line-item">
              <div>
                <strong>English</strong>
                <small>Primary 3A - ready to submit</small>
              </div>
              <span className="status-pill">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Quick actions</h3>
        <div className="quick-actions">
          <a className="button" href="/teacher/attendance">
            Start attendance
          </a>
          <a className="button" href="/teacher/assessments">
            View assessments
          </a>
          <a className="button" href="/teacher/assessments/score-entry">
            Continue score entry
          </a>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Work queue</h3>
          <div className="list-cards">
            <div className="list-card">
              <strong>Submit Primary 3A attendance</strong>
              <span>Due today before 10:00 AM</span>
            </div>
            <div className="list-card">
              <strong>Grade 12 remaining Math scores</strong>
              <span>Assessment closes on Friday</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Announcements</h3>
          <div className="list-cards">
            <div className="list-card">
              <strong>Staff meeting</strong>
              <span>Wednesday, 2 PM in the library</span>
            </div>
            <div className="list-card">
              <strong>Mid-term tests</strong>
              <span>Ensure score entry templates are updated</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
