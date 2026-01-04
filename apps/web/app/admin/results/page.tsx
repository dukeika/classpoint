"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

type ResultReleasePolicy = {
  id: string;
  schoolId: string;
  isEnabled: boolean;
  minimumPaymentPercent: number;
  messageToParent?: string | null;
  appliesTo?: string | null;
};

const DEFAULT_APPLIES_TO = "ALL";

export default function ResultReleasePolicyPage() {
  const { token: authToken, schoolId: sessionSchoolId } = useStaffAuth();
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [policy, setPolicy] = useState<ResultReleasePolicy | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [minimumPaymentPercent, setMinimumPaymentPercent] = useState(50);
  const [messageToParent, setMessageToParent] = useState("");
  const [appliesTo, setAppliesTo] = useState(DEFAULT_APPLIES_TO);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [announcementId, setAnnouncementId] = useState("");
  const [resultStudentId, setResultStudentId] = useState("");
  const [resultTermId, setResultTermId] = useState("");
  const [resultClassGroupId, setResultClassGroupId] = useState("");
  const [resultReportCardId, setResultReportCardId] = useState("");
  const [publishStatus, setPublishStatus] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (sessionSchoolId) {
      setSchoolIdInput((prev) => (prev ? prev : sessionSchoolId));
    }
  }, [sessionSchoolId]);

  const schoolId = useMemo(() => schoolIdInput.trim(), [schoolIdInput]);
  const trimmedAnnouncementId = useMemo(() => announcementId.trim(), [announcementId]);
  const trimmedStudentId = useMemo(() => resultStudentId.trim(), [resultStudentId]);
  const trimmedTermId = useMemo(() => resultTermId.trim(), [resultTermId]);
  const trimmedClassGroupId = useMemo(() => resultClassGroupId.trim(), [resultClassGroupId]);
  const trimmedReportCardId = useMemo(() => resultReportCardId.trim(), [resultReportCardId]);

  const resetForm = (nextPolicy: ResultReleasePolicy | null) => {
    setPolicy(nextPolicy);
    if (nextPolicy) {
      setIsEnabled(Boolean(nextPolicy.isEnabled));
      setMinimumPaymentPercent(Number(nextPolicy.minimumPaymentPercent || 0));
      setMessageToParent(nextPolicy.messageToParent || "");
      setAppliesTo(nextPolicy.appliesTo || DEFAULT_APPLIES_TO);
    } else {
      setIsEnabled(false);
      setMinimumPaymentPercent(50);
      setMessageToParent("");
      setAppliesTo(DEFAULT_APPLIES_TO);
    }
  };

  const loadPolicy = async () => {
    if (!authToken || !schoolId) return;
    setLoadingPolicy(true);
    setStatus("");
    try {
      const data = await graphqlFetch(
        `query ReleasePolicyBySchool($schoolId: ID!, $limit: Int) {
          releasePolicyBySchool(schoolId: $schoolId, limit: $limit) {
            id
            schoolId
            isEnabled
            minimumPaymentPercent
            messageToParent
            appliesTo
          }
        }`,
        { schoolId, limit: 1 });
      const items: ResultReleasePolicy[] = data.releasePolicyBySchool || [];
      resetForm(items[0] || null);
      setStatus(items.length ? "Policy loaded." : "No policy found for this school.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load policy.");
    } finally {
      setLoadingPolicy(false);
    }
  };

  const savePolicy = async () => {
    if (!authToken || !schoolId) return;
    if (minimumPaymentPercent < 0 || minimumPaymentPercent > 100) {
      setStatus("Minimum payment percent must be between 0 and 100.");
      return;
    }
    setLoading(true);
    setStatus("");
    const input = {
      schoolId,
      isEnabled,
      minimumPaymentPercent,
      messageToParent: messageToParent.trim() ? messageToParent.trim() : null,
      appliesTo: appliesTo.trim() ? appliesTo.trim() : DEFAULT_APPLIES_TO
    };
    try {
      if (policy?.id) {
        const data = await graphqlFetch(
          `mutation UpdateResultReleasePolicy($input: UpdateResultReleasePolicyInput!) {
            updateResultReleasePolicy(input: $input) {
              id
              schoolId
              isEnabled
              minimumPaymentPercent
              messageToParent
              appliesTo
            }
          }`,
          { input: { ...input, id: policy.id } });
        resetForm(data.updateResultReleasePolicy);
        setStatus("Policy updated.");
      } else {
        const data = await graphqlFetch(
          `mutation CreateResultReleasePolicy($input: CreateResultReleasePolicyInput!) {
            createResultReleasePolicy(input: $input) {
              id
              schoolId
              isEnabled
              minimumPaymentPercent
              messageToParent
              appliesTo
            }
          }`,
          { input });
        resetForm(data.createResultReleasePolicy);
        setStatus("Policy created.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save policy.");
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async () => {
    if (!authToken || !schoolId || !policy?.id) return;
    if (!window.confirm("Delete the result release policy?")) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteResultReleasePolicy($schoolId: ID!, $id: ID!) {
          deleteResultReleasePolicy(schoolId: $schoolId, id: $id)
        }`,
        { schoolId, id: policy.id });
      resetForm(null);
      setStatus("Policy deleted.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete policy.");
    } finally {
      setLoading(false);
    }
  };

  const publishAnnouncement = async () => {
    if (!authToken || !schoolId || !trimmedAnnouncementId) return;
    setPublishing(true);
    setPublishStatus("");
    try {
      await graphqlFetch(
        `mutation PublishAnnouncement($schoolId: ID!, $announcementId: ID!) {
          publishAnnouncement(schoolId: $schoolId, announcementId: $announcementId)
        }`,
        { schoolId, announcementId: trimmedAnnouncementId });
      setPublishStatus("Announcement published.");
    } catch (err) {
      setPublishStatus(err instanceof Error ? err.message : "Failed to publish announcement.");
    } finally {
      setPublishing(false);
    }
  };

  const publishResult = async () => {
    if (!authToken || !schoolId || !trimmedStudentId || !trimmedTermId) return;
    setPublishing(true);
    setPublishStatus("");
    try {
      await graphqlFetch(
        `mutation PublishResultReady($schoolId: ID!, $studentId: ID!, $termId: ID!, $classGroupId: ID, $reportCardId: ID) {
          publishResultReady(
            schoolId: $schoolId
            studentId: $studentId
            termId: $termId
            classGroupId: $classGroupId
            reportCardId: $reportCardId
          )
        }`,
        {
          schoolId,
          studentId: trimmedStudentId,
          termId: trimmedTermId,
          classGroupId: trimmedClassGroupId || null,
          reportCardId: trimmedReportCardId || null
        });
      setPublishStatus("Result marked as ready.");
    } catch (err) {
      setPublishStatus(err instanceof Error ? err.message : "Failed to publish result.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Admin</span>
            <h1>Result release policy</h1>
            <p>Set fee threshold rules for releasing student results.</p>
          </div>
        </div>

        <div className="card fade-up delay-1">
          <h3>Policy settings</h3>
          <div className="form-grid">
            <input
              placeholder="School ID"
              value={schoolIdInput}
              onChange={(event) => setSchoolIdInput(event.target.value)}
            />
            <label className="line-item" style={{ alignItems: "center" }}>
              <span>Enable gating</span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(event) => setIsEnabled(event.target.checked)}
              />
            </label>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Minimum payment percent"
              value={minimumPaymentPercent}
              onChange={(event) => setMinimumPaymentPercent(Number(event.target.value || 0))}
            />
            <input
              placeholder="Applies to (ALL/SECONDARY_ONLY/etc)"
              value={appliesTo}
              onChange={(event) => setAppliesTo(event.target.value)}
            />
            <textarea
              placeholder="Message to parent (shown when blocked)"
              value={messageToParent}
              onChange={(event) => setMessageToParent(event.target.value)}
              rows={3}
            />
            <div className="grid">
              <button className="button" onClick={loadPolicy} disabled={loadingPolicy || !schoolId}>
                Load policy
              </button>
              <button className="button" onClick={savePolicy} disabled={loading || !schoolId}>
                {policy ? "Update policy" : "Create policy"}
              </button>
              <button className="button" onClick={deletePolicy} disabled={loading || !policy?.id}>
                Delete policy
              </button>
            </div>
            {status && <p>{status}</p>}
            {!authToken && <p>Sign in to load live results data.</p>}
          </div>
        </div>

        <div className="card fade-up delay-2">
          <h3>Current policy</h3>
          {!policy && <p>No policy loaded.</p>}
          {policy && (
            <div className="list">
              <div className="line-item">
                <div>
                  <strong>{policy.isEnabled ? "Enabled" : "Disabled"}</strong>
                  <small>{policy.id}</small>
                </div>
                <div>
                  <span className="badge">{policy.minimumPaymentPercent}% minimum</span>
                </div>
              </div>
              <div className="line-item">
                <div>
                  <strong>Applies to</strong>
                  <small>{policy.appliesTo || DEFAULT_APPLIES_TO}</small>
                </div>
              </div>
              <div className="line-item">
                <div>
                  <strong>Message to parent</strong>
                  <small>{policy.messageToParent || "Results are locked until the minimum fee payment is met."}</small>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card fade-up delay-3">
          <h3>Quick publish (dev)</h3>
          <div className="form-grid">
            <input
              placeholder="Announcement ID"
              value={announcementId}
              onChange={(event) => setAnnouncementId(event.target.value)}
            />
            <button
              className="button"
              onClick={publishAnnouncement}
              disabled={publishing || !schoolId || !trimmedAnnouncementId}
            >
              Publish announcement
            </button>
            <input
              placeholder="Student ID"
              value={resultStudentId}
              onChange={(event) => setResultStudentId(event.target.value)}
            />
            <input
              placeholder="Term ID"
              value={resultTermId}
              onChange={(event) => setResultTermId(event.target.value)}
            />
            <input
              placeholder="Class group ID (optional)"
              value={resultClassGroupId}
              onChange={(event) => setResultClassGroupId(event.target.value)}
            />
            <input
              placeholder="Report card ID (optional)"
              value={resultReportCardId}
              onChange={(event) => setResultReportCardId(event.target.value)}
            />
            <button
              className="button"
              onClick={publishResult}
              disabled={publishing || !schoolId || !trimmedStudentId || !trimmedTermId}
            >
              Publish result ready
            </button>
            {publishStatus && <p>{publishStatus}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

