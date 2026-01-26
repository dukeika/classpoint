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
  const [localSchoolId, setLocalSchoolId] = useState("");

  const tokenDetails = decodeToken(authToken);
  const tokenEmail = tokenDetails?.email || tokenDetails?.["cognito:username"] || "";
  const tokenPhone = tokenDetails?.phone_number || "";
  const effectiveSchoolId = schoolId || localSchoolId;

  const loadChildren = async () => {
    if (!authToken) {
      setError("Sign in to load your children.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let resolvedSchoolId = effectiveSchoolId;
      if (!resolvedSchoolId && typeof window !== "undefined") {
        const host = window.location.hostname.split(":")[0];
        const root = ".classpoint.ng";
        if (host.endsWith(root)) {
          const slug = host.slice(0, -root.length);
          if (slug === "demo-school" || slug === "demo") {
            resolvedSchoolId = "sch_lagos_demo_001";
            setLocalSchoolId(resolvedSchoolId);
          }
          if (slug && !resolvedSchoolId) {
            const schoolRes = await fetch("/api/public-graphql", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `query SchoolBySlug($slug: String!) { schoolBySlug(slug: $slug) { id } }`,
                variables: { slug }
              })
            });
            const schoolPayload = (await schoolRes.json()) as { data?: { schoolBySlug?: { id?: string } } };
            resolvedSchoolId = schoolPayload?.data?.schoolBySlug?.id || "";
            if (resolvedSchoolId) setLocalSchoolId(resolvedSchoolId);
          }
        }
      }
      if (!resolvedSchoolId) {
        throw new Error("School context missing. Please refresh and try again.");
      }
      const parentsData = await graphqlFetch<{ parentsBySchool: Parent[] }>(
        `query ParentsBySchool($schoolId: ID!, $limit: Int) {
          parentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            primaryPhone
            email
          }
        }`,
        { schoolId: resolvedSchoolId, limit: 200 }
      );
      const parents: Parent[] = parentsData.parentsBySchool || [];
      let match = parents.find(
        (parent) =>
          (tokenEmail && parent.email === tokenEmail) ||
          (tokenPhone && parent.primaryPhone === tokenPhone)
      );
      if (!match && resolvedSchoolId === "sch_lagos_demo_001") {
        match = { id: "par_demo_001", email: "demo.parent@classpoint.ng" };
      }
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
        { schoolId: resolvedSchoolId, limit: 200 }
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
        <button className="button" onClick={loadChildren} disabled={!authToken || loading}>
          {loading ? "Loading..." : "Load my children"}
        </button>
      </div>

      <div className="card">
        {!authToken && <p className="muted">Sign in to load your children.</p>}
        {error && <p>{error}</p>}
        {!loading && !error && visibleChildren.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No children found</strong>
              <span>Click “Load my children” to fetch linked profiles, or contact your school if nothing appears.</span>
              <span className="muted">Need help? support@classpoint.ng</span>
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
