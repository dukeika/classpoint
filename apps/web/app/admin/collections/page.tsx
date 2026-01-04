"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type Invoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  termId: string;
  classGroupId?: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  requiredSubtotal: number;
  optionalSubtotal: number;
  discountTotal?: number | null;
  penaltyTotal?: number | null;
  dueAt?: string | null;
  recipients?: MessageRecipient[] | null;
};

type MessageRecipient = {
  id: string;
  destination: string;
  status: string;
  lastError?: string | null;
  statusHistory?: { status: string; at?: string | null; error?: string | null; providerMessageId?: string | null }[];
};

const csvEscape = (value: string) => {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/\"/g, "\"\"")}"`;
  }
  return value;
};

export default function CollectionsPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [termIdInput, setTermIdInput] = useState("");
  const [classGroupIdInput, setClassGroupIdInput] = useState("");
  const [minDaysOverdue, setMinDaysOverdue] = useState(0);
  const [minAmountDue, setMinAmountDue] = useState(0);
  const [defaulters, setDefaulters] = useState<Invoice[]>([]);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [lastErrors, setLastErrors] = useState<string | null>(null);
  const [retryOnFail, setRetryOnFail] = useState(true);
  const [lastReminderNote, setLastReminderNote] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<MessageRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [lastRecipientInvoiceId, setLastRecipientInvoiceId] = useState<string | null>(null);
  const [summaryInvoices, setSummaryInvoices] = useState<Invoice[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);
  const termId = useMemo(() => termIdInput.trim(), [termIdInput]);
  const classGroupId = useMemo(() => classGroupIdInput.trim(), [classGroupIdInput]);

  const totalDue = useMemo(
    () => defaulters.reduce((sum, inv) => sum + (Number(inv.amountDue) || 0), 0),
    [defaulters]
  );

  const summaryTotals = useMemo(() => {
    const totals = summaryInvoices.reduce(
      (acc, inv) => {
        const required = Number(inv.requiredSubtotal) || 0;
        const optional = Number(inv.optionalSubtotal) || 0;
        const discount = Number(inv.discountTotal) || 0;
        const penalty = Number(inv.penaltyTotal) || 0;
        const billed = required + optional - discount + penalty;
        acc.billed += billed;
        acc.paid += Number(inv.amountPaid) || 0;
        acc.due += Number(inv.amountDue) || 0;
        return acc;
      },
      { billed: 0, paid: 0, due: 0 }
    );
    return totals;
  }, [summaryInvoices]);

  const loadDefaulters = async () => {
    if (!authToken || !termId || !classGroupId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query DefaultersByClass(
          $termId: ID!
          $classGroupId: ID!
          $minDaysOverdue: Int
          $minAmountDue: Float
        ) {
          defaultersByClass(
            termId: $termId
            classGroupId: $classGroupId
            minDaysOverdue: $minDaysOverdue
            minAmountDue: $minAmountDue
          ) {
            id
            invoiceNo
            studentId
            termId
            classGroupId
            status
            amountDue
            amountPaid
            requiredSubtotal
            optionalSubtotal
            dueAt
            # for messaging traceability
            recipients: recipientsByInvoice(invoiceId: id, limit: 10) {
              id
              destination
              status
              lastError
              statusHistory { status at error providerMessageId }
            }
          }
        }`,
        {
          termId,
          classGroupId,
          minDaysOverdue,
          minAmountDue
        });
      setDefaulters(data.defaultersByClass || []);
      setLastLoadedAt(new Date().toISOString());
      setStatus("Defaulters loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load defaulters.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipientsForInvoice = async (invoiceId: string) => {
    if (!authToken || !schoolId) return;
    setRecipientsLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query RecipientsByInvoice($invoiceId: ID!) {
          recipientsByInvoice(invoiceId: $invoiceId, limit: 50) {
            id
            destination
            status
            lastError
            statusHistory { status at error providerMessageId }
          }
        }`,
        { invoiceId });
      setRecipients(data.recipientsByInvoice || []);
      setLastRecipientInvoiceId(invoiceId);
      setStatus(`Loaded recipients for invoice ${invoiceId}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load recipients.");
    } finally {
      setRecipientsLoading(false);
    }
  };

  const loadSummary = async () => {
    if (!authToken || !termId || !classGroupId) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await graphqlFetch(
        `query InvoicesByTermClassGroup($termId: ID!, $classGroupId: ID!, $limit: Int) {
          invoicesByTermClassGroup(termId: $termId, classGroupId: $classGroupId, limit: $limit) {
            id
            invoiceNo
            studentId
            termId
            classGroupId
            status
            amountDue
            amountPaid
            requiredSubtotal
            optionalSubtotal
            discountTotal
            penaltyTotal
            dueAt
          }
        }`,
        { termId, classGroupId, limit: 500 });
      setSummaryInvoices(data.invoicesByTermClassGroup || []);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Failed to load summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const exportCsv = () => {
    if (defaulters.length === 0) {
      setStatus("No defaulters to export.");
      return;
    }
    const headers = [
      "invoiceNo",
      "studentId",
      "termId",
      "classGroupId",
      "status",
      "amountDue",
      "amountPaid",
      "requiredSubtotal",
      "optionalSubtotal",
      "dueAt"
    ];
    const rows = defaulters.map((inv) => [
      inv.invoiceNo,
      inv.studentId,
      inv.termId,
      inv.classGroupId || "",
      inv.status,
      String(inv.amountDue ?? 0),
      String(inv.amountPaid ?? 0),
      String(inv.requiredSubtotal ?? 0),
      String(inv.optionalSubtotal ?? 0),
      inv.dueAt || ""
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTerm = termId || "term";
    const safeClass = classGroupId || "class";
    link.href = url;
    link.download = `defaulters-${safeTerm}-${safeClass}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendReminders = async () => {
    if (!authToken || defaulters.length === 0) {
      setStatus("Load defaulters first.");
      return;
    }
    if (!window.confirm(`Send reminders to ${defaulters.length} defaulter(s)?`)) {
      return;
    }
    setSending(true);
    setStatus("");
    setLastErrors(null);
    setLastReminderNote(null);
    try {
      const invoiceIds = defaulters.map((inv) => inv.id);
      await graphqlFetch(
        `mutation SendDefaulters($input: SendDefaulterRemindersInput!) {
          sendDefaulterReminders(input: $input)
        }`,
        {
          input: {
            schoolId,
            termId: termId || null,
            classGroupId: classGroupId || null,
            invoiceIds,
            templateType: "OVERDUE_NOTICE",
            source: "classpoint.collections",
            detailType: "messaging.requested",
            retryOnFail
          }
        });
      setStatus(`Queued ${defaulters.length} reminder(s) for term ${termId || "-"} / class ${classGroupId || "-"}.`);
      setToast(`Queued ${defaulters.length} reminder(s).`);
      setLastReminderNote(
        "Reminder sends record per-recipient statusHistory/lastError in MessageRecipients; retry on failure is " +
          (retryOnFail ? "enabled" : "disabled") +
          "."
      );
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to queue reminders.");
      setToast(null);
      setLastErrors(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Collections</h1>
            <p>Review defaulters and export collections lists.</p>
          </div>
        </div>

        <div className="card fade-up delay-1">
          <h3>Filters</h3>
          <div className="form-grid">
            <input
              placeholder="School ID"
              value={schoolIdInput}
              onChange={(event) => setSchoolIdInput(event.target.value)}
            />
            <input
              placeholder="Term ID"
              value={termIdInput}
              onChange={(event) => setTermIdInput(event.target.value)}
            />
            <input
              placeholder="Class Group ID"
              value={classGroupIdInput}
              onChange={(event) => setClassGroupIdInput(event.target.value)}
            />
            <input
              type="number"
              min={0}
              placeholder="Min days overdue"
              value={minDaysOverdue}
              onChange={(event) => setMinDaysOverdue(Number(event.target.value || 0))}
            />
            <input
              type="number"
              min={0}
              placeholder="Min amount due"
              value={minAmountDue}
              onChange={(event) => setMinAmountDue(Number(event.target.value || 0))}
            />
            <div className="grid">
              <button
                className="button"
                onClick={loadDefaulters}
                disabled={loading || !termId || !classGroupId}
              >
                Load defaulters
              </button>
              <button
                className="button"
                onClick={loadSummary}
                disabled={summaryLoading || !termId || !classGroupId}
              >
                Load collections summary
              </button>
              <button
                className="button"
                type="button"
                onClick={sendReminders}
                disabled={sending || defaulters.length === 0}
              >
                Send reminders
              </button>
              <label className="inline">
                <input
                  type="checkbox"
                  checked={retryOnFail}
                  onChange={(event) => setRetryOnFail(event.target.checked)}
                />{" "}
                Retry on failure
              </label>
              <button className="button" type="button" onClick={exportCsv} disabled={defaulters.length === 0}>
                Export CSV
              </button>
            </div>
            {status && <p>{status}</p>}
            {toast && (
              <div className="chip" role="status">
                {toast}
              </div>
            )}
            {lastReminderNote && <p className="muted">{lastReminderNote}</p>}
            {lastErrors && (
              <div className="warning">
                <strong>Errors:</strong> {lastErrors}
              </div>
            )}
          </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Summary</h3>
            <div className="list">
              <div className="line-item">
                <div>
                  <strong>Records</strong>
                  <small>{defaulters.length}</small>
                </div>
              </div>
              <div className="line-item">
                <div>
                  <strong>Total due</strong>
                  <small>{totalDue.toFixed(2)}</small>
                </div>
              </div>
              {lastLoadedAt && (
                <div className="line-item">
                  <div>
                    <strong>Last refreshed</strong>
                    <small>{new Date(lastLoadedAt).toLocaleString()}</small>
                  </div>
                </div>
              )}
              <div className="line-item">
                <div>
                  <strong>Collections</strong>
                  <small>
                    Billed: {summaryTotals.billed.toFixed(2)} | Paid: {summaryTotals.paid.toFixed(2)} | Due:{" "}
                    {summaryTotals.due.toFixed(2)}
                  </small>
                </div>
              </div>
              {summaryError && (
                <div className="warning">
                  <strong>Summary error:</strong> {summaryError}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Defaulters</h3>
            <div className="list">
              {loading && <p>Loading defaulters...</p>}
              {!loading && defaulters.length === 0 && <p>No defaulters loaded.</p>}
              {defaulters.map((inv) => (
                <div key={inv.id} className="line-item">
                  <div>
                    <strong>{inv.invoiceNo}</strong>
                    <small>Student: {inv.studentId}</small>
                    <small>Due: {inv.amountDue}</small>
                    <small>Due at: {inv.dueAt || "n/a"}</small>
                    {inv.recipients && inv.recipients.length > 0 && (
                      <details>
                        <summary>Recipients ({inv.recipients.length})</summary>
                        <ul>
                          {inv.recipients.map((r) => (
                            <li key={r.id}>
                              {r.destination} — {r.status}
                              {r.lastError ? ` (err: ${r.lastError})` : ""}
                              {r.statusHistory && r.statusHistory.length > 0 && (
                                <ul>
                                  {r.statusHistory.map((h, idx) => (
                                    <li key={`${r.id}-h-${idx}`}>
                                      [{h.at || "-"}] {h.status}
                                      {h.providerMessageId ? ` (${h.providerMessageId})` : ""}
                                      {h.error ? ` err=${h.error}` : ""}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <button
                      className="button"
                      type="button"
                      onClick={() => loadRecipientsForInvoice(inv.id)}
                      disabled={recipientsLoading}
                    >
                      Refresh recipients
                    </button>
                    {lastRecipientInvoiceId === inv.id && recipientsLoading && <small>Refreshing...</small>}
                  </div>
                  <span className="badge">{inv.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

