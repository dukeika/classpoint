"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { usePortalAuth } from "../../components/portal-auth";

type Announcement = {
  id: string;
  title: string;
  publishedAt?: string | null;
  body?: string | null;
};

export default function PortalMessagesPage() {
  const { token } = usePortalAuth();
  const schoolId = decodeSchoolId(token);
  const [messages, setMessages] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ announcementsBySchool: Announcement[] }>(
          `query AnnouncementsBySchool($schoolId: ID!, $limit: Int) {
            announcementsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              title
              body
              publishedAt
            }
          }`,
          { schoolId, limit: 6 },
          token
        );
        setMessages(data.announcementsBySchool || []);
      } catch (err) {
        setMessages([]);
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [token, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Parent portal</div>
          <h1>Message history</h1>
          <p className="muted">Track delivery status for receipts, invoices, and reminders.</p>
        </div>
        <a className="button" href="/portal/support/new">
          Contact support
        </a>
      </div>

      <div className="card">
        <h3>Recent messages</h3>
        <div className="list-cards">
          {loading && (
            <div className="list-card">
              <strong>Loading messages...</strong>
              <span>Syncing announcements from your school.</span>
            </div>
          )}
          {error && (
            <div className="list-card">
              <strong>Unable to load messages</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && messages.length === 0 && (
            <div className="list-card">
              <strong>No messages yet</strong>
              <span>Announcements and reminders will show here.</span>
            </div>
          )}
          {!loading &&
            !error &&
            messages.map((item) => (
              <div key={item.id} className="list-card">
                <strong>{item.title}</strong>
                <span>{item.body || "School update"}</span>
                <span>
                  {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : "Draft"} ·
                  <span className="status-pill">Announcement</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
