"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId, decodeToken } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

const categories = ["Payment dispute", "Receipt request", "Technical issue", "Other"];

type Parent = {
  id: string;
  primaryPhone?: string | null;
  email?: string | null;
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

export default function PortalSupportNewPage() {
  const { token } = usePortalAuth();
  const schoolId = decodeSchoolId(token);
  const tokenDetails = decodeToken(token);
  const tokenEmail = tokenDetails?.email || tokenDetails?.["cognito:username"] || "";
  const tokenPhone = tokenDetails?.phone_number || "";
  const [parentId, setParentId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<StudentLink[]>([]);
  const [subject, setSubject] = useState("Clarify fee balance for Term 2");
  const [category, setCategory] = useState(categories[0]);
  const [detail, setDetail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadParent = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setMessage(null);
      try {
        const parentsData = await graphqlFetch<{ parentsBySchool: Parent[] }>(
          `query ParentsBySchool($schoolId: ID!, $limit: Int) {
            parentsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              primaryPhone
              email
            }
          }`,
          { schoolId, limit: 200 },
          token
        );
        const parents = parentsData.parentsBySchool || [];
        const match = parents.find(
          (parent) =>
            (tokenEmail && parent.email === tokenEmail) ||
            (tokenPhone && parent.primaryPhone === tokenPhone)
        );
        if (!match) {
          setMessage("Parent profile not found for this account.");
          return;
        }
        setParentId(match.id);

        const studentLinksData = await graphqlFetch<{ studentsByParent: StudentLink[] }>(
          `query StudentsByParent($parentId: ID!, $limit: Int) {
            studentsByParent(parentId: $parentId, limit: $limit) {
              id
              studentId
            }
          }`,
          { parentId: match.id, limit: 20 },
          token
        );
        const links = studentLinksData.studentsByParent || [];
        setLinkedStudents(links);

        const studentsData = await graphqlFetch<{ studentsBySchool: Student[] }>(
          `query StudentsBySchool($schoolId: ID!, $limit: Int) {
            studentsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              firstName
              lastName
            }
          }`,
          { schoolId, limit: 300 },
          token
        );
        setStudents(studentsData.studentsBySchool || []);
        if (links.length > 0) {
          setStudentId(links[0].studentId);
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Unable to load parent profile.");
      } finally {
        setLoading(false);
      }
    };
    loadParent();
  }, [token, schoolId, tokenEmail, tokenPhone]);

  const handleSubmit = async () => {
    if (!schoolId || !parentId) {
      setMessage("Missing parent profile. Please reload this page.");
      return;
    }
    if (!subject.trim() || !detail.trim()) {
      setMessage("Please add a subject and details.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await graphqlFetch(
        `mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
          createSupportTicket(input: $input) {
            id
          }
        }`,
        {
          input: {
            schoolId,
            parentId,
            studentId: studentId || null,
            subject: subject.trim(),
            category,
            detail: detail.trim()
          }
        },
        token
      );
      setDetail("");
      setMessage("Support request submitted. We will follow up shortly.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to submit support ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Parent portal</div>
          <h1>New support request</h1>
          <p className="muted">Tell us what you need help with.</p>
        </div>
        <a className="button" href="/portal/support">
          Back to support
        </a>
      </div>

      <div className="card">
        <h3>Request details</h3>
        <div className="form-grid">
          <input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            <option value="">Select child (optional)</option>
            {linkedStudents.map((child) => {
              const match = students.find((student) => student.id === child.studentId);
              return (
                <option key={child.id} value={child.studentId}>
                  {match ? `${match.firstName} ${match.lastName}` : "Student"}
                </option>
              );
            })}
          </select>
          <textarea
            rows={5}
            placeholder="Describe the issue"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
          {message && <p className="muted">{message}</p>}
          <button className="button" type="button" onClick={handleSubmit} disabled={saving || loading}>
            {saving ? "Submitting..." : loading ? "Loading..." : "Submit request"}
          </button>
        </div>
      </div>
    </main>
  );
}

