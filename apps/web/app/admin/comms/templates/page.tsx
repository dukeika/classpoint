"use client";

import { useEffect, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type MessageTemplate = {
  id: string;
  type: string;
  channel: string;
  subject?: string | null;
  body: string;
  variablesJson?: string | null;
  isActive: boolean;
};

export default function MessageTemplatesPage() {
  const { token } = useStaffAuth();
  const schoolId = decodeSchoolId(token);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState("INVOICE_SMS");
  const [templateChannel, setTemplateChannel] = useState("SMS");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateVars, setTemplateVars] = useState("parentName,studentName,amountDue,dueDate,amount,currency,receiptNo");
  const [templateActive, setTemplateActive] = useState(true);

  const loadTemplates = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ templatesBySchool: MessageTemplate[] }>(
        `query TemplatesBySchool($schoolId: ID!, $limit: Int) {
          templatesBySchool(schoolId: $schoolId, limit: $limit) {
            id
            type
            channel
            subject
            body
            variablesJson
            isActive
          }
        }`,
        { schoolId, limit: 100 },
        token
      );
      setTemplates(data.templatesBySchool || []);
      setStatus("Templates loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && schoolId) {
      loadTemplates();
    }
  }, [token, schoolId]);

  const saveTemplate = async () => {
    if (!token || !schoolId || !templateType || !templateBody) return;
    setLoading(true);
    setStatus("");
    const variablesJson = templateVars.trim()
      ? JSON.stringify(templateVars.split(",").map((item) => item.trim()).filter(Boolean))
      : null;
    try {
      if (editingId) {
        await graphqlFetch(
          `mutation UpdateMessageTemplate($input: UpdateMessageTemplateInput!) {
            updateMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              id: editingId,
              type: templateType,
              channel: templateChannel,
              subject: templateSubject || null,
              body: templateBody,
              variablesJson,
              isActive: templateActive
            }
          },
          token
        );
        setStatus("Template updated.");
      } else {
        await graphqlFetch(
          `mutation CreateMessageTemplate($input: CreateMessageTemplateInput!) {
            createMessageTemplate(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              type: templateType,
              channel: templateChannel,
              subject: templateSubject || null,
              body: templateBody,
              variablesJson,
              isActive: templateActive
            }
          },
          token
        );
        setStatus("Template created.");
      }
      setEditingId(null);
      setTemplateSubject("");
      setTemplateBody("");
      await loadTemplates();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save template.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingId(template.id);
    setTemplateType(template.type);
    setTemplateChannel(template.channel);
    setTemplateSubject(template.subject || "");
    setTemplateBody(template.body || "");
    if (template.variablesJson) {
      try {
        const vars = JSON.parse(template.variablesJson) as string[];
        setTemplateVars(vars.join(","));
      } catch (_err) {
        setTemplateVars(templateVars);
      }
    }
    setTemplateActive(template.isActive);
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Messaging</div>
          <h1>Message templates</h1>
          <p className="muted">Create reusable SMS templates for invoices, receipts, and reminders.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadTemplates} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>{editingId ? "Edit template" : "New template"}</h3>
          <div className="form-grid">
            <input
              placeholder="Template type (e.g. INVOICE_SMS)"
              value={templateType}
              onChange={(event) => setTemplateType(event.target.value)}
            />
            <select value={templateChannel} onChange={(event) => setTemplateChannel(event.target.value)}>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            <input
              placeholder="Subject (optional)"
              value={templateSubject}
              onChange={(event) => setTemplateSubject(event.target.value)}
            />
            <textarea
              rows={5}
              placeholder="Template body"
              value={templateBody}
              onChange={(event) => setTemplateBody(event.target.value)}
            />
            <input
              placeholder="Variables (comma-separated)"
              value={templateVars}
              onChange={(event) => setTemplateVars(event.target.value)}
            />
            <label className="line-item">
              <span>Active</span>
              <input
                type="checkbox"
                checked={templateActive}
                onChange={(event) => setTemplateActive(event.target.checked)}
              />
            </label>
            <button className="button" onClick={saveTemplate} disabled={loading || !templateType || !templateBody}>
              {editingId ? "Update template" : "Create template"}
            </button>
            {status && <p className="muted">{status}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Existing templates</h3>
          <div className="list">
            {templates.length === 0 && <p className="muted">No templates yet.</p>}
            {templates.map((template) => (
              <div key={template.id} className="line-item">
                <div>
                  <strong>{template.type}</strong>
                  <small>{template.channel}</small>
                  <small>{template.subject || "No subject"}</small>
                  <small>{template.body.slice(0, 120)}{template.body.length > 120 ? "..." : ""}</small>
                </div>
                <div>
                  <button className="button" type="button" onClick={() => startEdit(template)}>
                    Edit
                  </button>
                  <span className="badge">{template.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

