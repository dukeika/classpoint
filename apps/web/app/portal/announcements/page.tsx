"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../components/graphql";
import { usePortalAuth } from "../components/portal-auth";

type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string | null;
};

export default function PortalAnnouncementsPage() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!authToken || !schoolId) return;
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
          { schoolId, limit: 20 }
        );
        const items: Announcement[] = data.announcementsBySchool || [];
        setAnnouncements(items.filter((item) => item.publishedAt));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load announcements.");
      } finally {
        setLoading(false);
      }
    };
    loadAnnouncements();
  }, [authToken, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Announcements</div>
          <h1>Announcements</h1>
          <p className="muted">School updates and reminders for parents.</p>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading announcements...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && announcements.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No announcements yet</strong>
              <span>Check back later for new updates.</span>
            </div>
          </div>
        )}
        <div className="list-cards">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="list-card">
              <strong>{announcement.title}</strong>
              <span>{announcement.body}</span>
              <span>
                {announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
