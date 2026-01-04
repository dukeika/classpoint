"use client";

import { useState } from "react";
import { graphqlFetch } from "../../../components/graphql";
import { usePortalAuth } from "../../../components/portal-auth";

type Receipt = {
  id: string;
  receiptNo: string;
  studentId?: string | null;
  amount: number;
  currency: string;
  paidAt?: string | null;
  invoiceId?: string | null;
};

export default function PortalReceiptsPage() {
  const { token: authToken, schoolId } = usePortalAuth();
  const [receiptNo, setReceiptNo] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Portal / Fees / Receipts</div>
          <h1>Receipts</h1>
          <p className="muted">Download payment receipts and track history per child.</p>
        </div>
      </div>

      <div className="card">
        <div className="quick-actions">
          <input
            className="chip-input"
            placeholder="Paste receipt number"
            value={receiptNo}
            onChange={(event) => setReceiptNo(event.target.value)}
          />
          <button
            className="button"
            disabled={!receiptNo || !authToken || !schoolId || loading}
            onClick={async () => {
              if (!authToken || !schoolId || !receiptNo) return;
              setLoading(true);
              setError(null);
              try {
                const data = await graphqlFetch<{ receiptByNumber: Receipt | null }>(
                  `query ReceiptByNumber($schoolId: ID!, $receiptNo: String!) {
                    receiptByNumber(schoolId: $schoolId, receiptNo: $receiptNo) {
                      id
                      receiptNo
                      invoiceId
                      amount
                      currency
                      paidAt
                    }
                  }`,
                  { schoolId, receiptNo }
                );
                setReceipt(data.receiptByNumber || null);
              } catch (err) {
                setReceipt(null);
                setError(err instanceof Error ? err.message : "Failed to load receipt.");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Searching..." : "Find receipt"}
          </button>
        </div>
      </div>

      <div className="card">
        {!receipt && !error && (
          <div className="list-cards">
            <div className="list-card">
              <strong>No receipt loaded</strong>
              <span>Paste a receipt number to retrieve and download it.</span>
            </div>
          </div>
        )}
        {error && (
          <div className="list-cards">
            <div className="list-card">
              <strong>Unable to find receipt</strong>
              <span>{error}</span>
            </div>
          </div>
        )}
        {receipt && (
          <div className="list-cards">
            <div className="list-card">
              <strong>{receipt.receiptNo}</strong>
              <span>
                {receipt.currency} {receipt.amount.toLocaleString()} ·{" "}
                {receipt.paidAt ? new Date(receipt.paidAt).toLocaleDateString() : "Pending"}
              </span>
              <button
                className="ghost-button"
                disabled={downloading}
                onClick={async () => {
                  if (!authToken || !schoolId) return;
                  setDownloading(true);
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
                    setDownloading(false);
                  }
                }}
              >
                {downloading ? "Preparing..." : "Download receipt"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
