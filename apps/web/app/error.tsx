"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="dashboard-page">
      <div className="card" style={{ maxWidth: 720 }}>
        <h1>Something went wrong</h1>
        <p className="muted">{error.message || "An unexpected error occurred."}</p>
        <div className="action-row">
          <button className="button" onClick={() => reset()}>
            Try again
          </button>
          <a className="ghost-button" href="/">
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
