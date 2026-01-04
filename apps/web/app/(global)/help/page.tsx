"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type SchoolProfile = {
  contactEmail?: string | null;
  contactPhone?: string | null;
};

type Announcement = {
  id: string;
  title: string;
  publishedAt?: string | null;
};

const resources = [
  {
    title: "Getting started checklist",
    detail: "Walk through onboarding, academic setup, and fee schedules."
  },
  {
    title: "Payments and receipts",
    detail: "Learn how to reconcile payments and issue receipts."
  },
  {
    title: "Attendance and results",
    detail: "Tips for fast attendance and score entry workflows."
  }
];

export default function HelpPage() {
  const { schoolId, isAuthenticated } = useStaffAuth();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHelpData = async () => {
      if (!isAuthenticated || !schoolId) return;
      setLoading(true);
      try {
        const data = await graphqlFetch<{ schoolProfileBySchool: SchoolProfile[] }>(
          `query SchoolProfileBySchool($schoolId: ID!) {
            schoolProfileBySchool(schoolId: $schoolId) {
              contactEmail
              contactPhone
            }
          }`,
          { schoolId }
        );
        setProfile(data.schoolProfileBySchool?.[0] || null);
        const announcementsData = await graphqlFetch<{ announcementsBySchool: Announcement[] }>(
          `query AnnouncementsBySchool($schoolId: ID!, $limit: Int) {
            announcementsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              title
              publishedAt
            }
          }`,
          { schoolId, limit: 3 }
        );
        setAnnouncements(announcementsData.announcementsBySchool || []);
      } finally {
        setLoading(false);
      }
    };
    loadHelpData();
  }, [isAuthenticated, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Support</div>
          <h1>Help center</h1>
          <p className="muted">Guides and resources for every role.</p>
        </div>
        <a className="button" href="/help/quick-guides">
          View quick guides
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Popular resources</h3>
          <div className="list">
            {resources.map((item) => (
              <div key={item.title} className="line-item">
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </div>
                <span className="status-pill">Guide</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Need more help?</h3>
          <p className="muted">
            Reach out to the ClassPoint team for onboarding, billing, or technical support.
          </p>
          <div className="quick-actions">
            <a className="button" href="/help/contact-support">
              Contact support
            </a>
            <a className="ghost-button" href="/help/quick-guides">
              View FAQs
            </a>
          </div>
          {profile && (
            <div className="list">
              <div className="line-item">
                <strong>School contact</strong>
                <span>{profile.contactPhone || "Not set"}</span>
              </div>
              <div className="line-item">
                <strong>School email</strong>
                <span>{profile.contactEmail || "Not set"}</span>
              </div>
            </div>
          )}
          {loading && <p className="muted">Loading latest updates...</p>}
        </div>
        <div className="card">
          <h3>Recent announcements</h3>
          <div className="list">
            {announcements.length === 0 && !loading && (
              <div className="line-item">
                <span>No announcements yet.</span>
              </div>
            )}
            {announcements.map((item) => (
              <div key={item.id} className="line-item">
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Draft"}</small>
                </div>
                <span className="status-pill">Update</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
