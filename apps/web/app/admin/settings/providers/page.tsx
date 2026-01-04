"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeSchoolId } from "../../../components/auth-utils";
import { graphqlFetch } from "../../../components/graphql";
import { useStaffAuth } from "../../../components/staff-auth";

type ProviderConfig = {
  id: string;
  type: string;
  providerName: string;
  configJson?: unknown;
  status: string;
};

const stringifyConfig = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim() ? value : "{}";
  }
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch (_err) {
    return "{}";
  }
};

const parseConfig = (value: string) => {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return null;
  }
};

export default function ProviderConfigsPage() {
  const { token } = useStaffAuth();
  const schoolId = useMemo(() => decodeSchoolId(token), [token]);
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [providerType, setProviderType] = useState("PAYMENTS");
  const [providerName, setProviderName] = useState("PAYSTACK");
  const [providerStatus, setProviderStatus] = useState("ACTIVE");
  const [configText, setConfigText] = useState("{\n  \"secretKey\": \"\",\n  \"publicKey\": \"\"\n}");

  const loadConfigs = async () => {
    if (!token || !schoolId) return;
    setLoading(true);
    setStatus("");
    try {
      const data = await graphqlFetch<{ providerConfigsBySchool: ProviderConfig[] }>(
        `query ProviderConfigsBySchool($schoolId: ID!, $limit: Int) {
          providerConfigsBySchool(schoolId: $schoolId, limit: $limit) {
            id
            type
            providerName
            configJson
            status
          }
        }`,
        { schoolId, limit: 100 },
        token
      );
      setConfigs(data.providerConfigsBySchool || []);
      setStatus("Provider configs loaded.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to load provider configs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && schoolId) {
      loadConfigs();
    }
  }, [token, schoolId]);

  const resetForm = () => {
    setEditingId(null);
    setProviderType("PAYMENTS");
    setProviderName("PAYSTACK");
    setProviderStatus("ACTIVE");
    setConfigText("{\n  \"secretKey\": \"\",\n  \"publicKey\": \"\"\n}");
  };

  const saveConfig = async () => {
    if (!token || !schoolId || !providerType || !providerName) return;
    const parsed = parseConfig(configText);
    if (!parsed) {
      setStatus("Config JSON is invalid.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      if (editingId) {
        await graphqlFetch(
          `mutation UpdateProviderConfig($input: UpdateProviderConfigInput!) {
            updateProviderConfig(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              id: editingId,
              type: providerType,
              providerName,
              configJson: parsed,
              status: providerStatus
            }
          },
          token
        );
        setStatus("Provider config updated.");
      } else {
        await graphqlFetch(
          `mutation CreateProviderConfig($input: CreateProviderConfigInput!) {
            createProviderConfig(input: $input) { id }
          }`,
          {
            input: {
              schoolId,
              type: providerType,
              providerName,
              configJson: parsed,
              status: providerStatus
            }
          },
          token
        );
        setStatus("Provider config created.");
      }
      resetForm();
      await loadConfigs();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save provider config.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (config: ProviderConfig) => {
    setEditingId(config.id);
    setProviderType(config.type);
    setProviderName(config.providerName);
    setProviderStatus(config.status);
    setConfigText(stringifyConfig(config.configJson));
  };

  const deleteConfig = async (id: string) => {
    if (!token || !schoolId) return;
    if (!window.confirm("Delete this provider config?")) return;
    setLoading(true);
    setStatus("");
    try {
      await graphqlFetch(
        `mutation DeleteProviderConfig($schoolId: ID!, $id: ID!) {
          deleteProviderConfig(schoolId: $schoolId, id: $id)
        }`,
        { schoolId, id },
        token
      );
      setStatus("Provider config deleted.");
      await loadConfigs();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to delete provider config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <div className="breadcrumb">Admin / Settings</div>
          <h1>Provider configs</h1>
          <p className="muted">Configure payment, messaging, and other service providers per school.</p>
        </div>
        <div className="quick-actions">
          <button className="button" onClick={loadConfigs} disabled={loading || !schoolId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h3>{editingId ? "Edit provider config" : "New provider config"}</h3>
          <div className="form-grid">
            <input
              placeholder="Type (e.g. PAYMENTS)"
              value={providerType}
              onChange={(event) => setProviderType(event.target.value)}
            />
            <input
              placeholder="Provider name (e.g. PAYSTACK)"
              value={providerName}
              onChange={(event) => setProviderName(event.target.value)}
            />
            <input
              placeholder="Status (ACTIVE/INACTIVE)"
              value={providerStatus}
              onChange={(event) => setProviderStatus(event.target.value)}
            />
            <textarea
              rows={8}
              placeholder="Config JSON"
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
            />
            <button className="button" onClick={saveConfig} disabled={loading || !providerType || !providerName}>
              {editingId ? "Update config" : "Create config"}
            </button>
            <button className="button secondary" type="button" onClick={resetForm} disabled={loading}>
              Clear
            </button>
            {status && <p className="muted">{status}</p>}
          </div>
        </div>

        <div className="card">
          <h3>Existing configs</h3>
          <div className="list">
            {configs.length === 0 && <p className="muted">No provider configs yet.</p>}
            {configs.map((config) => (
              <div key={config.id} className="line-item">
                <div>
                  <strong>{config.type}</strong>
                  <small>{config.providerName}</small>
                  <small>{config.status}</small>
                </div>
                <div>
                  <button className="button" type="button" onClick={() => startEdit(config)}>
                    Edit
                  </button>
                  <button className="button secondary" type="button" onClick={() => deleteConfig(config.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
