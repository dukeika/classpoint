"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type Enrollment = {
  id: string;
  studentId: string;
  sessionId: string;
  termId: string;
  classGroupId: string;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  status: string;
  amountDue: number;
};

export default function InvoicesPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [termId, setTermId] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [feeScheduleId, setFeeScheduleId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [createdInvoices, setCreatedInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);

  const loadEnrollments = async () => {
    if (!authToken || !termId || !classGroupId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query EnrollmentsByTermClassGroup($termId: ID!, $classGroupId: ID!, $limit: Int) {
          enrollmentsByTermClassGroup(termId: $termId, classGroupId: $classGroupId, limit: $limit) {
            id
            studentId
            sessionId
            termId
            classGroupId
          }
        }`,
        { termId, classGroupId, limit: 200 });
      setEnrollments(data.enrollmentsByTermClassGroup || []);
      setStatus("Enrollments loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (targetStudentId: string, targetSessionId: string) => {
    const dueAtIso = dueAt ? new Date(dueAt).toISOString() : null;
    return graphqlFetch(
      `mutation CreateInvoice($input: CreateInvoiceInput!) {
        createInvoice(input: $input) {
          id
          invoiceNo
          studentId
          status
          amountDue
        }
      }`,
      {
        input: {
          schoolId,
          studentId: targetStudentId,
          sessionId: targetSessionId,
          termId,
          classGroupId: classGroupId || null,
          feeScheduleId: feeScheduleId || null,
          dueAt: dueAtIso
        }
      });
  };

  const createSingleInvoice = async () => {
    if (!authToken || !schoolId || !studentId || !sessionId || !termId) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await createInvoice(studentId, sessionId);
      const invoice = data.createInvoice;
      setCreatedInvoices((prev) => [invoice, ...prev]);
      setStatus(`Invoice created for ${studentId}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  const createInvoicesForClass = async () => {
    if (!authToken || !schoolId || !termId || !classGroupId || enrollments.length === 0) return;
    if (!window.confirm(`Generate invoices for ${enrollments.length} student(s)?`)) return;
    setSaving(true);
    setStatus("");
    try {
      const created: Invoice[] = [];
      for (const enrollment of enrollments) {
        const data = await createInvoice(enrollment.studentId, enrollment.sessionId);
        if (data.createInvoice) {
          created.push(data.createInvoice);
        }
      }
      setCreatedInvoices((prev) => [...created, ...prev]);
      setStatus(`Created ${created.length} invoices.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to create invoices.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Invoice generation</h1>
            <p>Create invoices for students or class groups.</p>
          </div>
        </div>

        <div className="card fade-up delay-1">
          <h3>Context</h3>
          <div className="form-grid">
            <input
              placeholder="School ID"
              value={schoolIdInput}
              onChange={(event) => setSchoolIdInput(event.target.value)}
            />
            <input placeholder="Term ID" value={termId} onChange={(event) => setTermId(event.target.value)} />
            <input
              placeholder="Class group ID"
              value={classGroupId}
              onChange={(event) => setClassGroupId(event.target.value)}
            />
            <input
              placeholder="Fee schedule ID (optional)"
              value={feeScheduleId}
              onChange={(event) => setFeeScheduleId(event.target.value)}
            />
            <input type="date" placeholder="Due date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            <button className="button" onClick={loadEnrollments} disabled={loading || !termId || !classGroupId}>
              Load class enrollments
            </button>
            {status && <p>{status}</p>}
          </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Create single invoice</h3>
            <div className="form-grid">
              <input
                placeholder="Student ID"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
              <input
                placeholder="Session ID"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              />
              <button className="button" onClick={createSingleInvoice} disabled={saving || !studentId || !sessionId || !termId}>
                Create invoice
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Bulk class invoices</h3>
            <div className="form-grid">
              <p>Enrollments loaded: {enrollments.length}</p>
              <button className="button" onClick={createInvoicesForClass} disabled={saving || enrollments.length === 0}>
                Generate class invoices
              </button>
            </div>
          </div>
        </div>

        <div className="card fade-up delay-3">
          <h3>Recently created</h3>
          <div className="list">
            {createdInvoices.length === 0 && <p>No invoices created yet.</p>}
            {createdInvoices.map((invoice) => (
              <div key={invoice.id} className="line-item">
                <div>
                  <strong>{invoice.invoiceNo}</strong>
                  <small>{invoice.studentId}</small>
                </div>
                <span className="badge">{invoice.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

