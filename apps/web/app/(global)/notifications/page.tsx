"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type AuditEvent = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt?: string | null;
};

const formatAction = (action: string) => {
  return action
    .replace(/[_:.]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
};

const formatTime = (value?: string | null) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function NotificationsPage() {
  const { schoolId, isAuthenticated } = useStaffAuth();
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!isAuthenticated || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ auditBySchool: AuditEvent[] }>(
          `query AuditBySchool($schoolId: ID!, $limit: Int) {
            auditBySchool(schoolId: $schoolId, limit: $limit) {
              id
              action
              entityType
              entityId
              createdAt
            }
          }`,
          { schoolId, limit: 6 }
        );
        setItems(data.auditBySchool || []);
      } catch (err) {
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, [isAuthenticated, schoolId]);

  const latest = useMemo(() => items.slice(0, 3), [items]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Notifications</div>
          <h1>Latest alerts</h1>
          <p className="muted">Keep tabs on payments, approvals, and pending tasks.</p>
        </div>
        <div className="quick-actions">
          <a className="button" href="/notifications/all">
            View all
          </a>
        </div>
      </div>

      <div className="card">
        <h3>Priority</h3>
        <div className="list-cards">
          {loading && (
            <div className="list-card">
              <strong>Loading notifications</strong>
              <span>Syncing recent activity from your school.</span>
            </div>
          )}
          {error && (
            <div className="list-card">
              <strong>Unable to load notifications</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && latest.length === 0 && (
            <div className="list-card">
              <strong>No recent activity</strong>
              <span>New activity will appear here as it happens.</span>
            </div>
          )}
          {!loading &&
            !error &&
            latest.map((item) => (
              <div key={item.id} className="list-card">
                <strong>{formatAction(item.action)}</strong>
                <span>{item.entityType || "System update"}</span>
                <span>
                  {formatTime(item.createdAt)} · <span className="status-pill">NEW</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
