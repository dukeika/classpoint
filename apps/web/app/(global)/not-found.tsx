export default function GlobalSegmentNotFound() {
  return (
    <main className="dashboard-page">
      <div className="card" style={{ maxWidth: 720 }}>
        <h1>Page not found</h1>
        <p className="muted">The page you requested does not exist.</p>
        <a className="button" href="/">
          Go home
        </a>
      </div>
    </main>
  );
}
