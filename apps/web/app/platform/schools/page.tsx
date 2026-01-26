export default function PlatformSchoolsPage() {
  const schools = [
    { name: "Demo Academy", slug: "demo", plan: "Core", city: "Lagos", status: "Active", last: "moments ago" },
    { name: "Lakeview College", slug: "lakeview", plan: "Plus", city: "Abuja", status: "Active", last: "1h ago" },
    { name: "Harbor Heights", slug: "harbor", plan: "Core", city: "PH", status: "Provisioning", last: "Today" }
  ];

  return (
    <div className="platform-page">
      <section className="card">
        <div className="card-header">
          <h3>Schools</h3>
          <small className="muted">Provision and monitor tenant schools.</small>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>School</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>City</th>
                <th>Status</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.slug}>
                  <td>{school.name}</td>
                  <td>{school.slug}</td>
                  <td>{school.plan}</td>
                  <td>{school.city}</td>
                  <td>
                    <span className="status-pill">{school.status}</span>
                  </td>
                  <td className="muted">{school.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Provisioning & audit</h3>
          <small className="muted">What this area will handle.</small>
        </div>
        <div className="list">
          <div className="line-item">
            <div>
              <strong>Tenant directory</strong>
              <small className="muted">List schools with status, plan, city, and last activity.</small>
            </div>
          </div>
          <div className="line-item">
            <div>
              <strong>Provisioning</strong>
              <small className="muted">Create/activate/suspend schools and assign admins.</small>
            </div>
          </div>
          <div className="line-item">
            <div>
              <strong>Audit & usage</strong>
              <small className="muted">View usage, support tickets, and billing readiness.</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
