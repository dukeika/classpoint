"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

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

export default function NotificationsAllPage() {
  const { schoolId, isAuthenticated } = useStaffAuth();
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeline = async () => {
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
          { schoolId, limit: 20 }
        );
        setItems(data.auditBySchool || []);
      } catch (err) {
        setItems([]);
        setError(err instanceof Error ? err.message : "Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };
    loadTimeline();
  }, [isAuthenticated, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Notifications</div>
          <h1>All notifications</h1>
          <p className="muted">A full timeline of recent system events.</p>
        </div>
        <a className="button" href="/notifications/settings">
          Notification settings
        </a>
      </div>

      <div className="card">
        <h3>Timeline</h3>
        <div className="list-cards">
          {loading && (
            <div className="list-card">
              <strong>Loading timeline</strong>
              <span>Fetching the latest audit events.</span>
            </div>
          )}
          {error && (
            <div className="list-card">
              <strong>Unable to load timeline</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="list-card">
              <strong>No notifications yet</strong>
              <span>System updates will appear here.</span>
            </div>
          )}
          {!loading &&
            !error &&
            items.map((item) => (
              <div key={item.id} className="list-card">
                <strong>{formatAction(item.action)}</strong>
                <span>{item.entityType || "System event"}</span>
                <span>{formatTime(item.createdAt)}</span>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
