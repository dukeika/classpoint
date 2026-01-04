"use client";

import { useState } from "react";
import { decodeToken } from "../components/auth-utils";
import { graphqlFetch } from "../components/graphql";
import { usePortalAuth } from "../components/portal-auth";

type StudentLink = {
  id: string;
  studentId: string;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string | null;
};

type Parent = {
  id: string;
  primaryPhone?: string | null;
  email?: string | null;
};

export default function PortalChildrenPage() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [linkedStudents, setLinkedStudents] = useState<StudentLink[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenDetails = decodeToken(authToken);
  const tokenEmail = tokenDetails?.email || tokenDetails?.["cognito:username"] || "";
  const tokenPhone = tokenDetails?.phone_number || "";

  const loadChildren = async () => {
    if (!authToken || !schoolId) return;
    setLoading(true);
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
      setLinkedStudents(studentData.studentsByParent || []);
      const studentsData = await graphqlFetch<{ studentsBySchool: Student[] }>(
        `query StudentsBySchool($schoolId: ID!, $limit: Int) {
          studentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            firstName
            lastName
            admissionNo
          }
        }`,
        { schoolId, limit: 200 }
      );
      setStudents(studentsData.studentsBySchool || []);
    } catch (err) {
      setLinkedStudents([]);
      setStudents([]);
      setError(err instanceof Error ? err.message : "Failed to load children.");
    } finally {
      setLoading(false);
    }
  };

  const visibleChildren = linkedStudents
    .map((link) => students.find((student) => student.id === link.studentId))
    .filter((student): student is Student => Boolean(student));

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Children</div>
          <h1>Children</h1>
          <p className="muted">Access each child profile, fees, and results.</p>
        </div>
        <button className="button" onClick={loadChildren} disabled={!authToken || !schoolId || loading}>
          {loading ? "Loading..." : "Load my children"}
        </button>
      </div>

      <div className="card">
        {error && <p>{error}</p>}
        {!loading && !error && visibleChildren.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No children found</strong>
              <span>Click “Load my children” to fetch linked profiles.</span>
            </div>
          </div>
        )}
        <div className="grid">
          {visibleChildren.map((student) => (
            <div key={student.id} className="card">
              <h3>{`${student.firstName} ${student.lastName}`}</h3>
              <p className="muted">{student.admissionNo || "Admission on file"}</p>
              <div className="quick-actions">
                <a className="button" href={`/portal/children/${student.id}/overview`}>
                  Overview
                </a>
                <a className="button" href={`/portal/children/${student.id}/results`}>
                  Results
                </a>
                <a className="button" href="/portal/children/fees">
                  Fees
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
