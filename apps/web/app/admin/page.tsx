"use client";

import { useEffect, useMemo, useState } from "react";

type SetupStepStatus = "not_started" | "in_progress" | "completed" | "skipped";

type SetupState = {
  steps: { stepId: string; status: SetupStepStatus; label: string }[];
};

const STATUS_LABELS: Record<SetupStepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Optional"
};

const StatusPill = ({ status }: { status: SetupStepStatus }) => (
  <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>
);

const KpiCard = ({
  label,
  value,
  note,
  href
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
}) => (
  <a className="kpi-card" href={href}>
    <span className="kpi-label">{label}</span>
    <strong className="kpi-value">{value}</strong>
    <small className="muted">{note}</small>
  </a>
);

export default function AdminOverviewPage() {
  const [setupState, setSetupState] = useState<SetupState | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("cp.setup.state");
    if (stored) {
      try {
        setSetupState(JSON.parse(stored));
        return;
      } catch (_err) {
        setSetupState(null);
      }
    }
  }, []);

  const setupSteps = setupState?.steps || [];
  const totalSteps = setupSteps.length || 8;
  const completedSteps = setupSteps.filter((step) => step.status === "completed").length;
  const setupProgress = Math.round((completedSteps / totalSteps) * 100) || 0;
  const nextStep =
    setupSteps.find((step) => step.status !== "completed") || {
      stepId: "setup-branding",
      label: "School Profile & Branding",
      status: "not_started" as SetupStepStatus
    };
  const setupComplete = setupProgress >= 100;
  const primaryAction = setupComplete
    ? { label: "Generate invoices", href: "/admin/invoices" }
    : { label: "Continue setup", href: "/admin/setup" };
  const progressStyle = { ["--progress" as string]: `${setupProgress}%` };

  const kpis = useMemo(
    () => [
      {
        label: "Collected (this term)",
        value: "NGN 2.8m",
        note: "from NGN 4.2m billed",
        href: "/admin/collections"
      },
      { label: "Outstanding", value: "NGN 1.4m", note: "112 invoices unpaid", href: "/admin/collections" },
      { label: "Defaulters", value: "28", note: "parents overdue", href: "/admin/payments/defaulters" },
      { label: "Payments pending", value: "6", note: "manual proofs", href: "/admin/payments/proofs" },
      { label: "Attendance pending", value: "2", note: "classes today", href: "/admin/attendance" }
    ],
    []
  );

  const workQueue = useMemo(
    () => [
      {
        title: "Payment proofs pending",
        summary: "6 items need review",
        status: "in_progress" as SetupStepStatus,
        cta: { label: "Review", href: "/admin/payments/proofs" }
      },
      {
        title: "Import errors",
        summary: "12 records need correction",
        status: "not_started" as SetupStepStatus,
        cta: { label: "Fix", href: "/admin/setup/import/review" }
      },
      {
        title: "Attendance not submitted",
        summary: "2 classes pending today",
        status: "in_progress" as SetupStepStatus,
        cta: { label: "Continue", href: "/admin/attendance" }
      },
      {
        title: "Results ready to publish",
        summary: "Primary 6, 1st term",
        status: "completed" as SetupStepStatus,
        cta: { label: "Publish", href: "/admin/results" }
      }
    ],
    []
  );

  const quickActions = [
    { label: "Continue setup", href: "/admin/setup" },
    { label: "Send reminders", href: "/admin/comms/announcements" },
    { label: "Review payment proofs", href: "/admin/payments/proofs" },
    { label: "Update fee schedules", href: "/admin/fees" },
    { label: "Import students", href: "/admin/setup/import/upload" },
    { label: "Publish results", href: "/admin/results" }
  ];

  const recentActivity = [
    { title: "Payment received", detail: "INV-2024-0091 - NGN 45,000", href: "/admin/payments/transactions" },
    { title: "Invoice batch generated", detail: "JSS2 - 63 students", href: "/admin/invoices" },
    { title: "New announcement", detail: "PTA meeting scheduled", href: "/admin/comms/announcements" }
  ];

  return (
    <main className="dashboard-page admin-dashboard">
      <section className="admin-header">
        <div className="admin-header-main">
          <div className="breadcrumb">Admin / Overview</div>
          <h1>School Admin Dashboard</h1>
          <p className="muted">Track collections, tasks, and actions that need attention.</p>
          <div className="hero-meta">
            <span className="status-pill status-in_progress">Term live</span>
            <span className="hero-note">Last sync: 2 mins ago</span>
          </div>
          <div className="admin-header-actions">
            <a className="button primary" href={primaryAction.href}>
              {primaryAction.label}
            </a>
            <a className="ghost-button" href="/admin/setup">
              Setup checklist
            </a>
          </div>
        </div>
        <div className="admin-header-card">
          <div>
            <small className="muted">Term health</small>
            <h2>On track</h2>
          </div>
          <div className="admin-score-grid">
            <div>
              <strong>86%</strong>
              <span>Fee coverage</span>
            </div>
            <div>
              <strong>92%</strong>
              <span>Attendance rate</span>
            </div>
            <div>
              <strong>7</strong>
              <span>Pending approvals</span>
            </div>
          </div>
        </div>
      </section>

      {!setupComplete && (
        <section className="card setup-progress-card">
          <div className="setup-progress">
            <div className="progress-ring" style={progressStyle}>
              <span>{setupProgress}%</span>
              <small>Setup</small>
            </div>
            <div>
              <span className="status-pill status-in_progress">Setup in progress</span>
              <h3>Finish onboarding to unlock billing</h3>
              <p className="muted">Next step: {nextStep.label}</p>
            </div>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${setupProgress}%` }} />
          </div>
          <div className="setup-actions">
            <a className="button" href={`/admin/setup`}>
              Continue setup
            </a>
            <a className="ghost-button" href={`/admin/setup`}>
              Review steps
            </a>
          </div>
        </section>
      )}

      <div className="kpi-grid admin-kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="dashboard-columns admin-columns">
        <section className="card">
          <div className="card-header">
            <h3>Work queue</h3>
            <small className="muted">Focused actions to keep the term moving.</small>
          </div>
          <div className="work-queue">
            {workQueue.map((item) => (
              <div key={item.title} className="work-item">
                <div>
                  <strong>{item.title}</strong>
                  <small className="muted">{item.summary}</small>
                </div>
                <div className="work-actions">
                  <StatusPill status={item.status} />
                  <a className="ghost-button" href={item.cta.href}>
                    {item.cta.label}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-quick-card">
          <div className="card-header">
            <h3>Quick actions</h3>
            <small className="muted">Shortcuts to the most used workflows.</small>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <a key={action.label} className="quick-action" href={action.href}>
                {action.label}
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-columns admin-columns">
        <section className="card">
          <div className="card-header">
            <h3>Recent activity</h3>
            <small className="muted">Audit-friendly highlights from the last 24 hours.</small>
          </div>
          <div className="activity-list">
            {recentActivity.map((item) => (
              <a key={item.title} className="activity-item" href={item.href}>
                <strong>{item.title}</strong>
                <span className="muted">{item.detail}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3>Collections snapshot</h3>
            <small className="muted">Decision KPIs for the term.</small>
          </div>
          <div className="summary">
            <div className="summary-row">
              <span>Collected</span>
              <span>NGN 2.8m</span>
            </div>
            <div className="summary-row">
              <span>Outstanding</span>
              <span>NGN 1.4m</span>
            </div>
            <div className="summary-row">
              <span>Defaulters</span>
              <span>28 parents</span>
            </div>
            <div className="summary-row">
              <span>Proofs pending</span>
              <span>6</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
