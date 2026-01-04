"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeToken } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { usePortalAuth } from "../../components/portal-auth";

type Invoice = {
  id: string;
  invoiceNo: string;
  termId: string;
  dueAt?: string | null;
  issuedAt?: string | null;
  amountDue: number;
  status: string;
};

type StudentLink = {
  id: string;
  studentId: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
};

type Term = {
  id: string;
  name?: string | null;
  startDate?: string | null;
  status?: string | null;
};

type Parent = {
  id: string;
  primaryPhone?: string | null;
  email?: string | null;
};

export default function PortalFeesPage() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [studentId, setStudentId] = useState("");
  const [termId, setTermId] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<StudentLink[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [parentName, setParentName] = useState<string | null>(null);
  const [termsRefreshedAt, setTermsRefreshedAt] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DUE" | "PAID">("ALL");
  const [sortMode, setSortMode] = useState<"DUE" | "AMOUNT">("DUE");
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenDetails = decodeToken(authToken);
  const tokenEmail = tokenDetails?.email || tokenDetails?.["cognito:username"] || "";
  const tokenPhone = tokenDetails?.phone_number || "";
  const canLoadInvoices = Boolean(authToken && studentId && termId);
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "PAID") return invoice.status === "PAID";
      return invoice.status !== "PAID";
    });
  }, [invoices, statusFilter]);
  const summaryTotal = filteredInvoices.reduce((sum, invoice) => sum + invoice.amountDue, 0);
  const summaryPaid = filteredInvoices.filter((invoice) => invoice.status === "PAID").length;
  const summaryDue = filteredInvoices.filter((invoice) => invoice.status !== "PAID").length;
  const selectedTerm = terms.find((term) => term.id === termId);
  const selectedStudent = students.find((student) => student.id === studentId);
  const sortedInvoices = useMemo(() => {
    return filteredInvoices.slice().sort((a, b) => {
      if (sortMode === "AMOUNT") {
        return b.amountDue - a.amountDue;
      }
      const aDate = a.dueAt ? new Date(a.dueAt).getTime() : 0;
      const bDate = b.dueAt ? new Date(b.dueAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [filteredInvoices, sortMode]);

  const loadChildren = async () => {
    if (!authToken || !schoolId) return;
    setLoadingChildren(true);
    setError(null);
    try {
      const parentsData = await graphqlFetch<{ parentsBySchool: Parent[] }>(
        `query ParentsBySchool($schoolId: ID!, $limit: Int) {
          parentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            primaryPhone
            email
          }
        }`,
        { schoolId, limit: 200 }
      );
      const parents: Parent[] = parentsData.parentsBySchool || [];
      const match = parents.find(
        (parent) =>
          (tokenEmail && parent.email === tokenEmail) ||
          (tokenPhone && parent.primaryPhone === tokenPhone)
      );
      if (!match) {
        throw new Error("Parent profile not found for this account.");
      }
      const studentData = await graphqlFetch<{ studentsByParent: StudentLink[] }>(
        `query StudentsByParent($parentId: ID!, $limit: Int) {
          studentsByParent(parentId: $parentId, limit: $limit) {
            id
            studentId
          }
        }`,
        { parentId: match.id, limit: 20 }
      );
      const items: StudentLink[] = studentData.studentsByParent || [];
      setLinkedStudents(items);
      setParentName(tokenDetails?.name || null);
      if (items.length > 0) {
        setStudentId((prev) => prev || items[0].studentId);
      }
      const studentsData = await graphqlFetch<{ studentsBySchool: Student[] }>(
        `query StudentsBySchool($schoolId: ID!, $limit: Int) {
          studentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            firstName
            lastName
          }
        }`,
        { schoolId, limit: 200 }
      );
      setStudents(studentsData.studentsBySchool || []);
      if (!termId) {
        setLoadingTerm(true);
                  try {
                    const sessionsData = await graphqlFetch<{ sessionsBySchool: Term[] }>(
                      `query SessionsBySchool($schoolId: ID!, $limit: Int) {
                        sessionsBySchool(schoolId: $schoolId, limit: $limit) {
                          id
                          startDate
                        }
                      }`,
            { schoolId, limit: 5 }
          );
                    const sessions = (sessionsData.sessionsBySchool || []).slice().sort((a: Term, b: Term) => {
                      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
                    });
                    const latestSession = sessions[sessions.length - 1];
          if (latestSession?.id) {
            const termsData = await graphqlFetch<{ termsBySession: Term[] }>(
              `query TermsBySession($sessionId: ID!, $limit: Int) {
                          termsBySession(sessionId: $sessionId, limit: $limit) {
                            id
                            startDate
                            name
                            status
                          }
                        }`,
                        { sessionId: latestSession.id, limit: 5 }
            );
                      const termsList = (termsData.termsBySession || []).slice().sort((a: Term, b: Term) => {
                        return String(a.startDate || "").localeCompare(String(b.startDate || ""));
                      });
                      setTerms(termsList);
                      setTermsRefreshedAt(new Date().toISOString());
                      const latestTerm = termsList[termsList.length - 1];
                      if (latestTerm?.id) {
                        setTermId(latestTerm.id);
                      }
          }
        } catch (err) {
          // Optional: skip auto term selection if not configured.
        } finally {
          setLoadingTerm(false);
        }
      }
    } catch (err) {
      setLinkedStudents([]);
      setStudents([]);
      setParentName(null);
      setError(err instanceof Error ? err.message : "Failed to load children.");
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    const loadInvoices = async () => {
      if (!canLoadInvoices) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ invoicesByStudent: Invoice[] }>(
          `query InvoicesByStudent($studentId: ID!, $termId: ID!, $limit: Int) {
            invoicesByStudent(studentId: $studentId, termId: $termId, limit: $limit) {
              id
              invoiceNo
              termId
              dueAt
              issuedAt
              amountDue
              status
            }
          }`,
          { studentId, termId, limit: 20 }
        );
        setInvoices(data.invoicesByStudent || []);
      } catch (err) {
        setInvoices([]);
        setError(err instanceof Error ? err.message : "Failed to load invoices.");
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, [authToken, canLoadInvoices, studentId, termId]);

  useEffect(() => {
    const savedChild = window.localStorage.getItem("cp.portal.child") || "";
    const savedTerm = window.localStorage.getItem("cp.portal.term") || "";
    const cachedStudents = window.localStorage.getItem("cp.portal.students");
    const cachedTerms = window.localStorage.getItem("cp.portal.terms");
    if (savedChild) setStudentId(savedChild);
    if (savedTerm) setTermId(savedTerm);
    if (cachedStudents) {
      try {
        const parsed = JSON.parse(cachedStudents);
        if (Array.isArray(parsed)) setStudents(parsed);
      } catch (err) {
        // ignore cached parse errors
      }
    }
    if (cachedTerms) {
      try {
        const parsed = JSON.parse(cachedTerms);
        if (Array.isArray(parsed)) setTerms(parsed);
      } catch (err) {
        // ignore cached parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      window.localStorage.setItem("cp.portal.child", studentId);
    }
  }, [studentId]);

  useEffect(() => {
    if (termId) {
      window.localStorage.setItem("cp.portal.term", termId);
    }
  }, [termId]);

  useEffect(() => {
    if (students.length > 0) {
      window.localStorage.setItem("cp.portal.students", JSON.stringify(students));
    }
  }, [students]);

  useEffect(() => {
    if (terms.length > 0) {
      window.localStorage.setItem("cp.portal.terms", JSON.stringify(terms));
    }
  }, [terms]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Fees / Invoices</div>
          <h1>Invoices</h1>
          <p className="muted">Review balances and pay term invoices for each child.</p>
        </div>
        <button className="button">Pay selected</button>
      </div>

      <div className="card">
        <div className="quick-actions">
          <button
            className="button"
            disabled={!authToken || loadingChildren || !schoolId}
            onClick={loadChildren}
          >
            {loadingChildren ? "Loading..." : "Load my children"}
          </button>
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">Select child</option>
            {linkedStudents.map((child) => (
              <option key={child.id} value={child.studentId}>
                {(() => {
                  const match = students.find((student) => student.id === child.studentId);
                  if (!match) return "Student on record";
                  return `${match.firstName} ${match.lastName}`.trim();
                })()}
              </option>
            ))}
          </select>
          <select value={termId} onChange={(event) => setTermId(event.target.value)}>
            <option value="">Select term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name || term.id}
              </option>
            ))}
          </select>
          {terms.length === 0 && (
            <span className="muted">No terms loaded yet. Click “Load my children”.</span>
          )}
          <span className="status-pill">
            {loading || loadingTerm ? "Loading..." : "Auto"}
          </span>
          <button
            className={`chip ${statusFilter === "ALL" ? "active" : ""}`}
            onClick={() => setStatusFilter("ALL")}
            type="button"
          >
            All
          </button>
          <button
            className={`chip ${statusFilter === "DUE" ? "active" : ""}`}
            onClick={() => setStatusFilter("DUE")}
            type="button"
          >
            Due
          </button>
          <button
            className={`chip ${statusFilter === "PAID" ? "active" : ""}`}
            onClick={() => setStatusFilter("PAID")}
            type="button"
          >
            Paid
          </button>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as "DUE" | "AMOUNT")}>
            <option value="DUE">Sort: due date</option>
            <option value="AMOUNT">Sort: amount</option>
          </select>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setStudentId("");
              setTermId("");
              setInvoices([]);
              setStatusFilter("ALL");
              window.localStorage.removeItem("cp.portal.child");
              window.localStorage.removeItem("cp.portal.term");
            }}
          >
            Clear selection
          </button>
        </div>
        {parentName && <p className="muted">Linked children for {parentName}.</p>}
      </div>

      <div className="card">
        {!loading && !error && (
          <div className="summary summary-sticky">
            <div className="summary-row">
              <span>Invoices</span>
              <span>{filteredInvoices.length}</span>
            </div>
            <div className="summary-row">
              <span>Paid</span>
              <span>{summaryPaid}</span>
            </div>
            <div className="summary-row">
              <span>Due</span>
              <span>{summaryDue}</span>
            </div>
            <div className="summary-row total">
              <span>Total due</span>
              <span>{summaryTotal.toLocaleString()}</span>
            </div>
            {selectedTerm && (
              <div className="summary-row">
                <span>Term</span>
                <span className="status-pill">{selectedTerm.name || selectedTerm.id}</span>
              </div>
            )}
            {selectedTerm?.status && (
              <div className="summary-row">
                <span>Term status</span>
                <span className="status-pill">{selectedTerm.status}</span>
              </div>
            )}
            {selectedStudent && (
              <div className="summary-row">
                <span>Student</span>
                <span className="status-pill">{`${selectedStudent.firstName} ${selectedStudent.lastName}`}</span>
              </div>
            )}
            {termsRefreshedAt && (
              <div className="summary-row">
                <span>Terms refreshed</span>
                <span className="muted">{new Date(termsRefreshedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
        {error && <p>{error}</p>}
        {loading && (
          <div className="list-cards">
            <div className="list-card">
              <strong>Loading invoices...</strong>
              <span>Fetching the latest fee breakdowns.</span>
            </div>
            <div className="list-card">
              <strong>Preparing summary</strong>
              <span>Please wait a moment.</span>
            </div>
          </div>
        )}
        {!loading && !error && invoices.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No invoices loaded</strong>
              <span>Select a child and term to view invoices.</span>
              {!linkedStudents.length && (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setLinkedStudents([]);
                    setStudents([]);
                    setParentName(null);
                    setError(null);
                    window.localStorage.removeItem("cp.portal.students");
                    window.localStorage.removeItem("cp.portal.terms");
                    loadChildren();
                  }}
                >
                  Reload children
                </button>
              )}
            </div>
          </div>
        )}
        <details className="summary-toggle" open>
          <summary className="ghost-button">Toggle summary</summary>
          <div className="summary summary-sticky">
            <div className="summary-row">
              <span>Invoices</span>
              <span>{filteredInvoices.length}</span>
            </div>
            <div className="summary-row">
              <span>Paid</span>
              <span>{summaryPaid}</span>
            </div>
            <div className="summary-row">
              <span>Due</span>
              <span>{summaryDue}</span>
            </div>
            <div className="summary-row total">
              <span>Total due</span>
              <span>{summaryTotal.toLocaleString()}</span>
            </div>
            {selectedTerm && (
              <div className="summary-row">
                <span>Term</span>
                <span className="status-pill">{selectedTerm.name || selectedTerm.id}</span>
              </div>
            )}
            {selectedStudent && (
              <div className="summary-row">
                <span>Student</span>
                <span className="status-pill">{`${selectedStudent.firstName} ${selectedStudent.lastName}`}</span>
              </div>
            )}
            {termsRefreshedAt && (
              <div className="summary-row">
                <span>Terms refreshed</span>
                <span className="muted">{new Date(termsRefreshedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </details>

        <div className="desktop-only">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Term</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNo}</td>
                      <td>{invoice.termId}</td>
                      <td>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "N/A"}</td>
                      <td>{invoice.amountDue.toLocaleString()}</td>
                      <td>
                        <span className="status-pill">{invoice.status}</span>
                      </td>
                      <td className="muted">
                        {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <a className="ghost-button" href={`/portal/children/fees/invoices/${invoice.invoiceNo}`}>
                          Pay now
                        </a>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mobile-only list-cards">
          {sortedInvoices.map((invoice) => (
              <div key={invoice.id} className="list-card">
                <strong>{invoice.invoiceNo}</strong>
                <span>{invoice.termId}</span>
                <span>
                  {invoice.amountDue.toLocaleString()} - Due{" "}
                  {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "N/A"}
                </span>
                <span className="muted">
                  Last updated: {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "—"}
                </span>
                <span className="status-pill">{invoice.status}</span>
                <a className="ghost-button" href={`/portal/children/fees/invoices/${invoice.invoiceNo}`}>
                  Pay now
                </a>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
