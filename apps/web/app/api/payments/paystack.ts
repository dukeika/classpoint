import Paystack from "paystack";

export type PaystackEnvironment = "test" | "live";

export type PaystackConfig = {
  environment: PaystackEnvironment;
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  callbackUrl?: string;
  splitCode?: string;
  subaccount?: string;
  platformFeePercent?: number;
  currency?: string;
};

export const getPaystackClient = (secretKey: string) => Paystack(secretKey);

export const parseConfig = (configJson: unknown) => {
  if (!configJson) return {};
  if (typeof configJson === "string") {
    try {
      return JSON.parse(configJson);
    } catch {
      return {};
    }
  }
  if (typeof configJson === "object") return configJson as Record<string, unknown>;
  return {};
};

const normalizeEnv = (value: unknown): PaystackEnvironment =>
  String(value || "")
    .toLowerCase()
    .trim() === "live"
    ? "live"
    : "test";

const pickEnvValue = (config: Record<string, unknown>, key: string, environment: PaystackEnvironment) => {
  const envKey = `${key}_${environment}`;
  if (typeof config[envKey] === "string" && String(config[envKey]).trim()) {
    return String(config[envKey]);
  }
  const camelKey = `${key}${environment === "live" ? "Live" : "Test"}`;
  if (typeof config[camelKey] === "string" && String(config[camelKey]).trim()) {
    return String(config[camelKey]);
  }
  if (typeof config[key] === "string" && String(config[key]).trim()) {
    return String(config[key]);
  }
  return "";
};

export const resolvePaystackConfig = (configJson: unknown): PaystackConfig | null => {
  const raw = parseConfig(configJson);
  const environment = normalizeEnv(raw.environment);
  const publicKey = pickEnvValue(raw, "publicKey", environment);
  const secretKey = pickEnvValue(raw, "secretKey", environment);
  const webhookSecret =
    pickEnvValue(raw, "webhookSecret", environment) || (raw.webhookSecret ? String(raw.webhookSecret) : "");

  return {
    environment,
    publicKey,
    secretKey,
    webhookSecret: webhookSecret || undefined,
    callbackUrl: raw.callbackUrl ? String(raw.callbackUrl) : undefined,
    splitCode: raw.splitCode ? String(raw.splitCode) : undefined,
    subaccount: raw.subaccount ? String(raw.subaccount) : undefined,
    platformFeePercent:
      typeof raw.platformFeePercent === "number"
        ? raw.platformFeePercent
        : Number.isFinite(Number(raw.platformFeePercent))
        ? Number(raw.platformFeePercent)
        : undefined,
    currency: raw.currency ? String(raw.currency) : undefined
  };
};

export const loadClasspointPaystackConfig = (): PaystackConfig | null => {
  const environment = normalizeEnv(process.env.CLASSPOINT_PAYSTACK_ENV);
  const publicKey =
    environment === "live"
      ? process.env.CLASSPOINT_PAYSTACK_PUBLIC_KEY_LIVE
      : process.env.CLASSPOINT_PAYSTACK_PUBLIC_KEY_TEST;
  const secretKey =
    environment === "live"
      ? process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_LIVE
      : process.env.CLASSPOINT_PAYSTACK_SECRET_KEY_TEST;
  if (!publicKey || !secretKey) return null;
  return {
    environment,
    publicKey,
    secretKey
  };
};
