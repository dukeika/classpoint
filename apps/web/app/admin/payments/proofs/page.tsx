"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId, decodeUserId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type ManualPaymentProof = {
  id: string;
  paymentTxnId: string;
  fileUrl: string;
  submittedByParentId?: string | null;
  status: string;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  createdAt: string;
};

type PaymentTxn = {
  id: string;
  receiptNo?: string | null;
};

export default function PaymentProofsPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const reviewerUserId = decodeUserId(token);
  const [proofs, setProofs] = useState<ManualPaymentProof[]>([]);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [receiptFiles, setReceiptFiles] = useState<Record<string, File | null>>({});
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [payments, setPayments] = useState<PaymentTxn[]>([]);

  const loadProofs = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ manualPaymentProofsBySchool: ManualPaymentProof[] }>(
        `query ManualPaymentProofsBySchool($schoolId: ID!, $limit: Int) {
          manualPaymentProofsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            paymentTxnId
            fileUrl
            submittedByParentId
            status
            reviewedByUserId
            reviewedAt
            notes
            createdAt
          }
        }`,
        { schoolId, limit: 100 },
        token
      );
      setProofs(data.manualPaymentProofsBySchool || []);
      setStatus("Manual payment proofs loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load proofs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    if (!token || !schoolId) return;
    try {
      const data = await graphqlFetch<{ paymentsBySchool: PaymentTxn[] }>(
        `query PaymentsBySchool($schoolId: ID!, $limit: Int) {
          paymentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            receiptNo
          }
        }`,
        { schoolId, limit: 500 },
        token
      );
      const items = data.paymentsBySchool || [];
      setPayments(items);
      return items;
    } catch (_err) {
      setPayments([]);
      return [];
    }
  };

  useEffect(() => {
    if (token && schoolId) {
      loadProofs();
      fetchPayments();
    }
  }, [token, schoolId]);

  const receiptNoByPayment = useMemo(() => {
    const map = new Map<string, string>();
    payments.forEach((payment) => {
      if (payment.receiptNo) {
        map.set(payment.id, payment.receiptNo);
      }
    });
    return map;
  }, [payments]);

  const attachReceipt = async (proof: ManualPaymentProof, receiptOverride?: string | null) => {
    if (!token || !schoolId) return;
    const receiptNo = receiptOverride || receiptNoByPayment.get(proof.paymentTxnId);
    if (!receiptNo) {
      setStatus("Receipt number is not available yet. Approve proof first.");
      return;
    }
    const file = receiptFiles[proof.id];
    if (!file) {
      setStatus("Select a receipt PDF before uploading.");
      return;
    }
    setAttachingId(proof.id);
    setStatus("");
    try {
      const uploadData = await graphqlFetch<{ createReceiptUploadUrl: { uploadUrl: string; bucket: string; key: string } }>(
        `mutation CreateReceiptUploadUrl($input: CreateReceiptUploadUrlInput!) {
          createReceiptUploadUrl(input: $input) { uploadUrl bucket key }
        }`,
        {
          input: {
            schoolId,
            receiptNo,
            fileName: file.name,
            contentType: file.type || "application/pdf"
          }
        },
        token
      );
      const upload = uploadData.createReceiptUploadUrl;
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file
      });
      const receiptUrl = `https://${upload.bucket}.s3.amazonaws.com/${upload.key}`;
      await graphqlFetch(
        `mutation AttachReceiptUrl($input: AttachReceiptUrlInput!) {
          attachReceiptUrl(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            receiptNo,
            receiptUrl,
            receiptBucket: upload.bucket,
            receiptKey: upload.key
          }
        },
        token
      );
      setReceiptFiles((prev) => ({ ...prev, [proof.id]: null }));
      setStatus("Receipt attached.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to attach receipt.");
    } finally {
      setAttachingId(null);
    }
  };

  const filteredProofs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return proofs.filter((proof) => {
      if (statusFilter !== "ALL" && proof.status !== statusFilter) return false;
      if (!normalized) return true;
      return (
        proof.id.toLowerCase().includes(normalized) ||
        proof.paymentTxnId.toLowerCase().includes(normalized) ||
        (proof.submittedByParentId || "").toLowerCase().includes(normalized)
      );
    });
  }, [proofs, statusFilter, query]);

  const reviewProof = async (proofId: string, nextStatus: "APPROVED" | "REJECTED") => {
    if (!token || !schoolId || !reviewerUserId) return;
    setReviewingId(proofId);
    setStatus("");
    try {
      const notes = reviewNotes[proofId] || "";
      const data = await graphqlFetch<{ reviewManualPaymentProof: ManualPaymentProof }>(
        `mutation ReviewManualPaymentProof($input: ReviewManualPaymentProofInput!) {
          reviewManualPaymentProof(input: $input) {
            id
            status
            reviewedByUserId
            reviewedAt
            notes
          }
        }`,
        {
          input: {
            schoolId,
            proofId,
            reviewerUserId,
            status: nextStatus,
            notes: notes || null
          }
        },
        token
      );
      const updated = data.reviewManualPaymentProof;
      setProofs((prev) =>
        prev.map((item) => (item.id === proofId ? { ...item, ...updated } : item))
      );
      setStatus(`Proof ${nextStatus.toLowerCase()}.`);
      await fetchPayments();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to review proof.");
    } finally {
      setReviewingId(null);
    }
  };

  const approveAndAttach = async (proof: ManualPaymentProof) => {
    await reviewProof(proof.id, "APPROVED");
    const latestPayments = await fetchPayments();
    const receiptNo = latestPayments?.find((payment) => payment.id === proof.paymentTxnId)?.receiptNo || null;
    await attachReceipt(proof, receiptNo);
  };

  const downloadReceipt = async (receiptNo: string, proofId: string) => {
    if (!token || !schoolId || !receiptNo) return;
    setDownloadingReceiptId(proofId);
    setStatus("");
    try {
      const data = await graphqlFetch<{ createReceiptDownloadUrl: { downloadUrl: string } }>(
        `mutation CreateReceiptDownloadUrl($input: CreateReceiptDownloadUrlInput!) {
          createReceiptDownloadUrl(input: $input) { downloadUrl }
        }`,
        { input: { schoolId, receiptNo } },
        token
      );
      const url = data.createReceiptDownloadUrl?.downloadUrl;
      if (!url) throw new Error("Receipt download unavailable.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to download receipt.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const pendingCount = proofs.filter((proof) => proof.status === "SUBMITTED").length;
  const approvedCount = proofs.filter((proof) => proof.status === "APPROVED").length;
  const rejectedCount = proofs.filter((proof) => proof.status === "REJECTED").length;
  const timeline = useMemo(() => {
    return proofs
      .map((proof) => ({
        id: proof.id,
        status: proof.status,
        createdAt: proof.createdAt,
        reviewedAt: proof.reviewedAt || null,
        notes: proof.notes || ""
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [proofs]);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Manual payment proofs</h1>
          <p className="muted">Review offline payment evidence and approve or reject.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadProofs} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Snapshot</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Pending</strong>
                <small>{pendingCount} awaiting review</small>
              </div>
              <span className="badge">{pendingCount}</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Approved</strong>
                <small>{approvedCount} confirmed</small>
              </div>
              <span className="badge">{approvedCount}</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Rejected</strong>
                <small>{rejectedCount} declined</small>
              </div>
              <span className="badge">{rejectedCount}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Filters</h3>
          <div className="form-grid">
            <input
              placeholder="Search by proof ID, payment txn, parent ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Proof queue</h3>
        {status && <p className="muted">{status}</p>}
        <div className="list">
          {filteredProofs.length === 0 && <p className="muted">No proofs found.</p>}
          {filteredProofs.map((proof) => (
            <div key={proof.id} className="line-item" style={{ alignItems: "stretch" }}>
              <div>
                <strong>{proof.status}</strong>
                <small>Proof ID: {proof.id}</small>
                <small>Payment Txn: {proof.paymentTxnId}</small>
                <small>Submitted: {new Date(proof.createdAt).toLocaleString()}</small>
                {proof.submittedByParentId && <small>Parent: {proof.submittedByParentId}</small>}
                {proof.reviewedAt && (
                  <small>
                    Reviewed: {new Date(proof.reviewedAt).toLocaleString()} ({proof.reviewedByUserId || "n/a"})
                  </small>
                )}
                {proof.notes && <small>Notes: {proof.notes}</small>}
                {receiptNoByPayment.get(proof.paymentTxnId) && (
                  <small>Receipt no: {receiptNoByPayment.get(proof.paymentTxnId)}</small>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a className="button" href={proof.fileUrl} target="_blank" rel="noreferrer">
                  View proof
                </a>
                <textarea
                  rows={2}
                  placeholder="Review notes (optional)"
                  value={reviewNotes[proof.id] || ""}
                  onChange={(event) =>
                    setReviewNotes((prev) => ({
                      ...prev,
                      [proof.id]: event.target.value
                    }))
                  }
                />
                <button
                  className="button"
                  type="button"
                  onClick={() => reviewProof(proof.id, "APPROVED")}
                  disabled={reviewingId === proof.id || proof.status === "APPROVED"}
                >
                  Approve
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => reviewProof(proof.id, "REJECTED")}
                  disabled={reviewingId === proof.id || proof.status === "REJECTED"}
                >
                  Reject
                </button>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setReceiptFiles((prev) => ({
                      ...prev,
                      [proof.id]: event.target.files?.[0] || null
                    }))
                  }
                />
                <button
                  className="button"
                  type="button"
                  onClick={() => attachReceipt(proof)}
                  disabled={attachingId === proof.id}
                >
                  {attachingId === proof.id ? "Uploading..." : "Attach receipt"}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => approveAndAttach(proof)}
                  disabled={reviewingId === proof.id || attachingId === proof.id}
                >
                  Approve & attach
                </button>
                {receiptNoByPayment.get(proof.paymentTxnId) && (
                  <button
                    className="button"
                    type="button"
                    onClick={() =>
                      downloadReceipt(receiptNoByPayment.get(proof.paymentTxnId) as string, proof.id)
                    }
                    disabled={downloadingReceiptId === proof.id}
                  >
                    {downloadingReceiptId === proof.id ? "Preparing..." : "Download receipt"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Manual payment timeline</h3>
        <div className="list">
          {timeline.length === 0 && <p className="muted">No manual payment activity yet.</p>}
          {timeline.map((item) => (
            <div key={item.id} className="line-item">
              <div>
                <strong>{item.status}</strong>
                <small>Proof ID: {item.id}</small>
                <small>Submitted: {new Date(item.createdAt).toLocaleString()}</small>
                {item.reviewedAt && <small>Reviewed: {new Date(item.reviewedAt).toLocaleString()}</small>}
                {item.notes && <small>Notes: {item.notes}</small>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

