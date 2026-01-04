"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../../../components/graphql";
import { usePortalAuth } from "../../../../components/portal-auth";

type ReportCard = {
  id: string;
  status: string;
  teacherComment?: string | null;
  headComment?: string | null;
  attendanceSummaryJson?: string | null;
};

export default function ReportCardPage({
  params
}: {
  params: { studentId: string; reportCardId: string };
}) {
  const { token: authToken, schoolId } = usePortalAuth();
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadReportCard = async () => {
      if (!authToken || !schoolId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ reportCardsByStudentTerm: ReportCard[] }>(
          `query ReportCardsByStudentTerm($studentId: ID!, $termId: ID!, $limit: Int) {
            reportCardsByStudentTerm(studentId: $studentId, termId: $termId, limit: $limit) {
              id
              status
              teacherComment
              headComment
              attendanceSummaryJson
            }
          }`,
          { studentId: params.studentId, termId: params.reportCardId, limit: 10 }
        );
        const match = (data.reportCardsByStudentTerm || []).find(
          (card: ReportCard) => card.id === params.reportCardId
        );
        setReportCard(match || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report card.");
      } finally {
        setLoading(false);
      }
    };
    loadReportCard();
  }, [authToken, schoolId, params.reportCardId, params.studentId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Report card</div>
          <h1>Report card</h1>
          <p className="muted">Summary comments and attendance overview.</p>
        </div>
        <a className="button" href={`/portal/children/${params.studentId}/results`}>
          Back to results
        </a>
      </div>

      {loading && (
        <div className="card">
          <p>Loading report card...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !reportCard && (
        <div className="card">
          <p>Report card not found.</p>
        </div>
      )}

      {reportCard && (
        <div className="grid">
          <div className="card">
            <h3>Teacher comment</h3>
            <p>{reportCard.teacherComment || "No teacher comment yet."}</p>
          </div>
          <div className="card">
            <h3>Head teacher comment</h3>
            <p>{reportCard.headComment || "No head teacher comment yet."}</p>
          </div>
          <div className="card">
            <h3>Attendance summary</h3>
            <p>{reportCard.attendanceSummaryJson || "Attendance summary not available."}</p>
          </div>
          <div className="card">
            <h3>Status</h3>
            <span className="status-pill">{reportCard.status}</span>
          </div>
        </div>
      )}
    </main>
  );
}
