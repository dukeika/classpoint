export default function PlatformStatusPage() {
  return (
    <div className="platform-page">
      <section className="card">
        <div className="card-header">
          <h3>Status</h3>
          <small className="muted">Live health snapshot and the links you use to dig deeper.</small>
        </div>
        <div className="hq-metrics">
          <div>
            <strong>99.96% uptime</strong>
            <span className="muted">Last 30 days • API + web</span>
          </div>
          <div>
            <strong>420ms p95</strong>
            <span className="muted">Web response time</span>
          </div>
          <div>
            <strong>0.14% errors</strong>
            <span className="muted">5xx across edge + origin</span>
          </div>
          <div>
            <strong>12 queued</strong>
            <span className="muted">Oldest webhook retry: 2m</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Services</h3>
          <small className="muted">Edge, API, webhooks, and background jobs.</small>
        </div>
        <div className="list">
          <div className="line-item">
            <div>
              <strong>API & web</strong>
              <small className="muted">Latency, error rate, cache hit ratio.</small>
            </div>
            <span className="badge">Healthy</span>
          </div>
          <div className="line-item">
            <div>
              <strong>Queues & webhooks</strong>
              <small className="muted">Retry depth, dead-letter count, failing domains.</small>
            </div>
            <span className="badge">Watching</span>
          </div>
          <div className="line-item">
            <div>
              <strong>File storage & CDN</strong>
              <small className="muted">Static assets, uploads, and invalidations.</small>
            </div>
            <span className="badge">Healthy</span>
          </div>
          <div className="line-item">
            <div>
              <strong>Data layer</strong>
              <small className="muted">DB connections, slow queries, scheduled maintenance.</small>
            </div>
            <span className="badge">Degraded</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Incidents</h3>
          <small className="muted">Recent issues and next actions.</small>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INC-204</td>
                <td>Demo tenants</td>
                <td>
                  <span className="status-pill status-in_progress">Investigating</span>
                </td>
                <td>Webhook retries spiking for receipts.</td>
                <td className="muted">8 mins ago</td>
              </tr>
              <tr>
                <td>INC-203</td>
                <td>Edge cache</td>
                <td>
                  <span className="status-pill status-completed">Resolved</span>
                </td>
                <td>Invalidation lag fixed; redeployed assets.</td>
                <td className="muted">1 hr ago</td>
              </tr>
              <tr>
                <td>INC-202</td>
                <td>Auth</td>
                <td>
                  <span className="status-pill status-not_started">Postmortem</span>
                </td>
                <td>Cognito redirect mismatch for admin login.</td>
                <td className="muted">Yesterday</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Maintenance</h3>
          <small className="muted">What is planned and what is rolling out.</small>
        </div>
        <div className="list">
          <div className="line-item">
            <div>
              <strong>Planned</strong>
              <small className="muted">Sunday 02:00 UTC — DB patch + minor downtime.</small>
            </div>
          </div>
          <div className="line-item">
            <div>
              <strong>Deploy train</strong>
              <small className="muted">Next rollout: login UI + fees UX fixes.</small>
            </div>
          </div>
          <div className="line-item">
            <div>
              <strong>Runbooks</strong>
              <small className="muted">Escalation + dashboards links stay here.</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
