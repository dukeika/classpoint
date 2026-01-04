"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type AcademicSession = { id: string; name: string };
type Term = { id: string; name: string };
type ClassGroup = { id: string; displayName: string };
type Student = { id: string; firstName: string; lastName: string };
type Parent = { id: string; fullName: string; primaryPhone?: string | null; email?: string | null };
type StudentParentLink = { studentId: string; parentId: string; isPrimary: boolean };
type Invoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  classGroupId?: string | null;
  dueAt?: string | null;
  amountDue: number;
  amountPaid: number;
  status: string;
};

export default function DefaultersPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [minDaysOverdue, setMinDaysOverdue] = useState(0);
  const [minAmountDue, setMinAmountDue] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadStructure = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query DefaultersSetup($schoolId: ID!) {
          sessionsBySchool(schoolId: $schoolId, limit: 20) { id name }
          classGroupsBySchool(schoolId: $schoolId, limit: 200) { id displayName }
          studentsBySchool(schoolId: $schoolId, limit: 500) { id firstName lastName }
          parentsBySchool(schoolId: $schoolId, limit: 500) { id fullName primaryPhone email }
        }`,
        { schoolId },
        token
      );
      const nextSessions = data.sessionsBySchool || [];
      setSessions(nextSessions);
      setClassGroups(data.classGroupsBySchool || []);
      setStudents(data.studentsBySchool || []);
      setParents(data.parentsBySchool || []);
      if (!sessionId && nextSessions.length) {
        setSessionId(nextSessions[0].id);
      }
      setStatus("Filters loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load filters.");
    } finally {
      setLoading(false);
    }
  };

  const loadTerms = async (selectedSession: string) => {
    if (!token || !selectedSession) return;
    try {
      const data = await graphqlFetch(
        `query TermsBySession($sessionId: ID!, $limit: Int) {
          termsBySession(sessionId: $sessionId, limit: $limit) { id name }
        }`,
        { sessionId: selectedSession, limit: 20 },
        token
      );
      setTerms(data.termsBySession || []);
      if (!termId && data.termsBySession?.length) {
        setTermId(data.termsBySession[0].id);
      }
    } catch (_err) {
      setTerms([]);
    }
  };

  useEffect(() => {
    if (token && schoolId) {
      loadStructure();
    }
  }, [token, schoolId]);

  useEffect(() => {
    if (sessionId) {
      loadTerms(sessionId);
    }
  }, [sessionId]);

  const loadDefaulters = async () => {
    if (!token || !schoolId || !termId || !classGroupId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ defaultersByClass: Invoice[] }>(
        `query DefaultersByClass($termId: ID!, $classGroupId: ID!, $minDaysOverdue: Int, $minAmountDue: Float) {
          defaultersByClass(
            termId: $termId
            classGroupId: $classGroupId
            minDaysOverdue: $minDaysOverdue
            minAmountDue: $minAmountDue
          ) {
            id
            invoiceNo
            studentId
            classGroupId
            dueAt
            amountDue
            amountPaid
            status
          }
        }`,
        {
          termId,
          classGroupId,
          minDaysOverdue: Number.isFinite(minDaysOverdue) ? minDaysOverdue : 0,
          minAmountDue: Number.isFinite(minAmountDue) ? minAmountDue : 0
        },
        token
      );
      setInvoices(data.defaultersByClass || []);
      setStatus("Defaulters loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load defaulters.");
    } finally {
      setLoading(false);
    }
  };

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const classGroupMap = useMemo(() => {
    const map = new Map<string, ClassGroup>();
    classGroups.forEach((group) => map.set(group.id, group));
    return map;
  }, [classGroups]);

  const parentMap = useMemo(() => {
    const map = new Map<string, Parent>();
    parents.forEach((parent) => map.set(parent.id, parent));
    return map;
  }, [parents]);

  const totalOutstanding = invoices.reduce((sum, invoice) => sum + (invoice.amountDue || 0), 0);

  const exportCsv = async () => {
    if (invoices.length === 0) {
      setStatus("No defaulters to export.");
      return;
    }
    if (!token || !schoolId) return;
    setStatus("Preparing export...");
    const uniqueStudentIds = Array.from(new Set(invoices.map((invoice) => invoice.studentId)));
    const parentLinks = await Promise.all(
      uniqueStudentIds.map(async (studentId) => {
        try {
          const data = await graphqlFetch<{ parentsByStudent: StudentParentLink[] }>(
            `query ParentsByStudent($studentId: ID!, $limit: Int) {
              parentsByStudent(studentId: $studentId, limit: $limit) {
                studentId
                parentId
                isPrimary
              }
            }`,
            { studentId, limit: 5 },
            token
          );
          return { studentId, links: data.parentsByStudent || [] };
        } catch (_err) {
          return { studentId, links: [] as StudentParentLink[] };
        }
      })
    );
    const parentLinkMap = new Map<string, StudentParentLink[]>();
    parentLinks.forEach((entry) => parentLinkMap.set(entry.studentId, entry.links));
    const rows = [
      "invoiceNo,studentName,classGroup,parentName,parentPhone,parentEmail,dueAt,amountDue,amountPaid,daysOverdue,status",
      ...invoices.map((invoice) => {
        const student = studentMap.get(invoice.studentId);
        const group = invoice.classGroupId ? classGroupMap.get(invoice.classGroupId) : null;
        const links = parentLinkMap.get(invoice.studentId) || [];
        const primary = links.find((link) => link.isPrimary) || links[0];
        const parent = primary ? parentMap.get(primary.parentId) : null;
        const dueAt = invoice.dueAt ? new Date(invoice.dueAt) : null;
        const daysOverdue = dueAt ? Math.floor((Date.now() - dueAt.getTime()) / (1000 * 60 * 60 * 24)) : "";
        const studentName = student ? `${student.firstName} ${student.lastName}` : "";
        return [
          invoice.invoiceNo,
          studentName.replace(/,/g, " "),
          (group?.displayName || "").replace(/,/g, " "),
          (parent?.fullName || "").replace(/,/g, " "),
          parent?.primaryPhone || "",
          parent?.email || "",
          invoice.dueAt || "",
          invoice.amountDue,
          invoice.amountPaid,
          daysOverdue,
          invoice.status
        ].join(",");
      })
    ];
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `defaulters-${termId || "term"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Defaulters export downloaded.");
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Defaulters</h1>
          <p className="muted">Track overdue invoices by class group and term.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadDefaulters} disabled={loading || !termId || !classGroupId}>
            {loading ? "Loading..." : "Load defaulters"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Filters</h3>
          <div className="form-grid">
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
            <select value={termId} onChange={(event) => setTermId(event.target.value)}>
              <option value="">Select term</option>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            <select value={classGroupId} onChange={(event) => setClassGroupId(event.target.value)}>
              <option value="">Select class group</option>
              {classGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.displayName}
                </option>
              ))}
            </select>
            <div className="grid">
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
            </div>
            {status && <p className="muted">{status}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Summary</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Defaulters</strong>
                <small>{invoices.length} invoices</small>
              </div>
              <span className="badge">{invoices.length}</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Total outstanding</strong>
                <small>{totalOutstanding.toLocaleString()}</small>
              </div>
              <span className="badge">NGN</span>
            </div>
            <button className="button" type="button" onClick={exportCsv} disabled={invoices.length === 0}>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Overdue invoices</h3>
        <div className="list-cards">
          {invoices.length === 0 && (
            <div className="list-card">
              <strong>No defaulters yet</strong>
              <span>Adjust filters or check another class.</span>
            </div>
          )}
          {invoices.map((invoice) => {
            const student = studentMap.get(invoice.studentId);
            const group = invoice.classGroupId ? classGroupMap.get(invoice.classGroupId) : null;
            const dueAt = invoice.dueAt ? new Date(invoice.dueAt) : null;
            const daysOverdue = dueAt ? Math.floor((Date.now() - dueAt.getTime()) / (1000 * 60 * 60 * 24)) : null;
            return (
              <div key={invoice.id} className="list-card">
                <strong>{invoice.invoiceNo}</strong>
                <span>
                  {student ? `${student.firstName} ${student.lastName}` : "Student"} ·{" "}
                  {group?.displayName || "Class"}
                </span>
                <span>
                  Due {invoice.amountDue.toLocaleString()} · Paid {invoice.amountPaid.toLocaleString()}
                </span>
                <span>
                  {invoice.dueAt ? `Due ${new Date(invoice.dueAt).toLocaleDateString()}` : "No due date"}
                  {daysOverdue !== null && daysOverdue >= 0 ? ` · ${daysOverdue} days overdue` : ""}
                </span>
                <span className="status-pill">{invoice.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

