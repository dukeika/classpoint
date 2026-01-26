"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type VerifyResponse = {
  ok?: boolean;
  status?: string;
  reference?: string;
  amount?: number | null;
  currency?: string;
  paidAt?: string | null;
  invoiceId?: string;
  paymentIntentId?: string | null;
  invoice?: Invoice | null;
  receipts?: Receipt[];
  error?: string;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  status: string;
  amountDue: number;
  amountPaid: number;
};

type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
};

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const { token, schoolId } = usePortalAuth();
  const reference = searchParams.get("reference") || "";
  const invoiceNoParam = searchParams.get("invoiceNo") || "";
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const invoiceLink = useMemo(() => {
    const invoiceNo = invoice?.invoiceNo || invoiceNoParam;
    return invoiceNo ? `/portal/children/fees/invoices/${invoiceNo}` : "/portal";
  }, [invoice?.invoiceNo, invoiceNoParam]);

  useEffect(() => {
    if (!reference) {
      setError("Missing payment reference.");
    }
  }, [reference]);

  useEffect(() => {
    if (!reference || !token || !schoolId) return;
    let active = true;
    const verifyPayment = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, schoolId })
        });
        const payload = (await res.json()) as VerifyResponse;
        if (!res.ok || payload.error) {
          throw new Error(payload.error || "Failed to verify payment.");
        }
        if (!active) return;
        const paystackStatus = String(payload.status || "").toLowerCase();
        if (paystackStatus === "success") {
          setStatus("processing");
          setMessage("Payment received. Confirming your receipt...");
        } else {
          setStatus("failed");
          setMessage("Payment was not successful. Please try again.");
        }
        setInvoice(payload.invoice || null);
        setReceipts(payload.receipts || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Payment verification failed.");
        setStatus("failed");
      } finally {
        if (active) setLoading(false);
      }
    };
    verifyPayment();
    return () => {
      active = false;
    };
  }, [reference, token, schoolId]);

  useEffect(() => {
    if (!invoice?.id || status !== "processing" || !token) return;
    let active = true;
    let attempts = 0;
    const maxAttempts = 12;
    const interval = setInterval(async () => {
      if (!active) return;
      attempts += 1;
      try {
        const data = await graphqlFetch<{ invoiceById: Invoice | null; receiptsByInvoice: Receipt[] }>(
          `query InvoiceById($schoolId: ID!, $id: ID!, $limit: Int) {
            invoiceById(schoolId: $schoolId, id: $id) {
              id
              invoiceNo
              status
              amountDue
              amountPaid
            }
            receiptsByInvoice(invoiceId: $id, limit: $limit) {
              id
              receiptNo
              amount
              currency
              paidAt
            }
          }`,
          { schoolId, id: invoice.id, limit: 5 },
          token
        );
        if (!active) return;
        if (data.invoiceById) setInvoice(data.invoiceById);
        if (data.receiptsByInvoice?.length) setReceipts(data.receiptsByInvoice);
        const invoiceStatus = data.invoiceById?.status || invoice?.status || "";
        if (
          data.receiptsByInvoice?.length ||
          ["PAID", "PARTIALLY_PAID"].includes(String(invoiceStatus))
        ) {
          setStatus("success");
          setMessage("Payment confirmed. Your receipt is ready.");
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          setStatus("processing");
          setMessage("Payment is still processing. Refresh this page in a moment.");
          clearInterval(interval);
        }
      } catch (_err) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }
    }, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [invoice?.id, invoice?.status, status, token, schoolId]);

  const downloadReceipt = async (receiptNo: string) => {
    if (!token || !schoolId) return;
    setDownloading(receiptNo);
    try {
      const data = await graphqlFetch<{ createReceiptDownloadUrl: { downloadUrl?: string } }>(
        `mutation CreateReceiptDownloadUrl($input: CreateReceiptDownloadUrlInput!) {
          createReceiptDownloadUrl(input: $input) {
            downloadUrl
          }
        }`,
        { input: { schoolId, receiptNo } },
        token
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
  };

  return (
    <main className="portal-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Payments</div>
          <h1>Payment status</h1>
          <p className="muted">We are confirming your payment.</p>
        </div>
      </div>

      <div className="card">
        <h3>Status</h3>
        {error && <p className="muted">{error}</p>}
        {!error && (
          <>
            <p className="muted">{message || "Checking payment status..."}</p>
            <div className="summary">
              <div className="summary-row">
                <span>Reference</span>
                <span>{reference || "n/a"}</span>
              </div>
              <div className="summary-row">
                <span>Invoice</span>
                <span>{invoice?.invoiceNo || invoiceNoParam || "Loading..."}</span>
              </div>
              <div className="summary-row">
                <span>Invoice status</span>
                <span>{invoice?.status || "Pending"}</span>
              </div>
              <div className="summary-row">
                <span>Payment status</span>
                <span>{status === "processing" ? "Processing" : status === "success" ? "Confirmed" : "Failed"}</span>
              </div>
            </div>
          </>
        )}
        <div className="quick-actions" style={{ marginTop: 16 }}>
          <a className="button" href={invoiceLink}>
            Back to invoice
          </a>
          <button className="ghost-button" type="button" onClick={() => window.location.reload()} disabled={loading}>
            Refresh status
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Receipts</h3>
        <div className="list-cards">
          {receipts.length === 0 && (
            <div className="list-card">
              <strong>No receipt yet</strong>
              <span>Receipts will appear once payments are confirmed.</span>
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
                onClick={() => downloadReceipt(receipt.receiptNo)}
              >
                {downloading === receipt.receiptNo ? "Preparing..." : "Download receipt"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
