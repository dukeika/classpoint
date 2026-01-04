"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type SupportTicket = {
  id: string;
  parentId: string;
  studentId?: string | null;
  subject: string;
  category: string;
  status: string;
  createdAt?: string | null;
};

type Parent = {
  id: string;
  fullName: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

const slaThresholds: Record<string, number> = {
  "Payment dispute": 2,
  "Receipt request": 5,
  "Technical issue": 4,
  Other: 5
};

const slaBadge = (category: string, createdAt?: string | null) => {
  if (!createdAt) return { label: "Age: N/A", isRisk: false };
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  const threshold = slaThresholds[category] ?? 3;
  const isRisk = ageDays >= threshold;
  const isWarn = !isRisk && ageDays >= Math.max(1, threshold - 1);
  return {
    label: `Age ${ageDays}d / SLA ${threshold}d`,
    isRisk,
    isWarn
  };
};

export default function AdminSupportPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [ageFilter, setAgeFilter] = useState("ALL");
  const [parentLookup, setParentLookup] = useState<Record<string, string>>({});
  const [studentLookup, setStudentLookup] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ supportTicketsBySchool: SupportTicket[] }>(
          `query SupportTicketsBySchool($schoolId: ID!, $limit: Int) {
            supportTicketsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              parentId
              studentId
              subject
              category
              status
              createdAt
            }
          }`,
          { schoolId, limit: 50 },
          token
        );
        setTickets(data.supportTicketsBySchool || []);
        const [parentsData, studentsData] = await Promise.all([
          graphqlFetch<{ parentsBySchool: Parent[] }>(
            `query ParentsBySchool($schoolId: ID!, $limit: Int) {
              parentsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                fullName
              }
            }`,
            { schoolId, limit: 200 },
            token
          ),
          graphqlFetch<{ studentsBySchool: Student[] }>(
            `query StudentsBySchool($schoolId: ID!, $limit: Int) {
              studentsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                firstName
                lastName
              }
            }`,
            { schoolId, limit: 400 },
            token
          )
        ]);
        const parentMap: Record<string, string> = {};
        (parentsData.parentsBySchool || []).forEach((parent) => {
          parentMap[parent.id] = parent.fullName;
        });
        const studentMap: Record<string, string> = {};
        (studentsData.studentsBySchool || []).forEach((student) => {
          studentMap[student.id] = `${student.firstName} ${student.lastName}`.trim();
        });
        setParentLookup(parentMap);
        setStudentLookup(studentMap);
      } catch (err) {
        setTickets([]);
        setError(err instanceof Error ? err.message : "Failed to load support queue.");
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, [token, schoolId]);

  const sortedTickets = useMemo(() => {
    return tickets.slice().sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [tickets]);

  const categories = useMemo(() => {
    const values = new Set(tickets.map((ticket) => ticket.category));
    return ["ALL", ...Array.from(values).sort()];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const now = Date.now();
    return sortedTickets.filter((ticket) => {
      const statusMatch = statusFilter === "ALL" || ticket.status === statusFilter;
      const categoryMatch = categoryFilter === "ALL" || ticket.category === categoryFilter;
      const ageMs = ticket.createdAt ? now - new Date(ticket.createdAt).getTime() : 0;
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      let ageMatch = true;
      if (ageFilter === "TODAY") ageMatch = ageDays <= 1;
      if (ageFilter === "WEEK") ageMatch = ageDays <= 7;
      if (ageFilter === "MONTH") ageMatch = ageDays <= 30;
      return statusMatch && categoryMatch && ageMatch;
    });
  }, [sortedTickets, statusFilter, categoryFilter, ageFilter]);

  const updateStatus = async (ticketId: string, nextStatus: string) => {
    if (!schoolId) return;
    setUpdating(ticketId);
    try {
      await graphqlFetch(
        `mutation UpdateSupportTicketStatus($input: UpdateSupportTicketStatusInput!) {
          updateSupportTicketStatus(input: $input) {
            id
          }
        }`,
        { input: { schoolId, id: ticketId, status: nextStatus } },
        token
      );
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: nextStatus
              }
            : ticket
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update ticket status.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Support</div>
          <h1>Support queue</h1>
          <p className="muted">Track parent disputes and requests from the portal.</p>
        </div>
        <div className="quick-actions">
          <button className="button" type="button">
            Export tickets
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Open requests</h3>
        <div className="quick-actions">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "ALL" ? "All categories" : category}
              </option>
            ))}
          </select>
          <select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}>
            <option value="ALL">Any age</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 days</option>
            <option value="MONTH">Last 30 days</option>
          </select>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setCategoryFilter("ALL");
              setAgeFilter("ALL");
            }}
          >
            Clear filters
          </button>
        </div>
        {loading && (
          <div className="list-cards">
            <div className="list-card">
              <strong>Loading support queue...</strong>
              <span>Fetching the latest tickets.</span>
            </div>
          </div>
        )}
        {error && (
          <div className="list-cards">
            <div className="list-card">
              <strong>Unable to load queue</strong>
              <span>{error}</span>
            </div>
          </div>
        )}
        {!loading && !error && filteredTickets.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No support tickets yet</strong>
              <span>New parent requests will appear here.</span>
            </div>
          </div>
        )}

        {!loading && !error && filteredTickets.length > 0 && (
          <>
            <div className="desktop-only">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Category</th>
                      <th>Parent</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>SLA</th>
                      <th>Opened</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const sla = slaBadge(ticket.category, ticket.createdAt);
                      const parentName = parentLookup[ticket.parentId] || "Parent";
                      const studentName = ticket.studentId ? studentLookup[ticket.studentId] || "Student" : "—";
                      return (
                        <tr key={ticket.id}>
                          <td>{ticket.subject}</td>
                          <td>{ticket.category}</td>
                          <td>{parentName}</td>
                          <td>{studentName}</td>
                          <td>
                            <span className="status-pill">{ticket.status}</span>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${sla.isRisk ? "alert" : sla.isWarn ? "warn" : ""}`}
                            >
                              {sla.label}
                            </span>
                          </td>
                          <td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}</td>
                          <td>
                            <a className="ghost-button" href={`/admin/support/${ticket.id}`}>
                              Review
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mobile-only list-cards">
              {filteredTickets.map((ticket) => {
                const sla = slaBadge(ticket.category, ticket.createdAt);
                const parentName = parentLookup[ticket.parentId] || "Parent";
                const studentName = ticket.studentId ? studentLookup[ticket.studentId] || "Student" : "Not linked";
                return (
                  <div key={ticket.id} className="list-card">
                    <strong>{ticket.subject}</strong>
                    <span>{ticket.category}</span>
                    <span>{parentName}</span>
                    <span>{studentName}</span>
                    <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Recently"}</span>
                    <span className="status-pill">{ticket.status}</span>
                    <span className={`status-pill ${sla.isRisk ? "alert" : sla.isWarn ? "warn" : ""}`}>
                      {sla.label}
                    </span>
                    <div className="quick-actions">
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => updateStatus(ticket.id, "IN_REVIEW")}
                        disabled={updating === ticket.id}
                      >
                        Mark in review
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => updateStatus(ticket.id, "RESOLVED")}
                        disabled={updating === ticket.id}
                      >
                        Resolve
                      </button>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => updateStatus(ticket.id, "CLOSED")}
                        disabled={updating === ticket.id}
                      >
                        Close
                      </button>
                      <a className="ghost-button" href={`/admin/support/${ticket.id}`}>
                        Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
