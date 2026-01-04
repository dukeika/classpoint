"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

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

type Invoice = {
  id: string;
  invoiceNo: string;
  studentId: string;
  amountDue: number;
  amountPaid: number;
  status: string;
};

export default function PaymentTransactionsPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [payments, setPayments] = useState<PaymentTxn[]>([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualCurrency, setManualCurrency] = useState("NGN");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualProofId, setManualProofId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadPayments = async () => {
    if (!token || !schoolId) return;
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
        { schoolId, limit: 300 },
        token
      );
      setPayments(data.paymentsBySchool || []);
      setStatus("Payments loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && schoolId) {
      loadPayments();
    }
  }, [token, schoolId]);

  const findInvoice = async () => {
    if (!token || !schoolId || !invoiceNo) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ invoiceByNumber: Invoice }>(
        `query InvoiceByNumber($schoolId: ID!, $invoiceNo: String!) {
          invoiceByNumber(schoolId: $schoolId, invoiceNo: $invoiceNo) {
            id
            invoiceNo
            studentId
            amountDue
            amountPaid
            status
          }
        }`,
        { schoolId, invoiceNo },
        token
      );
      const found = data.invoiceByNumber || null;
      setInvoice(found);
      if (found) {
        setManualAmount(String(found.amountDue || ""));
        setStatus("Invoice loaded.");
      } else {
        setStatus("Invoice not found.");
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load invoice.");
    } finally {
      setLoading(false);
    }
  };

  const submitManualPayment = async () => {
    if (!token || !schoolId || !invoice || !manualFile) return;
    const amountValue = Number(manualAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setStatus("Enter a valid amount greater than 0.");
      return;
    }
    setManualSubmitting(true);
    setStatus("");
    try {
      const uploadData = await graphqlFetch<{ createManualPaymentProofUploadUrl: { uploadUrl: string; bucket: string; key: string } }>(
        `mutation CreateManualPaymentProofUploadUrl($input: CreateManualPaymentProofUploadUrlInput!) {
          createManualPaymentProofUploadUrl(input: $input) { uploadUrl bucket key }
        }`,
        {
          input: {
            schoolId,
            fileName: manualFile.name,
            contentType: manualFile.type || "image/jpeg"
          }
        },
        token
      );
      const upload = uploadData.createManualPaymentProofUploadUrl;
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": manualFile.type || "image/jpeg" },
        body: manualFile
      });
      const fileUrl = `https://${upload.bucket}.s3.amazonaws.com/${upload.key}`;
      const proofData = await graphqlFetch<{ submitManualPaymentProof: { id: string } }>(
        `mutation SubmitManualPaymentProof($input: SubmitManualPaymentProofInput!) {
          submitManualPaymentProof(input: $input) { id }
        }`,
        {
          input: {
            schoolId,
            invoiceId: invoice.id,
            amount: amountValue,
            currency: manualCurrency,
            fileUrl
          }
        },
        token
      );
      const proofId = proofData.submitManualPaymentProof?.id || "";
      setManualProofId(proofId || null);
      setStatus("Manual payment recorded. Review and approve in proofs.");
      setManualFile(null);
      await loadPayments();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to record manual payment.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== "ALL" && payment.status !== statusFilter) return false;
      if (methodFilter !== "ALL" && payment.method !== methodFilter) return false;
      if (!normalized) return true;
      return (
        payment.id.toLowerCase().includes(normalized) ||
        payment.invoiceId.toLowerCase().includes(normalized) ||
        (payment.reference || "").toLowerCase().includes(normalized) ||
        (payment.receiptNo || "").toLowerCase().includes(normalized)
      );
    });
  }, [payments, statusFilter, methodFilter, query]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      setStatus("No transactions to export.");
      return;
    }
    const rows = [
      "paymentId,invoiceId,method,status,amount,currency,paidAt,reference,receiptNo",
      ...filtered.map((payment) => [
        payment.id,
        payment.invoiceId,
        payment.method,
        payment.status,
        payment.amount,
        payment.currency,
        payment.paidAt || "",
        payment.reference || "",
        payment.receiptNo || ""
      ].join(","))
    ];
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${schoolId || "school"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Transactions export downloaded.");
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Transactions</h1>
          <p className="muted">Review payment transactions and statuses.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadPayments} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Filters</h3>
        <div className="form-grid">
          <input
            placeholder="Search by invoice, reference, receipt, or ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="grid">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REVERSED">Reversed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
              <option value="ALL">All methods</option>
              <option value="CARD">Card</option>
              <option value="TRANSFER">Transfer</option>
              <option value="USSD">USSD</option>
              <option value="CASH">Cash</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          <button className="button" type="button" onClick={exportCsv} disabled={filtered.length === 0}>
            Export CSV
          </button>
        </div>
        {status && <p className="muted">{status}</p>}
      </div>

      <div className="card">
        <h3>Record manual payment</h3>
        <div className="form-grid">
          <input
            placeholder="Invoice number"
            value={invoiceNo}
            onChange={(event) => setInvoiceNo(event.target.value)}
          />
          <button className="button" type="button" onClick={findInvoice} disabled={!invoiceNo || loading}>
            Find invoice
          </button>
          {invoice && (
            <div className="line-item">
              <div>
                <strong>{invoice.invoiceNo}</strong>
                <small>Status: {invoice.status}</small>
                <small>Amount due: {invoice.amountDue.toLocaleString()}</small>
              </div>
              <span className="badge">{invoice.amountPaid.toLocaleString()} paid</span>
            </div>
          )}
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
            onClick={submitManualPayment}
            disabled={!invoice || !manualFile || manualSubmitting}
          >
            {manualSubmitting ? "Submitting..." : "Submit manual payment"}
          </button>
          {manualProofId && (
            <p className="muted">
              Proof ID: {manualProofId}. Share this with the bursar if needed.
            </p>
          )}
          <p className="muted">Manual payments require proof review before confirmation.</p>
          <a className="button" href="/admin/payments/proofs">
            Review proofs
          </a>
        </div>
      </div>

      <div className="card">
        <h3>Transactions</h3>
        <div className="list-cards">
          {filtered.length === 0 && (
            <div className="list-card">
              <strong>No transactions found</strong>
              <span>Try adjusting the filters.</span>
            </div>
          )}
          {filtered.map((payment) => (
            <div key={payment.id} className="list-card">
              <strong>{payment.method}</strong>
              <span>
                {payment.currency} {payment.amount.toLocaleString()} · {payment.status}
              </span>
              <span>Invoice: {payment.invoiceId}</span>
              <span>Reference: {payment.reference || "n/a"}</span>
              <span>Receipt: {payment.receiptNo || "n/a"}</span>
              <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

