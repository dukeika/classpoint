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

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
};

type AcademicSession = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

type ClassGroup = {
  id: string;
  displayName: string;
  classYearId: string;
};

type FeeSchedule = {
  id: string;
  name: string;
  classGroupId?: string | null;
  currency?: string | null;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  status: string;
  amountDue: number;
};

export default function InvoicesPage() {
  const { token: authToken, schoolId: sessionSchoolId, isAuthenticated } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [termId, setTermId] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [feeScheduleId, setFeeScheduleId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [createdInvoices, setCreatedInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const name = `${student.firstName} ${student.lastName}`.toLowerCase();
      return (
        name.includes(query) ||
        student.admissionNo.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query)
      );
    });
  }, [students, studentSearch]);

  const selectedClassGroup = useMemo(
    () => classGroups.find((group) => group.id === classGroupId) || null,
    [classGroups, classGroupId]
  );

  useEffect(() => {
    if (!schoolId) return;
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setStatus("");
      try {
        const [studentsData, sessionsData, classGroupsData] = await Promise.all([
          graphqlFetch<{ studentsBySchool: Student[] }>(
            `query StudentsBySchool($schoolId: ID!, $limit: Int) {
              studentsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                admissionNo
                firstName
                lastName
              }
            }`,
            { schoolId, limit: 500 }
          ),
          graphqlFetch<{ sessionsBySchool: AcademicSession[] }>(
            `query SessionsBySchool($schoolId: ID!, $limit: Int) {
              sessionsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                name
                startDate
                endDate
                status
              }
            }`,
            { schoolId, limit: 50 }
          ),
          graphqlFetch<{ classGroupsBySchool: ClassGroup[] }>(
            `query ClassGroupsBySchool($schoolId: ID!, $limit: Int) {
              classGroupsBySchool(schoolId: $schoolId, limit: $limit) {
                id
                displayName
                classYearId
              }
            }`,
            { schoolId, limit: 200 }
          )
        ]);
        if (!active) return;
        setStudents(studentsData.studentsBySchool || []);
        const sessionList = sessionsData.sessionsBySchool || [];
        setSessions(sessionList);
        setClassGroups(classGroupsData.classGroupsBySchool || []);
        const termResponses = await Promise.all(
          sessionList.map((session) =>
            graphqlFetch<{ termsBySession: Term[] }>(
              `query TermsBySession($sessionId: ID!, $limit: Int) {
                termsBySession(sessionId: $sessionId, limit: $limit) {
                  id
                  name
                  startDate
                  endDate
                  status
                }
              }`,
              { sessionId: session.id, limit: 10 }
            )
          )
        );
        if (!active) return;
        setAllTerms(termResponses.flatMap((response) => response.termsBySession || []));
        setStatus("Reference data loaded.");
      } catch (err) {
        if (!active) return;
        setStatus(err instanceof Error ? err.message : "Failed to load reference data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [schoolId]);

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");
      return;
    }
    let active = true;
    const loadTerms = async () => {
      setLoading(true);
      try {
        const data = await graphqlFetch<{ termsBySession: Term[] }>(
          `query TermsBySession($sessionId: ID!, $limit: Int) {
            termsBySession(sessionId: $sessionId, limit: $limit) {
              id
              name
              startDate
              endDate
              status
            }
          }`,
          { sessionId, limit: 10 }
        );
        if (active) {
          setTerms(data.termsBySession || []);
          setAllTerms((prev) => {
            const next = data.termsBySession || [];
            const merged = [...prev];
            next.forEach((term) => {
              if (!merged.find((item) => item.id === term.id)) {
                merged.push(term);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        if (active) {
          setStatus(err instanceof Error ? err.message : "Failed to load terms.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadTerms();
    return () => {
      active = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!studentId) {
      setStudentEnrollments([]);
      setEnrollmentId("");
      return;
    }
    let active = true;
    const loadStudentEnrollments = async () => {
      setLoading(true);
      try {
        const data = await graphqlFetch<{ enrollmentsByStudent: Enrollment[] }>(
          `query EnrollmentsByStudent($studentId: ID!, $limit: Int) {
            enrollmentsByStudent(studentId: $studentId, limit: $limit) {
              id
              studentId
              sessionId
              termId
              classGroupId
            }
          }`,
          { studentId, limit: 50 }
        );
        if (active) {
          const list = data.enrollmentsByStudent || [];
          setStudentEnrollments(list);
          if (list.length) {
            const matched = list.find((item) => item.termId === termId && item.sessionId === sessionId) || null;
            const preferred =
              matched ||
              list.reduce<Enrollment | null>((best, current) => {
                const term = allTerms.find((item) => item.id === current.termId);
                const session = sessions.find((item) => item.id === current.sessionId);
                const termScore = term?.startDate ? Date.parse(term.startDate) : 0;
                const sessionScore = session?.startDate ? Date.parse(session.startDate) : 0;
                const currentScore = Math.max(termScore, sessionScore);
                if (!best) return current;
                const bestTerm = allTerms.find((item) => item.id === best.termId);
                const bestSession = sessions.find((item) => item.id === best.sessionId);
                const bestTermScore = bestTerm?.startDate ? Date.parse(bestTerm.startDate) : 0;
                const bestSessionScore = bestSession?.startDate ? Date.parse(bestSession.startDate) : 0;
                const bestScore = Math.max(bestTermScore, bestSessionScore);
                return currentScore > bestScore ? current : best;
              }, null) ||
              list[0];
            setEnrollmentId(preferred.id);
            setSessionId(preferred.sessionId);
            setTermId(preferred.termId);
            setClassGroupId(preferred.classGroupId);
          }
        }
      } catch (err) {
        if (active) {
          setStatus(err instanceof Error ? err.message : "Failed to load student enrollments.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStudentEnrollments();
    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (!termId || !selectedClassGroup?.classYearId) {
      setFeeSchedules([]);
      setFeeScheduleId("");
      return;
    }
    let active = true;
    const loadFeeSchedules = async () => {
      setLoading(true);
      try {
        const data = await graphqlFetch<{ feeSchedulesByTerm: FeeSchedule[] }>(
          `query FeeSchedulesByTerm($termId: ID!, $classYearId: ID!, $limit: Int) {
            feeSchedulesByTerm(termId: $termId, classYearId: $classYearId, limit: $limit) {
              id
              name
              classGroupId
              currency
            }
          }`,
          { termId, classYearId: selectedClassGroup.classYearId, limit: 50 }
        );
        if (active) {
          setFeeSchedules(data.feeSchedulesByTerm || []);
        }
      } catch (err) {
        if (active) {
          setStatus(err instanceof Error ? err.message : "Failed to load fee schedules.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadFeeSchedules();
    return () => {
      active = false;
    };
  }, [termId, selectedClassGroup]);

  const loadEnrollments = async () => {
    if (!authToken) {
      setStatus("Sign in to load enrollments.");
      return;
    }
    if (!termId || !classGroupId) return;
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
    if (!feeScheduleId) {
      throw new Error("Select a fee schedule before creating invoices.");
    }
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
          enrollmentId: enrollmentId || null,
          sessionId: targetSessionId,
          termId,
          classGroupId: classGroupId || null,
          feeScheduleId,
          dueAt: dueAtIso
        }
      });
  };

  const createSingleInvoice = async () => {
    if (!authToken) {
      setStatus("Sign in to create invoices.");
      return;
    }
    if (!schoolId || !studentId || !sessionId || !termId) return;
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
    if (!authToken) {
      setStatus("Sign in to create invoices.");
      return;
    }
    if (!schoolId || !termId || !classGroupId || !feeScheduleId) {
      setStatus("Select a fee schedule before generating invoices.");
      return;
    }
    const countLabel = enrollments.length ? `${enrollments.length} student(s)` : "all enrollments";
    if (!window.confirm(`Generate invoices for ${countLabel}?`)) return;
    setSaving(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ generateClassInvoices: { createdCount: number; skippedCount: number } }>(
        `mutation GenerateClassInvoices($input: GenerateClassInvoicesInput!) {
          generateClassInvoices(input: $input) {
            createdCount
            skippedCount
          }
        }`,
        {
          input: {
            schoolId,
            sessionId,
            termId,
            classGroupId,
            feeScheduleId,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            skipDuplicates: true
          }
        }
      );
      const createdCount = data.generateClassInvoices?.createdCount || 0;
      const skippedCount = data.generateClassInvoices?.skippedCount || 0;
      setStatus(`Created ${createdCount} invoices. Skipped ${skippedCount} duplicates.`);
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
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
            <select value={termId} onChange={(event) => setTermId(event.target.value)} disabled={!sessionId}>
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
            <select
              value={feeScheduleId}
              onChange={(event) => setFeeScheduleId(event.target.value)}
              disabled={!feeSchedules.length}
            >
              <option value="">Select fee schedule</option>
              {feeSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                  {schedule.classGroupId ? " (Class override)" : ""}
                </option>
              ))}
            </select>
            <input type="date" placeholder="Due date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
            <button
              className="button"
              onClick={loadEnrollments}
              disabled={loading || !termId || !classGroupId || !isAuthenticated}
            >
              Load class enrollments
            </button>
            {!isAuthenticated && <p className="muted">Sign in to load live data and create invoices.</p>}
            {status && <p>{status}</p>}
          </div>
        </div>

        <div className="grid fade-up delay-2">
          <div className="card">
            <h3>Create single invoice</h3>
            <div className="form-grid">
              <input
                placeholder="Search student by name or admission no"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
              />
              <select
                value={studentId}
                onChange={(event) => {
                  setStudentId(event.target.value);
                  setEnrollmentId("");
                }}
              >
                <option value="">Select student</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.admissionNo})
                  </option>
                ))}
              </select>
              <select
                value={enrollmentId}
                onChange={(event) => {
                  const nextEnrollmentId = event.target.value;
                  setEnrollmentId(nextEnrollmentId);
                  const enrollment = studentEnrollments.find((item) => item.id === nextEnrollmentId);
                  if (enrollment) {
                    setSessionId(enrollment.sessionId);
                    setTermId(enrollment.termId);
                    setClassGroupId(enrollment.classGroupId);
                  }
                }}
                disabled={!studentEnrollments.length}
              >
                <option value="">Select enrollment</option>
                {studentEnrollments.map((enrollment) => (
                  <option key={enrollment.id} value={enrollment.id}>
                    {(sessions.find((item) => item.id === enrollment.sessionId)?.name || enrollment.sessionId) +
                      " / " +
                      (allTerms.find((item) => item.id === enrollment.termId)?.name || enrollment.termId) +
                      " / " +
                      (classGroups.find((item) => item.id === enrollment.classGroupId)?.displayName ||
                        enrollment.classGroupId)}
                  </option>
                ))}
              </select>
              <input
                placeholder="Student ID (auto-filled)"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
              <input
                placeholder="Session ID (auto-filled)"
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              />
              <button
                className="button"
                onClick={createSingleInvoice}
                disabled={saving || !schoolId || !studentId || !sessionId || !termId || !isAuthenticated}
              >
                Create invoice
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Bulk class invoices</h3>
            <div className="form-grid">
              <p>Enrollments loaded: {enrollments.length}</p>
              <button
                className="button"
                onClick={createInvoicesForClass}
                disabled={saving || enrollments.length === 0 || !isAuthenticated}
              >
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
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a className="button" href={`/invoices/${invoice.invoiceNo}`} target="_blank" rel="noreferrer">
                    View invoice
                  </a>
                  <a
                    className="button"
                    href={`/portal/children/fees/invoices/${invoice.invoiceNo}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open payment
                  </a>
                  <span className="badge">{invoice.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
