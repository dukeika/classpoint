"use client";

export default function GlobalError({ error }: { error: Error }) {
  return (
    <html lang="en">
      <body>
        <main className="dashboard-page">
          <div className="card" style={{ maxWidth: 720 }}>
            <h1>Application error</h1>
            <p className="muted">{error.message || "An unexpected error occurred."}</p>
            <a className="button" href="/">
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
