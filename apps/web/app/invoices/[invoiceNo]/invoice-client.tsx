"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId, decodeToken } from "../../components/auth-utils";

type InvoiceLine = {
  id: string;
  label: string;
  description?: string | null;
  amount: number;
  isOptional: boolean;
  isSelected?: boolean | null;
  sortOrder: number;
};

type PaymentTxn = {
  id: string;
  amount: number;
  status: string;
  paidAt?: string | null;
  receiptNo?: string | null;
};

type FeeAdjustment = {
  id: string;
  type: string;
  amount: number;
  note?: string | null;
  createdAt?: string | null;
};

type Invoice = {
  id: string;
  schoolId: string;
  invoiceNo: string;
  status: string;
  studentId: string;
  termId: string;
  dueAt?: string | null;
  requiredSubtotal: number;
  optionalSubtotal: number;
  discountTotal: number;
  penaltyTotal: number;
  amountPaid: number;
  amountDue: number;
  lines: InvoiceLine[];
  payments: PaymentTxn[];
  adjustments: FeeAdjustment[];
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  currency: string;
  receiptUrl?: string | null;
  receiptBucket?: string | null;
  receiptKey?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

const invoiceQuery = `query InvoiceByNumber($schoolId: ID!, $invoiceNo: String!) {
  invoiceByNumber(schoolId: $schoolId, invoiceNo: $invoiceNo) {
    id
    schoolId
    invoiceNo
    status
    studentId
    termId
    dueAt
    requiredSubtotal
    optionalSubtotal
    discountTotal
    penaltyTotal
    amountPaid
    amountDue
    lines {
      id
      label
      description
      amount
      isOptional
      isSelected
      sortOrder
    }
    payments {
      id
      amount
      status
      paidAt
      receiptNo
    }
    adjustments {
      id
      type
      amount
      note
      createdAt
    }
  }
}`;

const receiptsQuery = `query ReceiptsByInvoice($invoiceId: ID!, $limit: Int) {
  receiptsByInvoice(invoiceId: $invoiceId, limit: $limit) {
    id
    receiptNo
    amount
    currency
    receiptUrl
    receiptBucket
    receiptKey
    paidAt
    createdAt
  }
}`;

const createReceiptUploadUrlMutation = `mutation CreateReceiptUploadUrl($input: CreateReceiptUploadUrlInput!) {
  createReceiptUploadUrl(input: $input) {
    uploadUrl
    bucket
    key
    expiresIn
  }
}`;

const attachReceiptUrlMutation = `mutation AttachReceiptUrl($input: AttachReceiptUrlInput!) {
  attachReceiptUrl(input: $input) {
    id
    receiptNo
    receiptUrl
    receiptBucket
    receiptKey
  }
}`;

const createReceiptDownloadUrlMutation = `mutation CreateReceiptDownloadUrl($input: CreateReceiptDownloadUrlInput!) {
  createReceiptDownloadUrl(input: $input) {
    downloadUrl
    expiresIn
  }
}`;

const selectOptionalMutation = `mutation SelectInvoiceOptionalItems($input: SelectInvoiceOptionalItemsInput!) {
  selectInvoiceOptionalItems(input: $input) {
    id
    schoolId
    invoiceNo
    status
    requiredSubtotal
    optionalSubtotal
    discountTotal
    penaltyTotal
    amountPaid
    amountDue
    lines {
      id
      label
      description
      amount
      isOptional
      isSelected
      sortOrder
    }
  }
}`;

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(value || 0);

export default function InvoiceClient({ invoiceNo }: { invoiceNo: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingReceiptId, setUploadingReceiptId] = useState<string | null>(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokenDetails = useMemo(() => decodeToken("session"), []);
  const schoolId = useMemo(() => decodeSchoolId("session"), []);
  const isAuthenticated = Boolean(tokenDetails);

  const loadInvoice = async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: invoiceQuery,
          variables: { schoolId, invoiceNo }
        })
      });
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "Failed to load invoice.");
      }
      const data: Invoice | null = json.data?.invoiceByNumber || null;
      setInvoice(data);
      if (data?.lines) {
        const nextSelection: Record<string, boolean> = {};
        for (const line of data.lines) {
          if (line.isOptional) {
            nextSelection[line.id] = line.isSelected !== false;
          }
        }
        setSelection(nextSelection);
      }

      if (data?.id) {
        const receiptsRes = await fetch("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            query: receiptsQuery,
            variables: { invoiceId: data.id, limit: 10 }
          })
        });
        const receiptsJson = await receiptsRes.json();
        if (!receiptsJson.errors) {
          setReceipts(receiptsJson.data?.receiptsByInvoice || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      loadInvoice();
    }
  }, [schoolId, invoiceNo]);

  const optionalLines = useMemo(
    () => (invoice?.lines || []).filter((line) => line.isOptional).sort((a, b) => a.sortOrder - b.sortOrder),
    [invoice]
  );
  const requiredLines = useMemo(
    () => (invoice?.lines || []).filter((line) => !line.isOptional).sort((a, b) => a.sortOrder - b.sortOrder),
    [invoice]
  );

  const hasChanges = useMemo(() => {
    return optionalLines.some((line) => selection[line.id] !== (line.isSelected !== false));
  }, [optionalLines, selection]);

  const saveSelection = async () => {
    if (!invoice || !schoolId) return;
    setSaving(true);
    setError(null);
    try {
      const selectedLineIds = optionalLines
        .filter((line) => selection[line.id])
        .map((line) => line.id);
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: selectOptionalMutation,
          variables: {
            input: {
              schoolId,
              invoiceId: invoice.id,
              selectedLineIds
            }
          }
        })
      });
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "Failed to update selections.");
      }
      const updated: Invoice = { ...invoice, ...json.data?.selectInvoiceOptionalItems };
      setInvoice(updated);
      const nextSelection: Record<string, boolean> = {};
      for (const line of updated.lines || []) {
        if (line.isOptional) {
          nextSelection[line.id] = line.isSelected !== false;
        }
      }
      setSelection(nextSelection);
    } catch (err: any) {
      setError(err.message || "Failed to update selections.");
    } finally {
      setSaving(false);
    }
  };

  const buildReceiptUrl = (bucket: string, key: string) => {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  };

  const uploadReceiptPdf = async (receipt: Receipt, file: File) => {
    if (!schoolId) return;
    setUploadError(null);
    setUploadingReceiptId(receipt.id);
    try {
      const uploadRes = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: createReceiptUploadUrlMutation,
          variables: {
            input: {
              schoolId,
              receiptNo: receipt.receiptNo,
              fileName: file.name,
              contentType: file.type || "application/pdf"
            }
          }
        })
      });
      const uploadJson = await uploadRes.json();
      if (uploadJson.errors) {
        throw new Error(uploadJson.errors[0]?.message || "Failed to create upload URL.");
      }
      const uploadData = uploadJson.data?.createReceiptUploadUrl;
      if (!uploadData?.uploadUrl || !uploadData?.bucket || !uploadData?.key) {
        throw new Error("Upload URL not returned.");
      }

      const putRes = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/pdf"
        },
        body: file
      });
      if (!putRes.ok) {
        throw new Error("Upload failed.");
      }

      const receiptUrl = buildReceiptUrl(uploadData.bucket, uploadData.key);
      const attachRes = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: attachReceiptUrlMutation,
          variables: {
            input: {
              schoolId,
              receiptNo: receipt.receiptNo,
              receiptUrl,
              receiptBucket: uploadData.bucket,
              receiptKey: uploadData.key
            }
          }
        })
      });
      const attachJson = await attachRes.json();
      if (attachJson.errors) {
        throw new Error(attachJson.errors[0]?.message || "Failed to attach receipt URL.");
      }
      const updated = attachJson.data?.attachReceiptUrl;
      if (updated?.receiptUrl) {
        setReceipts((prev) =>
          prev.map((item) =>
            item.id === receipt.id
              ? {
                  ...item,
                  receiptUrl: updated.receiptUrl,
                  receiptBucket: updated.receiptBucket,
                  receiptKey: updated.receiptKey
                }
              : item
          )
        );
      }
    } catch (err: any) {
      setUploadError(err.message || "Receipt upload failed.");
    } finally {
      setUploadingReceiptId(null);
    }
  };

  const downloadReceiptPdf = async (receipt: Receipt) => {
    if (!schoolId) return;
    setUploadError(null);
    setDownloadingReceiptId(receipt.id);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: createReceiptDownloadUrlMutation,
          variables: {
            input: { schoolId, receiptNo: receipt.receiptNo }
          }
        })
      });
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || "Failed to create download URL.");
      }
      const downloadUrl = json.data?.createReceiptDownloadUrl?.downloadUrl;
      if (!downloadUrl) {
        throw new Error("Download URL missing.");
      }
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      setUploadError(err.message || "Receipt download failed.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  return (
    <main className="page">
      <section className="shell">
        <div className="hero fade-up">
          <div>
            <span className="chip">Invoice</span>
            <h1>Invoice {invoiceNo}</h1>
            <p>Review required fees, choose optional items, and track payments.</p>
          </div>
          {invoice?.status && <span className="badge">{invoice.status}</span>}
        </div>

        <div className="grid">
          <div className="card fade-up delay-1">
            <h3>Access</h3>
            <p className="muted">
              Sign in through the parent portal to view and pay invoices. This page shows sample data until then.
            </p>
            <span className="badge">{isAuthenticated ? "Signed in" : "Sign in required"}</span>
          </div>

          <div className="card fade-up delay-2">
            <h3>Invoice details</h3>
            {loading && <p>Loading invoice...</p>}
            {!loading && !invoice && <p>No invoice loaded.</p>}
            {invoice && (
              <div className="summary">
                <div className="summary-row">
                  <span>Due date</span>
                  <span>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="summary-row">
                  <span>Required subtotal</span>
                  <span>{money(invoice.requiredSubtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Optional subtotal</span>
                  <span>{money(invoice.optionalSubtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Discounts</span>
                  <span>-{money(invoice.discountTotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Penalties</span>
                  <span>{money(invoice.penaltyTotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Paid</span>
                  <span>{money(invoice.amountPaid)}</span>
                </div>
                <div className="summary-row total">
                  <span>Balance due</span>
                  <span>{money(invoice.amountDue)}</span>
                </div>
              </div>
            )}
            {error && <p>{error}</p>}
          </div>
        </div>

        <div className="grid">
          <div className="card fade-up delay-2">
            <h3>Required fees</h3>
            <div className="list">
              {requiredLines.map((line) => (
                <div key={line.id} className="line-item">
                  <div>
                    <strong>{line.label}</strong>
                    {line.description && <small>{line.description}</small>}
                  </div>
                  <span className="amount">{money(line.amount)}</span>
                </div>
              ))}
              {!requiredLines.length && <p>No required items.</p>}
            </div>
          </div>

          <div className="card fade-up delay-3">
            <h3>Optional add-ons</h3>
            <div className="list">
              {optionalLines.map((line) => (
                <div key={line.id} className="line-item optional">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selection[line.id]}
                      onChange={(event) =>
                        setSelection((prev) => ({ ...prev, [line.id]: event.target.checked }))
                      }
                    />
                    <span>
                      {line.label}
                      {line.description && <small>{line.description}</small>}
                    </span>
                  </label>
                  <span className="amount">{money(line.amount)}</span>
                </div>
              ))}
              {!optionalLines.length && <p>No optional items available.</p>}
            </div>
            <div style={{ marginTop: "14px" }}>
              <button className="button" onClick={saveSelection} disabled={!hasChanges || saving}>
                {saving ? "Saving..." : "Update selections"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="card fade-up delay-2">
            <h3>Payment history</h3>
            <div className="payments">
              {(invoice?.payments || []).map((payment) => (
                <div key={payment.id} className="line-item">
                  <div>
                    <strong>{money(payment.amount)}</strong>
                    <span>
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "N/A"} /{" "}
                      {payment.status}
                    </span>
                  </div>
                  <span>{payment.receiptNo || "Receipt pending"}</span>
                </div>
              ))}
              {!invoice?.payments?.length && <p>No payments recorded yet.</p>}
            </div>
          </div>

          <div className="card fade-up delay-3">
            <h3>Receipts</h3>
            <div className="payments">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="line-item">
                  <div>
                    <strong>{receipt.receiptNo}</strong>
                    <span>
                      {receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "N/A"} /{" "}
                      {receipt.currency}
                    </span>
                    {receipt.receiptUrl && !receipt.receiptKey && (
                      <span>
                        <a href={receipt.receiptUrl} target="_blank" rel="noreferrer">
                          View receipt PDF
                        </a>
                      </span>
                    )}
                    {receipt.receiptKey && (
                      <span>
                        <button
                          className="button"
                          style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                          onClick={() => downloadReceiptPdf(receipt)}
                          disabled={downloadingReceiptId === receipt.id}
                        >
                          {downloadingReceiptId === receipt.id ? "Preparing..." : "Download PDF"}
                        </button>
                      </span>
                    )}
                    {!receipt.receiptKey && (
                      <span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              uploadReceiptPdf(receipt, file);
                            }
                          }}
                          disabled={uploadingReceiptId === receipt.id}
                        />
                      </span>
                    )}
                  </div>
                  <span>{money(receipt.amount)}</span>
                </div>
              ))}
              {uploadError && <p>{uploadError}</p>}
              {!receipts.length && <p>No receipts issued yet.</p>}
            </div>
          </div>

          <div className="card fade-up delay-3">
            <h3>Adjustments</h3>
            <div className="payments">
              {(invoice?.adjustments || []).map((adj) => (
                <div key={adj.id} className="line-item">
                  <div>
                    <strong>{adj.type}</strong>
                    <span>{adj.note || "N/A"}</span>
                  </div>
                  <span>{money(adj.amount)}</span>
                </div>
              ))}
              {!invoice?.adjustments?.length && <p>No adjustments applied.</p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
