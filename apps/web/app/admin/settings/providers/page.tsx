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
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/portal/payments/callback`;
  }, []);
  const webhookUrl =
    process.env.NEXT_PUBLIC_PAYSTACK_SCHOOL_WEBHOOK_URL || process.env.NEXT_PUBLIC_PAYMENTS_WEBHOOK_URL || "";
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [providerType, setProviderType] = useState("PAYMENT_GATEWAY");
  const [providerName, setProviderName] = useState("PAYSTACK");
  const [providerStatus, setProviderStatus] = useState("ACTIVE");
  const [paystackConfig, setPaystackConfig] = useState({
    environment: "test",
    publicKey_test: "",
    secretKey_test: "",
    publicKey_live: "",
    secretKey_live: "",
    webhookSecret: "",
    callbackUrl: "",
    splitCode: "",
    platformFeePercent: "0"
  });
  const [configText, setConfigText] = useState(
    "{\n  \"environment\": \"test\",\n  \"publicKey_test\": \"\",\n  \"secretKey_test\": \"\",\n  \"publicKey_live\": \"\",\n  \"secretKey_live\": \"\",\n  \"webhookSecret\": \"\",\n  \"callbackUrl\": \"\",\n  \"splitCode\": \"\",\n  \"platformFeePercent\": 0\n}"
  );

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
    setProviderType("PAYMENT_GATEWAY");
    setProviderName("PAYSTACK");
    setProviderStatus("ACTIVE");
    setPaystackConfig({
      environment: "test",
      publicKey_test: "",
      secretKey_test: "",
      publicKey_live: "",
      secretKey_live: "",
      webhookSecret: "",
      callbackUrl: "",
      splitCode: "",
      platformFeePercent: "0"
    });
    setConfigText(
      "{\n  \"environment\": \"test\",\n  \"publicKey_test\": \"\",\n  \"secretKey_test\": \"\",\n  \"publicKey_live\": \"\",\n  \"secretKey_live\": \"\",\n  \"webhookSecret\": \"\",\n  \"callbackUrl\": \"\",\n  \"splitCode\": \"\",\n  \"platformFeePercent\": 0\n}"
    );
  };

  const copyValue = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setStatus("Copied to clipboard.");
    } catch (_err) {
      setStatus("Copy failed. Select and copy manually.");
    }
  };

  const saveConfig = async () => {
    if (!token || !schoolId || !providerType || !providerName) return;
    const isPaystack = providerName.toUpperCase() === "PAYSTACK";
    const parsed = isPaystack
      ? {
          environment: paystackConfig.environment,
          publicKey_test: paystackConfig.publicKey_test?.trim() || "",
          secretKey_test: paystackConfig.secretKey_test?.trim() || "",
          publicKey_live: paystackConfig.publicKey_live?.trim() || "",
          secretKey_live: paystackConfig.secretKey_live?.trim() || "",
          webhookSecret: paystackConfig.webhookSecret?.trim() || "",
          callbackUrl: paystackConfig.callbackUrl?.trim() || callbackUrl || "",
          splitCode: paystackConfig.splitCode?.trim() || "",
          platformFeePercent: Number.isFinite(Number(paystackConfig.platformFeePercent))
            ? Number(paystackConfig.platformFeePercent)
            : 0
        }
      : parseConfig(configText);
    if (!parsed) {
      setStatus("Config JSON is invalid.");
      return;
    }
    const configPayload = JSON.stringify(parsed);
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
              configJson: configPayload,
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
              configJson: configPayload,
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
    const raw = stringifyConfig(config.configJson);
    const parsed = parseConfig(raw) || {};
    if (String(config.providerName || "").toUpperCase() === "PAYSTACK") {
      const environment =
        String(parsed.environment || "").toLowerCase() === "live" ? "live" : "test";
      setPaystackConfig({
        environment,
        publicKey_test: String(parsed.publicKey_test || parsed.publicKey || ""),
        secretKey_test: String(parsed.secretKey_test || parsed.secretKey || ""),
        publicKey_live: String(parsed.publicKey_live || ""),
        secretKey_live: String(parsed.secretKey_live || ""),
        webhookSecret: String(parsed.webhookSecret || ""),
        callbackUrl: String(parsed.callbackUrl || ""),
        splitCode: String(parsed.splitCode || ""),
        platformFeePercent: String(parsed.platformFeePercent || 0)
      });
    } else {
      setConfigText(raw);
    }
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
            {providerName.toUpperCase() === "PAYSTACK" ? (
              <>
                <select
                  value={paystackConfig.environment}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, environment: event.target.value }))
                  }
                >
                  <option value="test">Paystack environment: test</option>
                  <option value="live">Paystack environment: live</option>
                </select>
                <input
                  placeholder="Test public key"
                  value={paystackConfig.publicKey_test}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, publicKey_test: event.target.value }))
                  }
                />
                <input
                  placeholder="Test secret key"
                  value={paystackConfig.secretKey_test}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, secretKey_test: event.target.value }))
                  }
                />
                <input
                  placeholder="Live public key"
                  value={paystackConfig.publicKey_live}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, publicKey_live: event.target.value }))
                  }
                />
                <input
                  placeholder="Live secret key"
                  value={paystackConfig.secretKey_live}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, secretKey_live: event.target.value }))
                  }
                />
                <input
                  placeholder="Webhook secret (optional)"
                  value={paystackConfig.webhookSecret}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, webhookSecret: event.target.value }))
                  }
                />
                <input
                  placeholder="Split code (optional)"
                  value={paystackConfig.splitCode}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({ ...prev, splitCode: event.target.value }))
                  }
                />
                <input
                  placeholder="Platform fee percent (optional)"
                  type="number"
                  value={paystackConfig.platformFeePercent}
                  onChange={(event) =>
                    setPaystackConfig((prev) => ({
                      ...prev,
                      platformFeePercent: event.target.value
                    }))
                  }
                />
              </>
            ) : (
              <textarea
                rows={8}
                placeholder="Config JSON"
                value={configText}
                onChange={(event) => setConfigText(event.target.value)}
              />
            )}
            {providerName.toUpperCase() === "PAYSTACK" && (
              <div className="card" style={{ margin: 0 }}>
                <div className="line-item">
                  <div>
                    <strong>Callback URL</strong>
                    <small className="muted">{callbackUrl || "Set from school domain"}</small>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => copyValue(callbackUrl)}
                    disabled={!callbackUrl}
                  >
                    Copy
                  </button>
                </div>
                <div className="line-item">
                  <div>
                    <strong>Webhook URL</strong>
                    <small className="muted">
                      {webhookUrl || "Set NEXT_PUBLIC_PAYMENTS_WEBHOOK_URL"}
                    </small>
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => copyValue(webhookUrl)}
                    disabled={!webhookUrl}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            <p className="muted">
              For Paystack: use the dedicated fields above. Callback and webhook URLs are read-only for
              reference.
            </p>
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
