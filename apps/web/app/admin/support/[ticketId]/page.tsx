"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId, decodeToken, decodeUserId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type TicketPageProps = {
  params: { ticketId: string };
};

type SupportTicket = {
  id: string;
  parentId: string;
  studentId?: string | null;
  subject: string;
  category: string;
  detail: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SupportTicketMessage = {
  id: string;
  authorType: string;
  authorId?: string | null;
  body: string;
  createdAt?: string | null;
};

type Parent = {
  id: string;
  fullName: string;
  primaryPhone?: string | null;
  email?: string | null;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

const statusOptions = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

export default function AdminSupportTicketPage({ params }: TicketPageProps) {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const userId = decodeUserId(token);
  const tokenDetails = decodeToken(token);
  const displayName =
    tokenDetails?.name ||
    tokenDetails?.["cognito:username"] ||
    tokenDetails?.email ||
    tokenDetails?.phone_number ||
    "Staff";
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [status, setStatus] = useState("OPEN");
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [parentName, setParentName] = useState<string | null>(null);
  const [parentContact, setParentContact] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setMessage(null);
      try {
        const data = await graphqlFetch<{ supportTicketById: SupportTicket }>(
          `query SupportTicketById($schoolId: ID!, $id: ID!) {
            supportTicketById(schoolId: $schoolId, id: $id) {
              id
              parentId
              studentId
              subject
              category
              detail
              status
              createdAt
              updatedAt
            }
          }`,
          { schoolId, id: params.ticketId },
          token
        );
        setTicket(data.supportTicketById || null);
        setStatus(data.supportTicketById?.status || "OPEN");
        if (data.supportTicketById?.id) {
          const messagesData = await graphqlFetch<{ supportTicketMessagesByTicket: SupportTicketMessage[] }>(
            `query SupportTicketMessagesByTicket($ticketId: ID!, $limit: Int) {
              supportTicketMessagesByTicket(ticketId: $ticketId, limit: $limit) {
                id
                authorType
                authorId
                body
                createdAt
              }
            }`,
            { ticketId: data.supportTicketById.id, limit: 50 },
            token
          );
          setMessages(messagesData.supportTicketMessagesByTicket || []);
        }
        if (data.supportTicketById?.parentId) {
          const parentData = await graphqlFetch<{ parentsBySchool: Parent[] }>(
            `query ParentsBySchool($schoolId: ID!, $limit: Int) {
              parentsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                fullName
                primaryPhone
                email
              }
            }`,
            { schoolId, limit: 200 },
            token
          );
          const match = parentData.parentsBySchool?.find((parent) => parent.id === data.supportTicketById?.parentId);
          if (match) {
            setParentName(match.fullName);
            setParentContact(match.primaryPhone || match.email || null);
          }
        }
        if (data.supportTicketById?.studentId) {
          const studentsData = await graphqlFetch<{ studentsBySchool: Student[] }>(
            `query StudentsBySchool($schoolId: ID!, $limit: Int) {
              studentsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                firstName
                lastName
              }
            }`,
            { schoolId, limit: 400 },
            token
          );
          const match = studentsData.studentsBySchool?.find(
            (student) => student.id === data.supportTicketById?.studentId
          );
          if (match) {
            setStudentName(`${match.firstName} ${match.lastName}`.trim());
          }
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to load ticket.");
        setTicket(null);
      } finally {
        setLoading(false);
      }
    };
    loadTicket();
  }, [token, schoolId, params.ticketId]);

  const handleSend = async () => {
    if (!ticket || !schoolId) return;
    if (!note.trim()) {
      setMessage("Please enter a message.");
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const data = await graphqlFetch<{ createSupportTicketMessage: SupportTicketMessage }>(
        `mutation CreateSupportTicketMessage($input: CreateSupportTicketMessageInput!) {
          createSupportTicketMessage(input: $input) {
            id
            authorType
            authorId
            body
            createdAt
          }
        }`,
        {
          input: {
            schoolId,
            ticketId: ticket.id,
            authorType: "STAFF",
            authorId: userId || "staff",
            body: note.trim()
          }
        },
        token
      );
      const created = data.createSupportTicketMessage;
      if (created) {
        setMessages((prev) => [...prev, created]);
        setNote("");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleUpdate = async () => {
    if (!ticket || !schoolId) return;
    setSaving(true);
    setMessage(null);
    try {
      await graphqlFetch(
        `mutation UpdateSupportTicketStatus($input: UpdateSupportTicketStatusInput!) {
          updateSupportTicketStatus(input: $input) {
            id
          }
        }`,
        { input: { schoolId, id: ticket.id, status } },
        token
      );
      setTicket((prev) => (prev ? { ...prev, status } : prev));
      setMessage("Ticket status updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Support</div>
          <h1>Support ticket {params.ticketId}</h1>
          <p className="muted">Review the request and update the status.</p>
        </div>
        <a className="button" href="/admin/support">
          Back to queue
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Request details</h3>
          <div className="list">
            {loading && (
              <div className="line-item">
                <span>Loading ticket...</span>
              </div>
            )}
            {!loading && !ticket && (
              <div className="line-item">
                <span>Ticket not found.</span>
              </div>
            )}
            {ticket && (
              <>
                <div className="line-item">
                  <div>
                    <strong>{ticket.subject}</strong>
                    <small>{ticket.category}</small>
                  </div>
                  <span className="status-pill">{ticket.status}</span>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Details</strong>
                    <small>{ticket.detail}</small>
                  </div>
                </div>
                <div className="line-item">
                  <strong>Parent</strong>
                  <span>{parentName || "Parent record"}</span>
                </div>
                {parentContact && (
                  <div className="line-item">
                    <strong>Parent contact</strong>
                    <span>{parentContact}</span>
                  </div>
                )}
                <div className="line-item">
                  <strong>Student</strong>
                  <span>{studentName || "Not linked"}</span>
                </div>
                <div className="line-item">
                  <strong>Opened</strong>
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Recently"}</span>
                </div>
                <div className="line-item">
                  <strong>Updated</strong>
                  <span>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "Pending"}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <h3>Update status</h3>
          <div className="form-grid">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {message && <p className="muted">{message}</p>}
            <button className="button" type="button" onClick={handleUpdate} disabled={saving || !ticket}>
              {saving ? "Updating..." : "Save status"}
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Conversation</h3>
          <div className="list">
            {messages.length === 0 && <div className="line-item">No updates yet.</div>}
            {messages.map((entry) => (
              <div key={entry.id} className="line-item">
                <div>
                  <strong>{entry.authorType === "STAFF" ? displayName : "Parent"}</strong>
                  <small>{entry.body}</small>
                </div>
                <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Just now"}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Send an update</h3>
          <div className="form-grid">
            <textarea
              rows={4}
              placeholder="Add a response for the parent."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button className="button" type="button" onClick={handleSend} disabled={sending || !ticket}>
              {sending ? "Sending..." : "Send message"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

