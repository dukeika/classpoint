"use client";

import { useState } from "react";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type AttendanceSession = {
  id: string;
  date: string;
  classGroupId: string;
};

type AttendanceEntry = {
  id: string;
  status: string;
};

export default function PortalChildAttendancePage({ params }: { params: { studentId: string } }) {
  const { token: authToken, schoolId } = usePortalAuth();
  const [classGroupId, setClassGroupId] = useState("");
  const [date, setDate] = useState("");
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadAttendance = async () => {
    if (!authToken || !schoolId || !classGroupId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const sessionData = await graphqlFetch<{ attendanceSessionsByClassAndDay: AttendanceSession[] }>(
        `query AttendanceSessionsByClassAndDay($classGroupId: ID!, $date: AWSDate!, $limit: Int) {
          attendanceSessionsByClassAndDay(classGroupId: $classGroupId, date: $date, limit: $limit) {
            id
            date
            classGroupId
          }
        }`,
        { classGroupId, date, limit: 1 }
      );
      const attendanceSession = sessionData.attendanceSessionsByClassAndDay?.[0] || null;
      setSession(attendanceSession);
      if (attendanceSession?.id) {
        const entriesData = await graphqlFetch<{ attendanceEntriesBySession: AttendanceEntry[] }>(
          `query AttendanceEntriesBySession($attendanceSessionId: ID!, $limit: Int) {
            attendanceEntriesBySession(attendanceSessionId: $attendanceSessionId, limit: $limit) {
              id
              status
            }
          }`,
          { attendanceSessionId: attendanceSession.id, limit: 200 }
        );
        setEntries(entriesData.attendanceEntriesBySession || []);
      } else {
        setEntries([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance.");
      setSession(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Children / Attendance</div>
          <h1>Attendance</h1>
          <p className="muted">Check daily attendance records for this child.</p>
        </div>
        <a className="button" href={`/portal/children/${params.studentId}/overview`}>
          Back to overview
        </a>
      </div>

      <div className="card">
        <div className="quick-actions">
          <input
            className="chip-input"
            placeholder="Class Group ID"
            value={classGroupId}
            onChange={(event) => setClassGroupId(event.target.value)}
          />
          <input
            className="chip-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <button className="button" onClick={loadAttendance} disabled={!authToken || !classGroupId || !date || loading}>
            {loading ? "Loading..." : "Load attendance"}
          </button>
        </div>
      </div>

      <div className="card">
        {error && <p>{error}</p>}
        {!loading && !error && !session && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No attendance found</strong>
              <span>Pick a class group and date to view attendance.</span>
            </div>
          </div>
        )}
        {session && (
          <div className="summary">
            <div className="summary-row">
              <span>Session</span>
              <span>{session.id}</span>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <span>{new Date(session.date).toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span>Entries</span>
              <span>{entries.length}</span>
            </div>
          </div>
        )}
        <div className="list-cards">
          {entries.map((entry) => (
            <div key={entry.id} className="list-card">
              <strong>{entry.status}</strong>
              <span>Attendance entry</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
