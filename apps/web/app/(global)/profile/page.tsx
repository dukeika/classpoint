"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type SchoolProfile = {
  id: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

type AuditEvent = {
  id: string;
  action: string;
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

export default function ProfilePage() {
  const { schoolId, displayName, email, groups, isAuthenticated } = useStaffAuth();
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [activity, setActivity] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ schoolProfileBySchool: SchoolProfile[] }>(
          `query SchoolProfileBySchool($schoolId: ID!) {
            schoolProfileBySchool(schoolId: $schoolId) {
              id
              address
              city
              state
              contactEmail
              contactPhone
            }
          }`,
          { schoolId }
        );
        setProfile(data.schoolProfileBySchool?.[0] || null);
        const audit = await graphqlFetch<{ auditBySchool: AuditEvent[] }>(
          `query AuditBySchool($schoolId: ID!, $limit: Int) {
            auditBySchool(schoolId: $schoolId, limit: $limit) {
              id
              action
              createdAt
            }
          }`,
          { schoolId, limit: 3 }
        );
        setActivity(audit.auditBySchool || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [isAuthenticated, schoolId]);

  const role = groups?.[0] || "Staff";

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Account</div>
          <h1>Profile</h1>
          <p className="muted">Manage your account details and preferences.</p>
        </div>
        <a className="button" href="/profile/edit">
          Edit profile
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Account summary</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>{displayName}</strong>
                <small>{email}</small>
              </div>
              <span className="status-pill">Active</span>
            </div>
            <div className="line-item">
              <strong>Role</strong>
              <span>{role}</span>
            </div>
            <div className="line-item">
              <strong>School contact</strong>
              <span>{profile?.contactPhone || "Not set"}</span>
            </div>
            <div className="line-item">
              <strong>School email</strong>
              <span>{profile?.contactEmail || "Not set"}</span>
            </div>
            <div className="line-item">
              <strong>Location</strong>
              <span>{[profile?.address, profile?.city, profile?.state].filter(Boolean).join(", ") || "Not set"}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Recent activity</h3>
          <div className="list">
            {loading && (
              <div className="line-item">
                <span>Loading activity...</span>
              </div>
            )}
            {error && (
              <div className="line-item">
                <span>{error}</span>
              </div>
            )}
            {!loading &&
              !error &&
              activity.map((item) => (
                <div key={item.id} className="line-item">
                  <span>{formatAction(item.action)}</span>
                </div>
              ))}
            {!loading && !error && activity.length === 0 && (
              <div className="line-item">
                <span>No recent activity logged yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
