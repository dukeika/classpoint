"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../components/graphql";
import { usePortalAuth } from "./components/portal-auth";

type Announcement = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string | null;
};

export default function PortalDashboard() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!authToken || !schoolId) return;
      setLoadingAnnouncements(true);
      setAnnouncementsError(null);
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
          { schoolId, limit: 6 }
        );
        const items: Announcement[] = data.announcementsBySchool || [];
        setAnnouncements(items.filter((item) => item.publishedAt));
      } catch (err) {
        setAnnouncementsError(err instanceof Error ? err.message : "Failed to load announcements.");
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    loadAnnouncements();
  }, [authToken, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Dashboard</div>
          <h1>Welcome back</h1>
          <p className="muted">View fee balances, receipts, and school updates in one place.</p>
        </div>
        <a className="button" href="/portal/children/fees">
          Pay now
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Children</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Linked children</strong>
                <small>Open the Children page to view profiles and fees.</small>
              </div>
              <a className="button" href="/portal/children">
                View children
              </a>
            </div>
            <div className="line-item muted">
              <div>
                <strong>Need to add another child?</strong>
                <small>Contact your school admin to link siblings.</small>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Upcoming payments</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Next invoices</strong>
                <small>See current balances by child.</small>
              </div>
              <a className="button" href="/portal/children/fees">
                View invoices
              </a>
            </div>
            <div className="line-item muted">
              <div>
                <strong>No invoices showing?</strong>
                <small>Check with your school or reload later.</small>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Announcements</h3>
          {loadingAnnouncements && <p className="muted">Loading announcements...</p>}
          {announcementsError && <p className="muted">{announcementsError}</p>}
          {!loadingAnnouncements && !announcementsError && (
            <div className="list-cards">
              {announcements.length === 0 && (
                <div className="list-card">
                  <strong>No announcements yet</strong>
                  <span>School updates will appear here.</span>
                </div>
              )}
              {announcements.map((announcement) => (
                <div key={announcement.id} className="list-card">
                  <strong>{announcement.title}</strong>
                  <span>{announcement.body.slice(0, 120)}{announcement.body.length > 120 ? "..." : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Quick actions</h3>
          <div className="quick-actions">
            <a className="button" href="/portal/children/fees">
              View invoices
            </a>
            <a className="button" href="/portal/children/fees/receipts">
              Download receipts
            </a>
            <a className="button" href="/portal/support">
              Contact support
            </a>
          </div>
        </div>
        <div className="card">
          <h3>Recent activity</h3>
          <div className="list-cards">
            <div className="list-card">
              <strong>Payment receipts</strong>
              <span>Visit receipts to download the latest proof of payment.</span>
            </div>
            <div className="list-card">
              <strong>Attendance updates</strong>
              <span>View attendance by child when available.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
