"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type Receipt = {
  id: string;
  receiptNo: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
  receiptUrl?: string | null;
  receiptBucket?: string | null;
  receiptKey?: string | null;
};

type Parent = {
  id: string;
  fullName: string;
  primaryPhone?: string | null;
  email?: string | null;
};

type StudentParentLink = {
  studentId: string;
  parentId: string;
  isPrimary: boolean;
};

type Invoice = {
  id: string;
  studentId: string;
};

export default function PaymentReceiptsPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [receiptNo, setReceiptNo] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  const loadReceipts = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ receiptsBySchool: Receipt[] }>(
        `query ReceiptsBySchool($schoolId: ID!, $limit: Int) {
          receiptsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            receiptNo
            invoiceId
            amount
            currency
            paidAt
            receiptUrl
            receiptBucket
            receiptKey
          }
        }`,
        { schoolId, limit: 200 },
        token
      );
      setReceipts(data.receiptsBySchool || []);
      setStatus("Receipts loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load receipts.");
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((item) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return true;
    return (
      item.receiptNo.toLowerCase().includes(normalized) ||
      item.invoiceId.toLowerCase().includes(normalized)
    );
  });

  const exportCsv = async () => {
    if (filteredReceipts.length === 0) {
      setStatus("No receipts to export.");
      return;
    }
    if (!token || !schoolId) return;
    setStatus("Preparing export...");
    const parentMap = new Map<string, Parent>();
    parents.forEach((parent) => parentMap.set(parent.id, parent));
    const parentLinkMap = new Map<string, StudentParentLink[]>();
    await Promise.all(
      filteredReceipts.map(async (item) => {
        if (parentLinkMap.has(item.invoiceId)) return;
        try {
          const invoiceData = await graphqlFetch<{ invoiceById: Invoice }>(
            `query InvoiceById($schoolId: ID!, $id: ID!) {
              invoiceById(schoolId: $schoolId, id: $id) {
                id
                studentId
              }
            }`,
            { schoolId, id: item.invoiceId },
            token
          );
          const invoice = invoiceData.invoiceById;
          if (!invoice?.studentId) {
            parentLinkMap.set(item.invoiceId, []);
            return;
          }
          const parentData = await graphqlFetch<{ parentsByStudent: StudentParentLink[] }>(
            `query ParentsByStudent($studentId: ID!, $limit: Int) {
              parentsByStudent(studentId: $studentId, limit: $limit) {
                studentId
                parentId
                isPrimary
              }
            }`,
            { studentId: invoice.studentId, limit: 5 },
            token
          );
          parentLinkMap.set(item.invoiceId, parentData.parentsByStudent || []);
        } catch (_err) {
          parentLinkMap.set(item.invoiceId, []);
        }
      })
    );
    const rows = [
      "receiptNo,invoiceId,amount,currency,paidAt,parentName,parentPhone,parentEmail",
      ...filteredReceipts.map((item) => {
        const links = parentLinkMap.get(item.invoiceId) || [];
        const primary = links.find((link) => link.isPrimary) || links[0];
        const parent = primary ? parentMap.get(primary.parentId) : null;
        return [
          item.receiptNo,
          item.invoiceId,
          item.amount,
          item.currency,
          item.paidAt || "",
          (parent?.fullName || "").replace(/,/g, " "),
          parent?.primaryPhone || "",
          parent?.email || ""
        ].join(",");
      })
    ];
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipts-${schoolId || "school"}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    setStatus("Receipts export downloaded.");
  };

  useEffect(() => {
    if (token && schoolId) {
      loadReceipts();
      loadParents();
    }
  }, [token, schoolId]);

  const loadParents = async () => {
    if (!token || !schoolId) return;
    try {
      const data = await graphqlFetch<{ parentsBySchool: Parent[] }>(
        `query ParentsBySchool($schoolId: ID!, $limit: Int) {
          parentsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            fullName
            primaryPhone
            email
          }
        }`,
        { schoolId, limit: 500 },
        token
      );
      setParents(data.parentsBySchool || []);
    } catch (_err) {
      setParents([]);
    }
  };

  const findReceipt = async () => {
    if (!token || !schoolId || !receiptNo) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ receiptByNumber: Receipt }>(
        `query ReceiptByNumber($schoolId: ID!, $receiptNo: String!) {
          receiptByNumber(schoolId: $schoolId, receiptNo: $receiptNo) {
            id
            receiptNo
            invoiceId
            amount
            currency
            paidAt
            receiptUrl
            receiptBucket
            receiptKey
          }
        }`,
        { schoolId, receiptNo },
        token
      );
      setReceipt(data.receiptByNumber || null);
      setStatus(data.receiptByNumber ? "Receipt loaded." : "Receipt not found.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load receipt.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (number: string) => {
    if (!token || !schoolId || !number) return;
    setStatus("");
    try {
      const data = await graphqlFetch<{ createReceiptDownloadUrl: { downloadUrl: string } }>(
        `mutation CreateReceiptDownloadUrl($input: CreateReceiptDownloadUrlInput!) {
          createReceiptDownloadUrl(input: $input) { downloadUrl }
        }`,
        { input: { schoolId, receiptNo: number } },
        token
      );
      const url = data.createReceiptDownloadUrl?.downloadUrl;
      if (!url) throw new Error("Receipt download unavailable.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to download receipt.");
    }
  };

  const uploadReceipt = async () => {
    if (!token || !schoolId || !receiptNo || !file) return;
    setUploading(true);
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
      setStatus("Receipt file attached.");
      setFile(null);
      await findReceipt();
      await loadReceipts();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to upload receipt.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Payments</div>
          <h1>Receipts</h1>
          <p className="muted">Search, attach, and download receipts.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadReceipts} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Find receipt</h3>
          <div className="form-grid">
            <input
              placeholder="Receipt number"
              value={receiptNo}
              onChange={(event) => setReceiptNo(event.target.value)}
            />
            <div className="grid">
              <button className="button" onClick={findReceipt} disabled={!receiptNo || loading}>
                Find receipt
              </button>
              <button className="button" onClick={() => downloadReceipt(receiptNo)} disabled={!receiptNo}>
                Download receipt
              </button>
            </div>
            {status && <p className="muted">{status}</p>}
          </div>
          {receipt && (
            <div className="list" style={{ marginTop: 12 }}>
              <div className="line-item">
                <div>
                  <strong>{receipt.receiptNo}</strong>
                  <small>
                    {receipt.currency} {receipt.amount.toLocaleString()}
                  </small>
                  <small>Invoice: {receipt.invoiceId}</small>
                  <small>{receipt.paidAt ? new Date(receipt.paidAt).toLocaleString() : "Pending"}</small>
                </div>
                {receipt.receiptUrl && (
                  <a className="button" href={receipt.receiptUrl} target="_blank" rel="noreferrer">
                    View file
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3>Attach receipt PDF</h3>
          <div className="form-grid">
            <input
              placeholder="Receipt number"
              value={receiptNo}
              onChange={(event) => setReceiptNo(event.target.value)}
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
            <button className="button" type="button" onClick={uploadReceipt} disabled={!receiptNo || !file || uploading}>
              {uploading ? "Uploading..." : "Upload receipt"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Recent receipts</h3>
        <div className="form-grid">
          <input
            placeholder="Search receipts by number or invoice"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="button" type="button" onClick={exportCsv} disabled={filteredReceipts.length === 0}>
            Export CSV
          </button>
        </div>
        <div className="list-cards">
          {filteredReceipts.length === 0 && (
            <div className="list-card">
              <strong>No receipts yet</strong>
              <span>Receipts appear after payments are confirmed.</span>
            </div>
          )}
          {filteredReceipts.slice(0, 12).map((item) => (
            <div key={item.id} className="list-card">
              <strong>{item.receiptNo}</strong>
              <span>
                {item.currency} {item.amount.toLocaleString()}
              </span>
              <span>{item.paidAt ? new Date(item.paidAt).toLocaleString() : "Pending"}</span>
              <span>Invoice: {item.invoiceId}</span>
              <button className="button" type="button" onClick={() => downloadReceipt(item.receiptNo)}>
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

