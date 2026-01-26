"use client";

import { useEffect, useMemo, useState } from "react";
import { graphqlFetch } from "../../../../components/graphql";
import { usePortalAuth } from "../../../../components/portal-auth";

type InvoiceLine = {
  id: string;
  label: string;
  amount: number;
  isOptional: boolean;
  isSelected?: boolean | null;
  sortOrder: number;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  status: string;
  studentId: string;
  classGroupId?: string | null;
  termId: string;
  dueAt?: string | null;
  currency?: string | null;
  lastProcessedAt?: string | null;
  requiredSubtotal: number;
  optionalSubtotal: number;
  discountTotal: number;
  penaltyTotal: number;
  amountPaid: number;
  amountDue: number;
  lines: InvoiceLine[];
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
};

type PaymentTxn = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string | null;
};

type PaymentIntent = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  externalReference?: string | null;
};

type PaystackHandler = {
  openIframe: () => void;
};

type PaystackPop = {
  setup: (options: Record<string, unknown>) => PaystackHandler;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

const loadPaystackScript = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Paystack is only available in the browser."));
      return;
    }
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack checkout."));
    document.body.appendChild(script);
  });

type ManualPaymentProof = {
  id: string;
  status: string;
  fileUrl: string;
  createdAt?: string | null;
};

export default function PortalInvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const { token: authToken, schoolId, userId, email } = usePortalAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [payments, setPayments] = useState<PaymentTxn[]>([]);
  const [selectedOptionalIds, setSelectedOptionalIds] = useState<string[]>([]);
  const [paymentProvider, setPaymentProvider] = useState("PAYSTACK");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualCurrency, setManualCurrency] = useState("NGN");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualProof, setManualProof] = useState<ManualPaymentProof | null>(null);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parentId = userId;
  const invoiceNo = params.invoiceId;
  const isProcessing = useMemo(
    () => Boolean(invoice && !invoice.lastProcessedAt && invoice.amountDue === 0),
    [invoice]
  );
  const isPayable = useMemo(
    () => Boolean(invoice && invoice.status !== "PAID" && invoice.amountDue > 0),
    [invoice]
  );

  useEffect(() => {
    const loadInvoice = async () => {
      if (!authToken || !schoolId || !invoiceNo) return;
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlFetch<{ invoiceByNumber: Invoice | null }>(
          `query InvoiceByNumber($schoolId: ID!, $invoiceNo: String!) {
            invoiceByNumber(schoolId: $schoolId, invoiceNo: $invoiceNo) {
              id
              invoiceNo
              status
              studentId
              classGroupId
              termId
              dueAt
              currency
              lastProcessedAt
              requiredSubtotal
              optionalSubtotal
              discountTotal
              penaltyTotal
              amountPaid
              amountDue
              lines {
                id
                label
                amount
                isOptional
                isSelected
                sortOrder
              }
            }
          }`,
          { schoolId, invoiceNo }
        );
        const loaded: Invoice | null = data.invoiceByNumber || null;
        setInvoice(loaded);
        if (loaded && !manualAmount) {
          setManualAmount(String(loaded.amountDue || ""));
        }
        if (loaded) {
          const defaults = loaded.lines.filter((line) => line.isOptional && line.isSelected).map((line) => line.id);
          setSelectedOptionalIds(defaults);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoice.");
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [authToken, schoolId, invoiceNo]);

  useEffect(() => {
    const loadReceipts = async () => {
      if (!authToken || !schoolId || !invoice?.id) return;
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
          { invoiceId: invoice.id, limit: 10 }
        );
        setReceipts(data.receiptsByInvoice || []);
      } catch (err) {
        setReceipts([]);
      }
    };
    loadReceipts();
  }, [authToken, schoolId, invoice?.id]);

  useEffect(() => {
    const loadPayments = async () => {
      if (!authToken || !schoolId || !invoice?.id) return;
      try {
        const data = await graphqlFetch<{ paymentsByInvoice: PaymentTxn[] }>(
          `query PaymentsByInvoice($invoiceId: ID!, $limit: Int) {
            paymentsByInvoice(invoiceId: $invoiceId, limit: $limit) {
              id
              amount
              currency
              method
              status
              paidAt
            }
          }`,
          { invoiceId: invoice.id, limit: 10 }
        );
        setPayments(data.paymentsByInvoice || []);
      } catch (err) {
        setPayments([]);
      }
    };
    loadPayments();
  }, [authToken, schoolId, invoice?.id]);

  const submitManualProof = async () => {
    if (!authToken || !schoolId || !invoice || !manualFile) return;
    const amountValue = Number(manualAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setManualStatus("Enter a valid amount.");
      return;
    }
    setManualSubmitting(true);
    setManualStatus(null);
    try {
      const uploadData = await graphqlFetch<{ createManualPaymentProofUploadUrl: { uploadUrl: string; bucket: string; key: string } }>(
        `mutation CreateManualPaymentProofUploadUrl($input: CreateManualPaymentProofUploadUrlInput!) {
          createManualPaymentProofUploadUrl(input: $input) {
            uploadUrl
            bucket
            key
          }
        }`,
        {
          input: {
            schoolId,
            fileName: manualFile.name,
            contentType: manualFile.type || "image/jpeg"
          }
        }
      );
      const upload = uploadData.createManualPaymentProofUploadUrl;
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": manualFile.type || "image/jpeg" },
        body: manualFile
      });
      const fileUrl = `https://${upload.bucket}.s3.amazonaws.com/${upload.key}`;
      const proofData = await graphqlFetch<{ submitManualPaymentProof: ManualPaymentProof | null }>(
        `mutation SubmitManualPaymentProof($input: SubmitManualPaymentProofInput!) {
          submitManualPaymentProof(input: $input) {
            id
            status
            fileUrl
            createdAt
          }
        }`,
        {
          input: {
            schoolId,
            invoiceId: invoice.id,
            amount: amountValue,
            currency: manualCurrency,
            fileUrl,
            submittedByParentId: parentId || null
          }
        }
      );
      setManualProof(proofData.submitManualPaymentProof || null);
      setManualStatus("Proof submitted. Share the proof ID with the school admin.");
      setManualFile(null);
    } catch (err) {
      setManualStatus(err instanceof Error ? err.message : "Failed to submit proof.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const requiredLines = useMemo(
    () => (invoice?.lines || []).filter((line) => !line.isOptional).sort((a, b) => a.sortOrder - b.sortOrder),
    [invoice]
  );
  const optionalLines = useMemo(
    () => (invoice?.lines || []).filter((line) => line.isOptional).sort((a, b) => a.sortOrder - b.sortOrder),
    [invoice]
  );

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Fees / Invoice {invoiceNo}</div>
          <h1>Invoice details</h1>
          <p className="muted">Review breakdown, adjust optional items, and make payment.</p>
        </div>
        <button className="button">Pay now</button>
      </div>

      {loading && (
        <div className="card">
          <p>Loading invoice...</p>
        </div>
      )}

      {error && (
        <div className="card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !invoice && (
        <div className="card">
          <p>No invoice found. Confirm the invoice number.</p>
        </div>
      )}

      {invoice && (
        <>
      <div className="grid">
        <div className="card">
          <h3>Summary</h3>
          <div className="summary">
            <div className="summary-row">
              <span>Student</span>
              <span>On record</span>
            </div>
            <div className="summary-row">
              <span>Class</span>
              <span>{invoice.classGroupId ? "Assigned" : "N/A"}</span>
            </div>
            <div className="summary-row">
              <span>Term</span>
              <span>Current term</span>
            </div>
            <div className="summary-row">
              <span>Due</span>
              <span>{invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="summary-row total">
              <span>Amount due</span>
              <span>{invoice.amountDue.toLocaleString()}</span>
            </div>
            {isProcessing && (
              <div className="summary-row">
                <span>Status</span>
                <span>Processing invoice totals...</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Payment status</h3>
          <div className="list">
            <div className="line-item">
              <div>
                <strong>Paid</strong>
                <small>{invoice.amountPaid.toLocaleString()}</small>
              </div>
              <span className="status-pill">{invoice.status}</span>
            </div>
            <div className="line-item">
              <div>
                <strong>Balance</strong>
                <small>{invoice.amountDue.toLocaleString()}</small>
              </div>
              <span className="status-pill">Due</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Breakdown</h3>
        <div className="list">
          {requiredLines.length === 0 && optionalLines.length === 0 && (
            <div className="line-item">
              <div>
                <strong>No line items found</strong>
                <small className="muted">If this looks wrong, contact your school before paying.</small>
              </div>
            </div>
          )}
          {requiredLines.map((item) => (
            <div key={item.id} className="line-item">
              <label>
                <span>{item.label}</span>
              </label>
              <span className="amount">{item.amount.toLocaleString()}</span>
            </div>
          ))}
          {optionalLines.map((item) => (
            <div key={item.id} className="line-item optional">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOptionalIds.includes(item.id)}
                  disabled={savingSelection}
                  onChange={async (event) => {
                    if (!invoice || !authToken || !schoolId) return;
                    const next = event.target.checked
                      ? [...selectedOptionalIds, item.id]
                      : selectedOptionalIds.filter((id) => id !== item.id);
                    setSelectedOptionalIds(next);
                    setSavingSelection(true);
                    try {
                      const data = await graphqlFetch<{ selectInvoiceOptionalItems: Partial<Invoice> & { lines: InvoiceLine[] } }>(
                        `mutation SelectInvoiceOptionalItems($input: SelectInvoiceOptionalItemsInput!) {
                          selectInvoiceOptionalItems(input: $input) {
                            id
                            requiredSubtotal
                            optionalSubtotal
                            discountTotal
                            penaltyTotal
                            amountPaid
                            amountDue
                            lines {
                              id
                              isSelected
                            }
                          }
                        }`,
                        {
                          input: {
                            schoolId,
                            invoiceId: invoice.id,
                            selectedLineIds: next
                          }
                        }
                      );
                      const updated = data.selectInvoiceOptionalItems;
                      if (updated) {
                        const mergedLines = invoice.lines.map((line) => {
                          const match = updated.lines?.find((updatedLine: InvoiceLine) => updatedLine.id === line.id);
                          return match ? { ...line, isSelected: match.isSelected } : line;
                        });
                        setInvoice({
                          ...invoice,
                          requiredSubtotal: updated.requiredSubtotal,
                          optionalSubtotal: updated.optionalSubtotal,
                          discountTotal: updated.discountTotal,
                          penaltyTotal: updated.penaltyTotal,
                          amountPaid: updated.amountPaid,
                          amountDue: updated.amountDue,
                          lines: mergedLines
                        });
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Failed to update selection.");
                    } finally {
                      setSavingSelection(false);
                    }
                  }}
                />
                <span>{item.label}</span>
              </label>
              <span className="amount">{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="summary" style={{ marginTop: 16 }}>
          <div className="summary-row">
            <span>Required subtotal</span>
            <span>{invoice.requiredSubtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Optional subtotal</span>
            <span>{invoice.optionalSubtotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Discounts</span>
            <span>-{invoice.discountTotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Penalties</span>
            <span>{invoice.penaltyTotal.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Paid</span>
            <span>{invoice.amountPaid.toLocaleString()}</span>
          </div>
          <div className="summary-row total">
            <span>Total due</span>
            <span>{invoice.amountDue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Pay now</h3>
        <div className="list">
          <div className="line-item">
            <div>
              <strong>Amount due</strong>
              <small>{invoice.amountDue.toLocaleString()}</small>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value)}>
                <option value="PAYSTACK">Paystack</option>
                <option value="FLUTTERWAVE" disabled>
                  Flutterwave (coming soon)
                </option>
              </select>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Bank transfer</option>
                <option value="USSD">USSD</option>
              </select>
              <button
                className="button"
                disabled={creatingIntent || !isPayable}
                onClick={async () => {
                  if (!authToken || !schoolId || !invoice) return;
                  setCreatingIntent(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/payments/initialize", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        schoolId,
                        invoiceId: invoice.id,
                        type: "SCHOOL_FEE",
                        provider: paymentProvider,
                        paymentMethod,
                        payerParentId: parentId,
                        payerEmail: email,
                        callbackUrl: `${window.location.origin}/portal/payments/callback?invoiceNo=${invoice.invoiceNo}`
                      })
                    });
                    const payload = (await res.json()) as {
                      authorizationUrl?: string;
                      reference?: string;
                      paymentIntentId?: string | null;
                      paymentTransactionId?: string | null;
                      publicKey?: string;
                      amountKobo?: number;
                      currency?: string;
                      email?: string;
                      error?: string;
                    };
                    if (!res.ok || payload.error) {
                      throw new Error(payload.error || "Failed to start payment.");
                    }
                    setPaymentIntent({
                      id: payload.paymentIntentId || "pending",
                      amount: invoice.amountDue,
                      currency: "NGN",
                      status: "INITIATED",
                      provider: paymentProvider,
                      externalReference: payload.reference || null
                    });
                    await loadPaystackScript();
                    if (!payload.publicKey || !payload.reference || !payload.amountKobo) {
                      throw new Error("Paystack checkout data is missing.");
                    }
                    const handler = window.PaystackPop?.setup({
                      key: payload.publicKey,
                      email: payload.email || email,
                      amount: payload.amountKobo,
                      currency: payload.currency || "NGN",
                      ref: payload.reference,
                      callback: () => {
                        const url = new URL(`${window.location.origin}/portal/payments/callback`);
                        url.searchParams.set("reference", payload.reference || "");
                        url.searchParams.set("invoiceNo", invoice.invoiceNo);
                        window.location.href = url.toString();
                      },
                      onClose: () => {
                        setError("Payment was cancelled.");
                      }
                    });
                    if (handler) {
                      handler.openIframe();
                    } else if (payload.authorizationUrl) {
                      window.location.href = payload.authorizationUrl;
                    } else {
                      throw new Error("Unable to open Paystack checkout.");
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to start payment.");
                  } finally {
                    setCreatingIntent(false);
                  }
                }}
              >
                {creatingIntent ? "Starting..." : isPayable ? "Continue to payment" : "Invoice not payable"}
              </button>
            </div>
          </div>
        </div>
        {!isPayable && (
          <p className="muted" style={{ marginTop: 12 }}>
            {isProcessing ? "Invoice totals are still processing. Refresh in a moment." : "No payment due."}
          </p>
        )}
        {paymentIntent?.status === "SUCCEEDED" && (
          <div className="card" style={{ marginTop: 12 }}>
            <strong>Payment successful</strong>
            <p className="muted">Your payment was confirmed. A receipt will appear below shortly.</p>
          </div>
        )}
        {paymentIntent && (
          <div className="summary" style={{ marginTop: 12 }}>
            <div className="summary-row">
              <span>Payment status</span>
              <span>{paymentIntent.status}</span>
            </div>
            <div className="summary-row">
              <span>Provider</span>
              <span>{paymentIntent.provider}</span>
            </div>
            <div className="summary-row">
              <span>Reference</span>
              <span>{paymentIntent.externalReference || paymentIntent.id}</span>
            </div>
            <div className="summary-row">
              <span>Next step</span>
              <span>{creatingIntent ? "Redirecting to Paystack..." : "Complete checkout in Paystack"}</span>
            </div>
            <div className="summary-row">
              <span>Method</span>
              <span>{paymentMethod}</span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Manual payment proof</h3>
        <p className="muted">Use this if you paid via bank transfer or cash.</p>
        <div className="form-grid">
          <div className="grid">
            <input
              placeholder="Amount paid"
              type="number"
              value={manualAmount}
              onChange={(event) => setManualAmount(event.target.value)}
            />
            <select value={manualCurrency} onChange={(event) => setManualCurrency(event.target.value)}>
              <option value="NGN">NGN</option>
              <option value="GHS">GHS</option>
              <option value="KES">KES</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setManualFile(event.target.files?.[0] || null)}
          />
          <button
            className="button"
            type="button"
            onClick={submitManualProof}
            disabled={!manualFile || !manualAmount || manualSubmitting}
          >
            {manualSubmitting ? "Submitting..." : "Submit proof"}
          </button>
          {manualStatus && <p className="muted">{manualStatus}</p>}
          {manualProof && (
            <div className="line-item">
              <div>
                <strong>Proof submitted</strong>
                <small>ID: {manualProof.id}</small>
                <small>Status: {manualProof.status}</small>
              </div>
              <a className="button" href={manualProof.fileUrl} target="_blank" rel="noreferrer">
                View upload
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Payment history</h3>
        <div className="list-cards">
          {payments.length === 0 && (
            <div className="list-card">
              <strong>No payments yet</strong>
              <span>Payments will appear once processed.</span>
            </div>
          )}
          {payments.map((payment) => (
            <div key={payment.id} className="list-card">
              <strong>{payment.method}</strong>
              <span>
                {payment.currency} {payment.amount.toLocaleString()} -{" "}
                {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : "Pending"}
              </span>
              <span className="status-pill">{payment.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Receipts</h3>
        <div className="list-cards">
          {receipts.length === 0 && (
            <div className="list-card">
              <strong>No receipts yet</strong>
              <span>Receipts appear once payments are confirmed.</span>
            </div>
          )}
          {receipts.map((receipt) => (
            <div key={receipt.id} className="list-card">
              <strong>{receipt.receiptNo}</strong>
              <span>
                {receipt.currency} {receipt.amount.toLocaleString()} -{" "}
                {receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "Pending"}
              </span>
              <button
                className="ghost-button"
                disabled={downloading === receipt.receiptNo}
                onClick={async () => {
                  if (!authToken || !schoolId) return;
                  setDownloading(receipt.receiptNo);
                  try {
                    const data = await graphqlFetch<{ createReceiptDownloadUrl: { downloadUrl?: string } }>(
                      `mutation CreateReceiptDownloadUrl($input: CreateReceiptDownloadUrlInput!) {
                        createReceiptDownloadUrl(input: $input) {
                          downloadUrl
                        }
                      }`,
                      { input: { schoolId, receiptNo: receipt.receiptNo } }
                    );
                    const url = data.createReceiptDownloadUrl?.downloadUrl;
                    if (url) {
                      window.open(url, "_blank", "noopener,noreferrer");
                    } else {
                      throw new Error("Download URL not available.");
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to download receipt.");
                  } finally {
                    setDownloading(null);
                  }
                }}
              >
                {downloading === receipt.receiptNo ? "Preparing..." : "Download receipt"}
              </button>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </main>
  );
}
