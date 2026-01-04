"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId, decodeToken } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type TicketPageProps = {
  params: { ticketId: string };
};

type SupportTicket = {
  id: string;
  parentId: string;
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

export default function PortalSupportTicketPage({ params }: TicketPageProps) {
  const { token } = usePortalAuth();
  const schoolId = decodeSchoolId(token);
  const tokenDetails = decodeToken(token);
  const displayName =
    tokenDetails?.name ||
    tokenDetails?.["cognito:username"] ||
    tokenDetails?.email ||
    tokenDetails?.phone_number ||
    "Parent";
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ supportTicketById: SupportTicket }>(
          `query SupportTicketById($schoolId: ID!, $id: ID!) {
            supportTicketById(schoolId: $schoolId, id: $id) {
              id
              parentId
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ticket.");
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
      setError("Please enter a message.");
      return;
    }
    setSending(true);
    setError(null);
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
            authorType: "PARENT",
            authorId: ticket.parentId,
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
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Parent portal</div>
          <h1>Support ticket {params.ticketId}</h1>
          <p className="muted">Track updates and communicate with the bursar.</p>
        </div>
        <a className="button" href="/portal/support">
          Back to support
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Ticket summary</h3>
          <div className="list">
            {loading && (
              <div className="line-item">
                <span>Loading ticket details...</span>
              </div>
            )}
            {error && (
              <div className="line-item">
                <span>{error}</span>
              </div>
            )}
            {!loading && !error && !ticket && (
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
                  <strong>Opened</strong>
                  <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : "Recently"}</span>
                </div>
                <div className="line-item">
                  <strong>Last updated</strong>
                  <span>{ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "Pending"}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="card">
          <h3>Send a message</h3>
          <div className="form-grid">
            <textarea
              rows={4}
              placeholder="Add a note or attach more details."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button className="button" type="button" onClick={handleSend} disabled={sending || !ticket}>
              {sending ? "Sending..." : "Send update"}
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Conversation</h3>
          <div className="list">
            {messages.length === 0 && <div className="line-item">No updates yet.</div>}
            {messages.map((message) => (
              <div key={message.id} className="line-item">
                <div>
                  <strong>{message.authorType === "PARENT" ? displayName : "School team"}</strong>
                  <small>{message.body}</small>
                </div>
                <span>{message.createdAt ? new Date(message.createdAt).toLocaleString() : "Just now"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

