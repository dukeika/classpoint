"use client";

import { useEffect, useState } from "react";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type ReportCard = {
  id: string;
  termId: string;
  status: string;
  publishedAt?: string | null;
};

type Term = {
  id: string;
  name?: string | null;
  startDate?: string | null;
};

export default function PortalChildResultsPage({ params }: { params: { studentId: string } }) {
  const { token: authToken, schoolId } = usePortalAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState("");
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publishedCards = reportCards.filter((card) => card.status?.toUpperCase() === "PUBLISHED");
  useEffect(() => {
    const loadTerms = async () => {
      if (!authToken || !schoolId) return;
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
              }
            }`,
            { sessionId: latestSession.id, limit: 5 }
          );
          const termsList = (termsData.termsBySession || []).slice().sort((a: Term, b: Term) => {
            return String(a.startDate || "").localeCompare(String(b.startDate || ""));
          });
          setTerms(termsList);
          const latestTerm = termsList[termsList.length - 1];
          if (latestTerm?.id) {
            setTermId(latestTerm.id);
          }
        }
      } catch (err) {
        setTerms([]);
      }
    };
    loadTerms();
  }, [authToken, schoolId]);

  useEffect(() => {
    const loadReportCards = async () => {
      if (!authToken || !schoolId || !termId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ reportCardsByStudentTerm: ReportCard[] }>(
          `query ReportCardsByStudentTerm($studentId: ID!, $termId: ID!, $limit: Int) {
            reportCardsByStudentTerm(studentId: $studentId, termId: $termId, limit: $limit) {
              id
              termId
              status
              publishedAt
            }
          }`,
          { studentId: params.studentId, termId, limit: 20 }
        );
        setReportCards(data.reportCardsByStudentTerm || []);
      } catch (err) {
        setReportCards([]);
        setError(err instanceof Error ? err.message : "Failed to load results.");
      } finally {
        setLoading(false);
      }
    };
    loadReportCards();
  }, [authToken, schoolId, termId, params.studentId]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Children / Results</div>
          <h1>Results</h1>
          <p className="muted">View report cards by term.</p>
        </div>
        <a className="button" href={`/portal/children/${params.studentId}/overview`}>
          Back to overview
        </a>
      </div>

      <div className="card">
        <div className="inline-alert">
          If fees are outstanding, results may be locked. Check your invoices on the Fees page before trying again.
          <div className="cta-row" style={{ marginTop: 8 }}>
            <a className="ghost-button" href="/portal/children/fees">
              Go to Fees
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="quick-actions">
          <select value={termId} onChange={(event) => setTermId(event.target.value)}>
            <option value="">Select term</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name || term.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading && <p>Loading results...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && reportCards.length === 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No report cards yet</strong>
              <span>Results will appear once published by the school.</span>
            </div>
          </div>
        )}
        {!loading && !error && publishedCards.length === 0 && reportCards.length > 0 && (
          <div className="list-cards">
            <div className="list-card">
              <strong>Results not released yet</strong>
              <span className="muted">
                Report cards exist but are not published. If fees are outstanding, settle balances and try again.
              </span>
              <span className="muted">Need help? Contact your school.</span>
            </div>
          </div>
        )}
        <div className="list-cards">
          {reportCards.map((card) => (
            <div key={card.id} className="list-card">
              <strong>{terms.find((term) => term.id === card.termId)?.name || card.termId}</strong>
              <span>Status: {card.status}</span>
              <span>{card.publishedAt ? new Date(card.publishedAt).toLocaleDateString() : "Not published"}</span>
              <a className="ghost-button" href={`/portal/children/${params.studentId}/report-card/${card.id}`}>
                View report card
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
