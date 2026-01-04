"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../../../components/auth-utils";
import { graphqlFetch } from "../../../../components/graphql";
import { useStaffAuth } from "../../../../components/staff-auth";

type PaymentTxn = {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string | null;
  reference?: string | null;
  receiptNo?: string | null;
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
};

type ManualPaymentProof = {
  id: string;
  status: string;
  fileUrl: string;
  submittedByParentId?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
  createdAt: string;
};

export default function PaymentTransactionDetailPage({ params }: { params: { paymentTxnId: string } }) {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const paymentTxnId = params.paymentTxnId;
  const [payment, setPayment] = useState<PaymentTxn | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [proofs, setProofs] = useState<ManualPaymentProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const loadPayment = async () => {
    if (!token || !schoolId || !paymentTxnId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ paymentsBySchool: PaymentTxn[] }>(
        `query PaymentsBySchool($schoolId: ID!, $limit: Int) {
          paymentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            invoiceId
            amount
            currency
            method
            status
            paidAt
            reference
            receiptNo
          }
        }`,
        { schoolId, limit: 500 },
        token
      );
      const found = (data.paymentsBySchool || []).find((item) => item.id === paymentTxnId) || null;
      setPayment(found);
      if (!found) {
        setStatus("Payment transaction not found.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load payment.");
    } finally {
      setLoading(false);
    }
  };

  const loadReceipts = async (invoiceId: string) => {
    if (!token || !invoiceId) return;
    try {
      const data = await graphqlFetch<{ receiptsByInvoice: Receipt[] }>(
        `query ReceiptsByInvoice($invoiceId: ID!, $limit: Int) {
          receiptsByInvoice(invoiceId: $invoiceId, limit: $limit) {
            id
            receiptNo
            amount
            currency
            paidAt
          }
        }`,
        { invoiceId, limit: 20 },
        token
      );
      setReceipts(data.receiptsByInvoice || []);
    } catch (_err) {
      setReceipts([]);
    }
  };

  const loadProofs = async () => {
    if (!token || !paymentTxnId) return;
    try {
      const data = await graphqlFetch<{ proofsByPayment: ManualPaymentProof[] }>(
        `query ProofsByPayment($paymentTxnId: ID!, $limit: Int) {
          proofsByPayment(paymentTxnId: $paymentTxnId, limit: $limit) {
            id
            status
            fileUrl
            submittedByParentId
            reviewedByUserId
            reviewedAt
            notes
            createdAt
          }
        }`,
        { paymentTxnId, limit: 20 },
        token
      );
      setProofs(data.proofsByPayment || []);
    } catch (_err) {
      setProofs([]);
    }
  };

  useEffect(() => {
    if (token && schoolId && paymentTxnId) {
      loadPayment();
      loadProofs();
    }
  }, [token, schoolId, paymentTxnId]);

  useEffect(() => {
    if (payment?.invoiceId) {
      loadReceipts(payment.invoiceId);
    }
  }, [payment?.invoiceId]);

  const receiptMatch = useMemo(
    () => receipts.find((item) => item.receiptNo === payment?.receiptNo),
    [receipts, payment?.receiptNo]
  );

  const timeline = useMemo(() => {
    const items: { label: string; timestamp: string; detail?: string }[] = [];
    if (payment?.paidAt) {
      items.push({
        label: "Payment recorded",
        timestamp: payment.paidAt,
        detail: payment.status
      });
    }
    proofs.forEach((proof) => {
      items.push({
        label: "Proof submitted",
        timestamp: proof.createdAt,
        detail: proof.status
      });
      if (proof.reviewedAt) {
        items.push({
          label: "Proof reviewed",
          timestamp: proof.reviewedAt,
          detail: proof.status
        });
      }
    });
    receipts.forEach((receipt) => {
      if (receipt.paidAt) {
        items.push({
          label: "Receipt issued",
          timestamp: receipt.paidAt,
          detail: receipt.receiptNo
        });
      }
    });
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [payment?.paidAt, payment?.status, proofs, receipts]);

  const downloadReceipt = async (receiptNo?: string | null) => {
    if (!token || !schoolId || !receiptNo) return;
    setDownloadingReceipt(true);
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
      setDownloadingReceipt(false);
    }
  };

  const uploadReceipt = async () => {
    if (!token || !schoolId || !payment?.receiptNo || !receiptFile) return;
    setUploadingReceipt(true);
    setStatus("");
    try {
      const uploadData = await graphqlFetch<{ createReceiptUploadUrl: { uploadUrl: string; bucket: string; key: string } }>(
        `mutation CreateReceiptUploadUrl($input: CreateReceiptUploadUrlInput!) {
          createReceiptUploadUrl(input: $input) { uploadUrl bucket key }
        }`,
        {
          input: {
            schoolId,
            receiptNo: payment.receiptNo,
            fileName: receiptFile.name,
            contentType: receiptFile.type || "application/pdf"
          }
        },
        token
      );
      const upload = uploadData.createReceiptUploadUrl;
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": receiptFile.type || "application/pdf" },
        body: receiptFile
      });
      const receiptUrl = `https://${upload.bucket}.s3.amazonaws.com/${upload.key}`;
      await graphqlFetch(
        `mutation AttachReceiptUrl($input: AttachReceiptUrlInput!) {
          attachReceiptUrl(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            receiptNo: payment.receiptNo,
            receiptUrl,
            receiptBucket: upload.bucket,
            receiptKey: upload.key
          }
        },
        token
      );
      setReceiptFile(null);
      setStatus("Receipt uploaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to upload receipt.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Transaction detail</h1>
          <p className="muted">Review payment status, receipt, and proof history.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadPayment} disabled={loading || !paymentTxnId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {status && (
        <div className="card">
          <p className="muted">{status}</p>
        </div>
      )}

      {payment && (
        <div className="grid">
          <div className="card">
            <h3>Payment details</h3>
            <div className="list">
              <div className="line-item">
                <div>
                  <strong>{payment.method}</strong>
                  <small>{payment.status}</small>
                </div>
                <span className="badge">{payment.currency}</span>
              </div>
              <div className="line-item">
                <div>
                  <strong>Amount</strong>
                  <small>{payment.amount.toLocaleString()}</small>
                </div>
                <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}</span>
              </div>
              <div className="line-item">
                <div>
                  <strong>Invoice</strong>
                  <small>{payment.invoiceId}</small>
                </div>
                <span>{payment.receiptNo || "No receipt"}</span>
              </div>
              <div className="line-item">
                <div>
                  <strong>Reference</strong>
                  <small>{payment.reference || "n/a"}</small>
                </div>
                <span>{payment.id}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Receipt</h3>
            <div className="list">
              {receiptMatch ? (
                <div className="line-item">
                  <div>
                    <strong>{receiptMatch.receiptNo}</strong>
                    <small>
                      {receiptMatch.currency} {receiptMatch.amount.toLocaleString()}
                    </small>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span>{receiptMatch.paidAt ? new Date(receiptMatch.paidAt).toLocaleString() : "Pending"}</span>
                    <button
                      className="button"
                      type="button"
                      onClick={() => downloadReceipt(receiptMatch.receiptNo)}
                      disabled={downloadingReceipt}
                    >
                      {downloadingReceipt ? "Preparing..." : "Download receipt"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="muted">No receipt found for this payment.</p>
              )}
              {receipts.length > 0 && (
                <div className="list">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="line-item">
                      <div>
                        <strong>{receipt.receiptNo}</strong>
                        <small>
                          {receipt.currency} {receipt.amount.toLocaleString()}
                        </small>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span>{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : "Pending"}</span>
                        <button
                          className="button"
                          type="button"
                          onClick={() => downloadReceipt(receipt.receiptNo)}
                          disabled={downloadingReceipt}
                        >
                          {downloadingReceipt ? "Preparing..." : "Download receipt"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-grid" style={{ marginTop: 12 }}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                />
                <button
                  className="button"
                  type="button"
                  onClick={uploadReceipt}
                  disabled={!payment?.receiptNo || !receiptFile || uploadingReceipt}
                >
                  {uploadingReceipt ? "Uploading..." : "Upload receipt PDF"}
                </button>
                {!payment?.receiptNo && <p className="muted">Receipt number is not available yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Manual payment proofs</h3>
        <div className="list">
          {proofs.length === 0 && <p className="muted">No proofs submitted for this payment.</p>}
          {proofs.map((proof) => (
            <div key={proof.id} className="line-item">
              <div>
                <strong>{proof.status}</strong>
                <small>Proof ID: {proof.id}</small>
                <small>Submitted: {new Date(proof.createdAt).toLocaleString()}</small>
                {proof.submittedByParentId && <small>Parent: {proof.submittedByParentId}</small>}
                {proof.reviewedAt && (
                  <small>
                    Reviewed: {new Date(proof.reviewedAt).toLocaleString()} ({proof.reviewedByUserId || "n/a"})
                  </small>
                )}
                {proof.notes && <small>Notes: {proof.notes}</small>}
              </div>
              <a className="button" href={proof.fileUrl} target="_blank" rel="noreferrer">
                View proof
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Payment timeline</h3>
        <div className="list">
          {timeline.length === 0 && <p className="muted">No activity recorded yet.</p>}
          {timeline.map((item, index) => (
            <div key={`${item.label}-${index}`} className="line-item">
              <div>
                <strong>{item.label}</strong>
                <small>{new Date(item.timestamp).toLocaleString()}</small>
                {item.detail && <small>{item.detail}</small>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

