import { NextResponse, type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.ROOT_DOMAIN || "classpoint.ng";
const COGNITO_DOMAIN = process.env.COGNITO_DOMAIN || "https://auth.classpoint.ng";
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

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

const getDefaultDestination = (host: string) => {
  if (host === `app.${ROOT_DOMAIN}`) return "/platform";
  if (host.endsWith(`.${ROOT_DOMAIN}`) || host.endsWith(".localhost")) return "/admin";
  return "/";
};

const decodeJwtPayload = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
  try {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  const host = getRequestHost(request);
  const proto = request.headers.get("x-forwarded-proto") || (isLocalhost(host) ? "http" : "https");
  const redirectUri = buildRedirectUri(host, proto);

  if (!COGNITO_CLIENT_ID) {
    return NextResponse.json({ error: "COGNITO client id missing" }, { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const storedState = request.cookies.get("cp.oauth_state")?.value || "";
  const verifier = request.cookies.get("cp.pkce_verifier")?.value || "";
  if (!storedState || storedState !== state || !verifier) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const tokenUrl = `${COGNITO_DOMAIN}/oauth2/token`;
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: COGNITO_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString()
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.id_token) {
    return NextResponse.json({ error: tokenBody.error || "Token exchange failed" }, { status: 400 });
  }

  const expiresIn = Number(tokenBody.expires_in || 3600);
  const refreshTtl = 60 * 60 * 24 * 30;

  const destination = request.cookies.get("cp.post_login")?.value || getDefaultDestination(host);
  const response = NextResponse.redirect(new URL(destination, `${proto}://${host}`), 302);

  response.cookies.set("cp.id_token", tokenBody.id_token, {
    httpOnly: true,
    secure: !isLocalhost(host),
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn
  });
  if (tokenBody.access_token) {
    response.cookies.set("cp.access_token", tokenBody.access_token, {
      httpOnly: true,
      secure: !isLocalhost(host),
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn
    });
  }
  if (tokenBody.refresh_token) {
    response.cookies.set("cp.refresh_token", tokenBody.refresh_token, {
      httpOnly: true,
      secure: !isLocalhost(host),
      sameSite: "lax",
      path: "/",
      maxAge: refreshTtl
    });
  }

  response.cookies.set("cp.oauth_state", "", { path: "/", maxAge: 0 });
  response.cookies.set("cp.pkce_verifier", "", { path: "/", maxAge: 0 });
  response.cookies.set("cp.post_login", "", { path: "/", maxAge: 0 });

  const claims = decodeJwtPayload(tokenBody.id_token);
  if (claims) {
    const raw = Buffer.from(JSON.stringify(claims)).toString("base64");
    const encoded = raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    response.cookies.set("cp.session", encoded, {
      httpOnly: false,
      secure: !isLocalhost(host),
      sameSite: "lax",
      path: "/",
      maxAge: refreshTtl
    });
  }

  return response;
}
