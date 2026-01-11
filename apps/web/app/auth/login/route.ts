import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || "classpoint.ng";
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN || "https://auth.classpoint.ng";
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

const base64UrlEncode = (value: Buffer) =>
  value
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const createPkce = () => {
  const verifier = base64UrlEncode(crypto.randomBytes(32));
  const challenge = base64UrlEncode(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
};

const normalizeHost = (host: string | null) => {
  if (!host) return "";
  return host.split(":")[0].toLowerCase();
};

const getRequestHost = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-host");
  return normalizeHost(forwarded || request.headers.get("host"));
};

const isLocalhost = (host: string) => host === "localhost" || host.endsWith(".localhost");

const buildRedirectUri = (host: string, proto: string) => `${proto}://${host}/auth/callback`;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next") || "";
  const safeNext = nextPath.startsWith("/") ? nextPath : "";
  const target = safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login";
  return NextResponse.redirect(new URL(target, request.url), 302);
}
