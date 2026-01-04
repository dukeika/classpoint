"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type ClassGroup = {
  id: string;
  displayName: string;
};

export default function TeacherAttendanceTakePage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const loadClasses = async () => {
      if (!token || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ classGroupsBySchool: ClassGroup[] }>(
          `query ClassGroupsBySchool($schoolId: ID!, $limit: Int) {
            classGroupsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              displayName
            }
          }`,
          { schoolId, limit: 50 },
          token
        );
        setClasses(data.classGroupsBySchool || []);
      } catch (err) {
        setClasses([]);
        setError(err instanceof Error ? err.message : "Failed to load classes.");
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [token, schoolId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Teacher</div>
          <h1>Take attendance</h1>
          <p className="muted">Select a class to mark attendance for today.</p>
        </div>
        <a className="button" href="/teacher/attendance">
          Back to attendance
        </a>
      </div>

      <div className="card">
        <h3>Today&apos;s classes</h3>
        <div className="list-cards">
          {loading && (
            <div className="list-card">
              <strong>Loading classes</strong>
              <span>Fetching your assigned class groups.</span>
            </div>
          )}
          {error && (
            <div className="list-card">
              <strong>Unable to load classes</strong>
              <span>{error}</span>
            </div>
          )}
          {!loading && !error && classes.length === 0 && (
            <div className="list-card">
              <strong>No classes assigned</strong>
              <span>Ask an admin to assign a class group.</span>
            </div>
          )}
          {!loading &&
            !error &&
            classes.map((item) => (
              <div key={item.id} className="list-card">
                <strong>{item.displayName}</strong>
                <span>Mark attendance for today</span>
                <a className="ghost-button" href={`/teacher/attendance/take/${item.id}/${today}`}>
                  Start attendance
                </a>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
