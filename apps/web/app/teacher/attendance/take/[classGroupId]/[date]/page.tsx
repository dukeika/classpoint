"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId, decodeUserId } from "../../../../../components/auth-utils";
import { graphqlFetch } from "../../../../../components/graphql";
import { useStaffAuth } from "../../../../../components/staff-auth";

type AttendanceTakePageProps = {
  params: { classGroupId: string; date: string };
};

type AttendanceSession = {
  id: string;
  termId?: string | null;
};

type AttendanceEntry = {
  id: string;
  studentId: string;
  status: string;
};

type Enrollment = {
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
  startDate?: string | null;
  status?: string | null;
};

const statusOptions = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

export default function AttendanceTakeDetailPage({ params }: AttendanceTakePageProps) {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const userId = decodeUserId(token);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});
  const [entryByStudent, setEntryByStudent] = useState<Record<string, AttendanceEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const totals = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    Object.values(statusByStudent).forEach((status) => {
      if (status in totals) {
        totals[status as keyof typeof totals] += 1;
      }
    });
    return totals;
  }, [statusByStudent]);

  const loadLatestTerm = async () => {
    if (!token || !schoolId) return null;
    const sessionsData = await graphqlFetch<{ sessionsBySchool: Term[] }>(
      `query SessionsBySchool($schoolId: ID!, $limit: Int) {
        sessionsBySchool(schoolId: $schoolId, limit: $limit) {
          id
          startDate
        }
      }`,
      { schoolId, limit: 5 },
      token
    );
    const sessions = (sessionsData.sessionsBySchool || []).slice().sort((a, b) => {
      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
    });
    const latestSession = sessions[sessions.length - 1];
    if (!latestSession?.id) return null;
    const termsData = await graphqlFetch<{ termsBySession: Term[] }>(
      `query TermsBySession($sessionId: ID!, $limit: Int) {
        termsBySession(sessionId: $sessionId, limit: $limit) {
          id
          startDate
          status
        }
      }`,
      { sessionId: latestSession.id, limit: 6 },
      token
    );
    const terms = (termsData.termsBySession || []).slice().sort((a, b) => {
      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
    });
    return terms.find((term) => term.status === "ACTIVE") || terms[terms.length - 1] || null;
  };

  useEffect(() => {
    const loadRoster = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const sessionData = await graphqlFetch<{ attendanceSessionsByClassAndDay: AttendanceSession[] }>(
          `query AttendanceSessionsByClassAndDay($classGroupId: ID!, $date: AWSDate!, $limit: Int) {
            attendanceSessionsByClassAndDay(classGroupId: $classGroupId, date: $date, limit: $limit) {
              id
              termId
            }
          }`,
          { classGroupId: params.classGroupId, date: params.date, limit: 1 },
          token
        );
        const existingSession = sessionData.attendanceSessionsByClassAndDay?.[0];
        let entryMap: Record<string, AttendanceEntry> = {};
        if (existingSession) {
          setSessionId(existingSession.id);
          if (existingSession.termId) setTermId(existingSession.termId);
          const entryData = await graphqlFetch<{ attendanceEntriesBySession: AttendanceEntry[] }>(
            `query AttendanceEntriesBySession($attendanceSessionId: ID!, $limit: Int) {
              attendanceEntriesBySession(attendanceSessionId: $attendanceSessionId, limit: $limit) {
                id
                studentId
                status
              }
            }`,
            { attendanceSessionId: existingSession.id, limit: 400 },
            token
          );
          entryData.attendanceEntriesBySession?.forEach((entry) => {
            entryMap[entry.studentId] = entry;
          });
          setEntryByStudent(entryMap);
        }

        let resolvedTermId = existingSession?.termId || termId;
        if (!resolvedTermId) {
          const latestTerm = await loadLatestTerm();
          resolvedTermId = latestTerm?.id || null;
          if (resolvedTermId) setTermId(resolvedTermId);
        }
        if (!resolvedTermId) {
          setStudents([]);
          setStatusByStudent({});
          return;
        }

        const enrollmentData = await graphqlFetch<{ enrollmentsByTerm: Enrollment[] }>(
          `query EnrollmentsByTerm($termId: ID!, $classGroupId: ID!, $limit: Int) {
            enrollmentsByTerm(termId: $termId, classGroupId: $classGroupId, limit: $limit) {
              id
              studentId
            }
          }`,
          { termId: resolvedTermId, classGroupId: params.classGroupId, limit: 400 },
          token
        );
        const enrollments = enrollmentData.enrollmentsByTerm || [];
        const studentsData = await graphqlFetch<{ studentsBySchool: Student[] }>(
          `query StudentsBySchool($schoolId: ID!, $limit: Int) {
            studentsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              firstName
              lastName
            }
          }`,
          { schoolId, limit: 800 },
          token
        );
        const studentLookup = new Map((studentsData.studentsBySchool || []).map((s) => [s.id, s]));
        const roster = enrollments
          .map((enrollment) => studentLookup.get(enrollment.studentId))
          .filter(Boolean) as Student[];
        setStudents(roster);
        const initialStatus: Record<string, string> = {};
        roster.forEach((student) => {
          initialStatus[student.id] = entryMap[student.id]?.status || "PRESENT";
        });
        setStatusByStudent(initialStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load roster.");
      } finally {
        setLoading(false);
      }
    };
    loadRoster();
  }, [token, schoolId, params.classGroupId, params.date, termId]);

  const handleSave = async () => {
    if (!token || !schoolId || !termId) {
      setMessage("Unable to save attendance. Missing term information.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const createSession = await graphqlFetch<{ createAttendanceSession: { id: string } }>(
          `mutation CreateAttendanceSession($input: CreateAttendanceSessionInput!) {
            createAttendanceSession(input: $input) {
              id
            }
          }`,
          {
            input: {
              schoolId,
              termId,
              classGroupId: params.classGroupId,
              date: params.date,
              takenByUserId: userId || "system"
            }
          },
          token
        );
        currentSessionId = createSession.createAttendanceSession?.id;
        setSessionId(currentSessionId || null);
        if (!currentSessionId) {
          throw new Error("Unable to create attendance session.");
        }
      }

      const entries = students.map((student) => ({
        studentId: student.id,
        status: statusByStudent[student.id] || "PRESENT"
      }));

      await Promise.all(
        entries.map(async (entry) => {
          const existing = entryByStudent[entry.studentId];
          if (existing?.id) {
            await graphqlFetch(
              `mutation UpdateAttendanceEntry($input: UpdateAttendanceEntryInput!) {
                updateAttendanceEntry(input: $input) {
                  id
                }
              }`,
              { input: { id: existing.id, status: entry.status } },
              token
            );
            return;
          }
          await graphqlFetch(
            `mutation CreateAttendanceEntry($input: CreateAttendanceEntryInput!) {
              createAttendanceEntry(input: $input) {
                id
              }
            }`,
            {
              input: {
                schoolId,
                attendanceSessionId: currentSessionId,
                studentId: entry.studentId,
                status: entry.status
              }
            },
            token
          );
        })
      );
      setMessage("Attendance saved successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Teacher</div>
          <h1>Attendance · {params.classGroupId.toUpperCase()}</h1>
          <p className="muted">Date: {params.date}</p>
        </div>
        <a className="button" href="/teacher/attendance/history">
          View history
        </a>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Roster</h3>
          {loading && (
            <div className="list">
              <div className="line-item">
                <span>Loading roster...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="list">
              <div className="line-item">
                <span>{error}</span>
              </div>
            </div>
          )}
          {!loading && !error && students.length === 0 && (
            <div className="list">
              <div className="line-item">
                <span>No students enrolled for this class and term.</span>
              </div>
            </div>
          )}
          <div className="list">
            {students.map((student) => (
              <div key={student.id} className="line-item">
                <div>
                  <strong>
                    {student.firstName} {student.lastName}
                  </strong>
                  <small>Tap to update status</small>
                </div>
                <div className="attendance-actions">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`pill-toggle ${statusByStudent[student.id] === status ? "active" : ""}`}
                      onClick={() =>
                        setStatusByStudent((prev) => ({
                          ...prev,
                          [student.id]: status
                        }))
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Summary</h3>
          <div className="list">
            <div className="line-item">
              <strong>Total students</strong>
              <span>{students.length}</span>
            </div>
            <div className="line-item">
              <strong>Present</strong>
              <span>{summary.PRESENT}</span>
            </div>
            <div className="line-item">
              <strong>Absent</strong>
              <span>{summary.ABSENT}</span>
            </div>
            <div className="line-item">
              <strong>Late</strong>
              <span>{summary.LATE}</span>
            </div>
            <div className="line-item">
              <strong>Excused</strong>
              <span>{summary.EXCUSED}</span>
            </div>
          </div>
          {message && <p className="muted">{message}</p>}
          <div className="quick-actions">
            <button className="button" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save attendance"}
            </button>
            <a className="ghost-button" href="/teacher/attendance/take">
              Switch class
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
