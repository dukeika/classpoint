type PlaceholderPageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function PlaceholderPage({ title, description, actionLabel, actionHref }: PlaceholderPageProps) {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Coming soon</div>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        {actionLabel && actionHref && (
          <a className="button" href={actionHref}>
            {actionLabel}
          </a>
        )}
      </div>
      <div className="card">
        <h3>Next steps</h3>
        <p className="muted">This page is being designed now. We will connect real data once the UX is approved.</p>
      </div>
    </main>
  );
}
