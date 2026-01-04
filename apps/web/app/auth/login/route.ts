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
  const host = getRequestHost(request);
  const proto = request.headers.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");
  const redirectUri = buildRedirectUri(host, proto);

  if (!COGNITO_CLIENT_ID) {
    return NextResponse.json({ error: "COGNITO client id missing" }, { status: 500 });
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next") || "";
  const safeNext = nextPath.startsWith("/") ? nextPath : "";

  const { verifier, challenge } = createPkce();
  const state = base64UrlEncode(crypto.randomBytes(16));

  const authUrl = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  authUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl.toString(), 302);
  response.cookies.set("cp.oauth_state", state, {
    httpOnly: true,
    secure: !isLocalhost(host),
    sameSite: "lax",
    path: "/"
  });
  response.cookies.set("cp.pkce_verifier", verifier, {
    httpOnly: true,
    secure: !isLocalhost(host),
    sameSite: "lax",
    path: "/"
  });
  if (safeNext) {
    response.cookies.set("cp.post_login", safeNext, {
      httpOnly: true,
      secure: !isLocalhost(host),
      sameSite: "lax",
      path: "/"
    });
  }
  return response;
}
