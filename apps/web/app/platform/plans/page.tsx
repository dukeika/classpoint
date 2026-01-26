export default function PlatformPlansPage() {
  const plans = [
    { name: "Core", price: "₦ per term", notes: "Fees, messaging, attendance" },
    { name: "Plus", price: "₦ per term", notes: "Adds analytics and support" }
  ];
  const addons = [
    { name: "Admissions", status: "Future", notes: "Applicant portal + workflows" },
    { name: "Transport", status: "Future", notes: "Routes, payments, riders" }
  ];
  return (
    <div className="platform-page">
      <section className="card">
        <div className="card-header">
          <h3>Plans</h3>
          <small className="muted">Catalog pricing and feature flags.</small>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.name}>
                  <td>{plan.name}</td>
                  <td>{plan.price}</td>
                  <td>{plan.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Add-ons</h3>
          <small className="muted">Optional modules for schools.</small>
        </div>
        <div className="list">
          {addons.map((addon) => (
            <div key={addon.name} className="line-item">
              <div>
                <strong>{addon.name}</strong>
                <small className="muted">{addon.notes}</small>
              </div>
              <span className="status-pill">{addon.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Feature flags</h3>
          <small className="muted">Enable/disable features per plan or tenant.</small>
        </div>
        <p className="muted">Coming soon: plan-level feature toggles and overrides.</p>
      </section>
    </div>
  );
}
