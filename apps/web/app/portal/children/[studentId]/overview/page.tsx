"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string | null;
  dob?: string | null;
  gender?: string | null;
  status?: string | null;
};

export default function PortalChildOverviewPage({ params }: { params: { studentId: string } }) {
  const { token: authToken, schoolId } = usePortalAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadStudent = async () => {
      if (!authToken || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ studentsBySchool: Student[] }>(
          `query StudentsBySchool($schoolId: ID!, $limit: Int) {
            studentsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              firstName
              lastName
              admissionNo
              dob
              gender
              status
            }
          }`,
          { schoolId, limit: 200 }
        );
        const match = (data.studentsBySchool || []).find((item: Student) => item.id === params.studentId);
        setStudent(match || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load student.");
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [authToken, schoolId, params.studentId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Children / Overview</div>
          <h1>{student ? `${student.firstName} ${student.lastName}` : "Student overview"}</h1>
          <p className="muted">Profile details, fees, and results for this child.</p>
        </div>
        <a className="button" href="/portal/children/fees">
          View fees
        </a>
      </div>

      {loading && (
        <div className="card">
          <p>Loading student...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !student && (
        <div className="card">
          <p>Student not found.</p>
        </div>
      )}

      {student && (
        <div className="grid">
          <div className="card">
            <h3>Profile</h3>
            <div className="summary">
              <div className="summary-row">
                <span>Admission No</span>
                <span>{student.admissionNo || "On file"}</span>
              </div>
              <div className="summary-row">
                <span>Gender</span>
                <span>{student.gender || "—"}</span>
              </div>
              <div className="summary-row">
                <span>Date of birth</span>
                <span>{student.dob ? new Date(student.dob).toLocaleDateString() : "—"}</span>
              </div>
              <div className="summary-row">
                <span>Status</span>
                <span className="status-pill">{student.status || "Active"}</span>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>Quick actions</h3>
            <div className="quick-actions">
              <a className="button" href={`/portal/children/${student.id}/results`}>
                View results
              </a>
              <a className="button" href={`/portal/children/${student.id}/attendance`}>
                Attendance
              </a>
              <a className="button" href="/portal/children/fees">
                Pay fees
              </a>
              <a className="button" href="/portal/announcements">
                Announcements
              </a>
              <a className="button" href={`/portal/children/${student.id}/attendance`}>
                Attendance
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
