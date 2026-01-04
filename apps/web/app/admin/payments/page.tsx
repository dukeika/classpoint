"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../components/auth-utils";
import { graphqlFetch } from "../../components/graphql";
import { useStaffAuth } from "../../components/staff-auth";

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
  invoiceId: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
  receiptUrl?: string | null;
};

export default function AdminPaymentsPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [payments, setPayments] = useState<PaymentTxn[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const loadPayments = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const [paymentsData, receiptsData] = await Promise.all([
        graphqlFetch<{ paymentsBySchool: PaymentTxn[] }>(
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
          { schoolId, limit: 200 },
          token
        ),
        graphqlFetch<{ receiptsBySchool: Receipt[] }>(
          `query ReceiptsBySchool($schoolId: ID!, $limit: Int) {
            receiptsBySchool(schoolId: $schoolId, limit: $limit) {
              id
              receiptNo
              invoiceId
              amount
              currency
              paidAt
              receiptUrl
            }
          }`,
          { schoolId, limit: 200 },
          token
        )
      ]);
      setPayments(paymentsData.paymentsBySchool || []);
      setReceipts(receiptsData.receiptsBySchool || []);
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

  const sortedPayments = useMemo(
    () =>
      [...payments].sort((a, b) => {
        const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return dateB - dateA;
      }),
    [payments]
  );

  const sortedReceipts = useMemo(
    () =>
      [...receipts].sort((a, b) => {
        const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
        const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
        return dateB - dateA;
      }),
    [receipts]
  );

  const confirmedTotal = payments
    .filter((payment) => payment.status === "CONFIRMED")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingTotal = payments
    .filter((payment) => payment.status === "PENDING")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Payments overview</h1>
          <p className="muted">Monitor collections, receipts, and manual payment approvals.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadPayments} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Collections</h3>
          <div className="summary">
            <div className="summary-row">
              <span>Confirmed</span>
              <span>{confirmedTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Pending</span>
              <span>{pendingTotal.toLocaleString()}</span>
            </div>
          </div>
          <p className="muted">Totals based on payment transactions recorded for this school.</p>
        </div>

        <div className="card">
          <h3>Quick actions</h3>
          <div className="quick-actions">
            <a className="button" href="/admin/payments/proofs">
              Review proofs
            </a>
            <a className="button" href="/admin/payments/transactions">
              View transactions
            </a>
            <a className="button" href="/admin/payments/receipts">
              Manage receipts
            </a>
          </div>
          {status && <p className="muted">{status}</p>}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Recent payments</h3>
          <div className="list-cards">
            {sortedPayments.length === 0 && (
              <div className="list-card">
                <strong>No payments yet</strong>
                <span>Transactions will appear as payments are recorded.</span>
              </div>
            )}
            {sortedPayments.slice(0, 8).map((payment) => (
              <div key={payment.id} className="list-card">
                <strong>{payment.method}</strong>
                <span>
                  {payment.currency} {payment.amount.toLocaleString()} · {payment.status}
                </span>
                <span>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Pending"}</span>
                <span>Invoice: {payment.invoiceId}</span>
                <span>{payment.receiptNo ? `Receipt ${payment.receiptNo}` : "No receipt yet"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Recent receipts</h3>
          <div className="list-cards">
            {sortedReceipts.length === 0 && (
              <div className="list-card">
                <strong>No receipts yet</strong>
                <span>Receipts appear after payment confirmation.</span>
              </div>
            )}
            {sortedReceipts.slice(0, 8).map((receipt) => (
              <div key={receipt.id} className="list-card">
                <strong>{receipt.receiptNo}</strong>
                <span>
                  {receipt.currency} {receipt.amount.toLocaleString()}
                </span>
                <span>{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : "Pending"}</span>
                <span>Invoice: {receipt.invoiceId}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
