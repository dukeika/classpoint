"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId, decodeToken } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { usePortalAuth } from "../../components/portal-auth";

type SchoolProfile = {
  contactEmail?: string | null;
  contactPhone?: string | null;
};

type Parent = {
  id: string;
  primaryPhone?: string | null;
  email?: string | null;
};

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt?: string | null;
};

export default function PortalSupportPage() {
  const { token } = usePortalAuth();
  const schoolId = decodeSchoolId(token);
  const tokenDetails = decodeToken(token);
  const tokenEmail = tokenDetails?.email || tokenDetails?.["cognito:username"] || "";
  const tokenPhone = tokenDetails?.phone_number || "";
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSupportData = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const profileData = await graphqlFetch<{ schoolProfileBySchool: SchoolProfile[] }>(
          `query SchoolProfileBySchool($schoolId: ID!) {
            schoolProfileBySchool(schoolId: $schoolId) {
              contactEmail
              contactPhone
            }
          }`,
          { schoolId },
          token
        );
        setProfile(profileData.schoolProfileBySchool?.[0] || null);

        const parentsData = await graphqlFetch<{ parentsBySchool: Parent[] }>(
          `query ParentsBySchool($schoolId: ID!, $limit: Int) {
            parentsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              primaryPhone
              email
            }
          }`,
          { schoolId, limit: 200 },
          token
        );
        const parents = parentsData.parentsBySchool || [];
        const match = parents.find(
          (parent) =>
            (tokenEmail && parent.email === tokenEmail) ||
            (tokenPhone && parent.primaryPhone === tokenPhone)
        );
        if (!match) {
          setTickets([]);
          setError("Parent profile not found for this account.");
          return;
        }
        const ticketData = await graphqlFetch<{ supportTicketsByParent: SupportTicket[] }>(
          `query SupportTicketsByParent($parentId: ID!, $limit: Int) {
            supportTicketsByParent(parentId: $parentId, limit: $limit) {
              id
              subject
              category
              status
              createdAt
            }
          }`,
          { parentId: match.id, limit: 20 },
          token
        );
        setTickets(ticketData.supportTicketsByParent || []);
      } catch (err) {
        setTickets([]);
        setError(err instanceof Error ? err.message : "Failed to load support tickets.");
      } finally {
        setLoading(false);
      }
    };
    loadSupportData();
  }, [token, schoolId, tokenEmail, tokenPhone]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Parent portal</div>
          <h1>Support</h1>
          <p className="muted">Raise issues and track their progress.</p>
        </div>
        <a className="button" href="/portal/support/new">
          New request
        </a>
      </div>

      <div className="card">
        <h3>Recent requests</h3>
        <div className="list-cards">
          {loading && (
            <div className="list-card">
              <strong>Loading requests...</strong>
              <span>Fetching recent support tickets.</span>
            </div>
          )}
          {error && (
            <div className="list-card">
              <strong>Unable to load tickets</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && tickets.length === 0 && (
            <div className="list-card">
              <strong>No support tickets yet</strong>
              <span>Start a new request to reach the bursar team.</span>
              <span className="status-pill">New</span>
            </div>
          )}
          {!loading &&
            !error &&
            tickets.map((ticket) => (
              <div key={ticket.id} className="list-card">
                <strong>{ticket.subject}</strong>
                <span>{ticket.category}</span>
                <span>
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Recently"} ·
                  <span className="status-pill">{ticket.status}</span>
                </span>
                <a className="ghost-button" href={`/portal/support/${ticket.id}`}>
                  View ticket
                </a>
              </div>
            ))}
        </div>
      </div>
      <div className="card">
        <h3>School contacts</h3>
        <div className="list">
          <div className="line-item">
            <strong>Phone</strong>
            <span>{profile?.contactPhone || "Not available"}</span>
          </div>
          <div className="line-item">
            <strong>Email</strong>
            <span>{profile?.contactEmail || "Not available"}</span>
          </div>
          {loading && (
            <div className="line-item">
              <span>Loading contact details...</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
